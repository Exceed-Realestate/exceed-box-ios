#!/usr/bin/env node
/**
 * C4 fix (FABLE-AUDIT.md) — the backend's `tests/test_contract.py` asserts the backend matches
 * SPEC.md; nothing asserted the *app* matches the backend, which is exactly how C3 (voice-memos
 * vs /notes, /notifications/* vs /push/*, a POST /replies/{id}/void that never existed, a missing
 * `platform` on push register, a JSON card-scan body the backend never accepted) sailed through
 * green tests on both sides.
 *
 * This script parses the REAL route strings, HTTP methods, and (best-effort) request bodies out
 * of `src/api/client.ts` — not a hand-maintained list that could itself drift — and compares them
 * against a machine-readable route manifest generated from the live FastAPI app's own
 * `/openapi.json` (never a hardcoded guess of what the backend has). It fails loudly (non-zero
 * exit) on any app route with no backend match. Run: `npm run check-contract`.
 *
 * It spawns `exceed-box-app`'s own server on a scratch port to fetch its OpenAPI schema, and
 * kills it when done. It only ever reads that repo — never writes to it.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ts = require('typescript');

const REPO_ROOT = path.resolve(__dirname, '..');
const CLIENT_PATH = path.join(REPO_ROOT, 'src/api/client.ts');
const BACKEND_ROOT = process.env.EXCEED_BOX_APP_PATH || '/Users/a44/code/exceed-box-app';
const BACKEND_API_PY = path.join(BACKEND_ROOT, 'app/api.py');
const PORT = process.env.CONTRACT_CHECK_PORT || '8973';
const OPENAPI_URL = `http://127.0.0.1:${PORT}/openapi.json`;

// Mock-mode-only client methods have no real HTTP call at all (e.g. draftReply's real branch
// throws a stub error rather than hitting a route with a meaningful response) — nothing to skip
// today, but this is where a genuinely route-less method would be declared, with a reason, so a
// missing entry is a deliberate decision and not silent.
const SKIP_METHODS = new Set([]);

function log(...args) {
  process.stdout.write(args.join(' ') + '\n');
}

// ---------------------------------------------------------------------------
// 1. Extract every real (non-mock) route/method/body call out of client.ts via the TS AST.
// ---------------------------------------------------------------------------
function normalizePath(p) {
  if (!p) return p;
  return (
    p
      .split('?')[0]
      .replace(/\{[^}]*\}/g, '{}')
      .replace(/\/+$/, '') || '/'
  );
}

function extractAppCalls() {
  const source = fs.readFileSync(CLIENT_PATH, 'utf8');
  const sf = ts.createSourceFile(CLIENT_PATH, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  function findApiObject(node) {
    let found = null;
    ts.forEachChild(node, (n) => {
      if (found) return;
      if (ts.isVariableStatement(n)) {
        for (const decl of n.declarationList.declarations) {
          if (
            ts.isIdentifier(decl.name) &&
            decl.name.text === 'api' &&
            decl.initializer &&
            ts.isObjectLiteralExpression(decl.initializer)
          ) {
            found = decl.initializer;
          }
        }
      }
      if (!found) found = findApiObject(n);
    });
    return found;
  }

  const apiObj = findApiObject(sf);
  if (!apiObj) throw new Error('Could not find `export const api = {...}` in src/api/client.ts');

  const calls = [];

  function templatePath(node) {
    if (!node) return null;
    if (ts.isStringLiteralLike(node) && !ts.isTemplateExpression(node)) return node.text;
    if (ts.isTemplateExpression(node)) {
      let out = node.head.text;
      for (const span of node.templateSpans) {
        const exprText = span.expression.getText(sf).trim();
        if (exprText.startsWith('qs(')) return out; // query string starts here — path ends
        out += '{}';
        out += span.literal.text;
      }
      return out;
    }
    return null;
  }

  function objectLiteralKeys(objLit) {
    const keys = [];
    for (const p of objLit.properties) {
      if (p.name) keys.push(p.name.getText(sf).replace(/^['"]|['"]$/g, ''));
    }
    return keys;
  }

  for (const prop of apiObj.properties) {
    let methodName = null;
    let body = null;
    if (ts.isMethodDeclaration(prop)) {
      methodName = prop.name.getText(sf);
      body = prop.body;
    } else if (ts.isPropertyAssignment(prop) && prop.name) {
      methodName = prop.name.getText(sf);
      if (prop.initializer && (ts.isArrowFunction(prop.initializer) || ts.isFunctionExpression(prop.initializer))) {
        body = prop.initializer.body;
      }
    }
    if (!methodName || !body || SKIP_METHODS.has(methodName)) continue;

    // Local `const NAME = {...}` object literals declared inside this method — resolves the
    // common `const body = {...}; ...; body: JSON.stringify(body)` pattern.
    const localObjects = new Map();
    (function collectLocals(node) {
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
            localObjects.set(decl.name.text, decl.initializer);
          }
        }
      }
      ts.forEachChild(node, collectLocals);
    })(body);

    /** Resolves the object literal a JSON.stringify() argument ultimately points at, and — if it
     * has a literal `action: '...'` property (this backend's dispatch convention for multi-purpose
     * routes like /replies/{id}/send) — its value, so the required-key heuristic below can tell
     * "sends a different action" apart from "missing a field". */
    function resolveBody(argExpr) {
      let target = argExpr;
      if (ts.isIdentifier(target) && localObjects.has(target.text)) target = localObjects.get(target.text);
      if (!target || !ts.isObjectLiteralExpression(target)) return { keys: null, actionValue: undefined };
      let actionValue;
      for (const p of target.properties) {
        if (ts.isPropertyAssignment(p) && p.name && p.name.getText(sf) === 'action' && ts.isStringLiteralLike(p.initializer)) {
          actionValue = p.initializer.text;
        }
      }
      return { keys: objectLiteralKeys(target), actionValue };
    }

    const methodCalls = [];
    (function walkCalls(node) {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        const calleeName = ts.isIdentifier(callee) ? callee.text : null;
        if (calleeName === 'request' || calleeName === 'requestMultipart') {
          const pathTemplate = templatePath(node.arguments[0]);
          let httpMethod = calleeName === 'requestMultipart' ? 'POST' : 'GET';
          let bodyKeys = null;
          let actionValue;
          if (calleeName === 'request' && node.arguments[1] && ts.isObjectLiteralExpression(node.arguments[1])) {
            for (const p of node.arguments[1].properties) {
              if (!p.name) continue;
              const key = p.name.getText(sf);
              if (key === 'method' && p.initializer && ts.isStringLiteralLike(p.initializer)) {
                httpMethod = p.initializer.text;
              }
              if (
                key === 'body' &&
                p.initializer &&
                ts.isCallExpression(p.initializer) &&
                p.initializer.expression.getText(sf) === 'JSON.stringify' &&
                p.initializer.arguments[0]
              ) {
                ({ keys: bodyKeys, actionValue } = resolveBody(p.initializer.arguments[0]));
              }
            }
          }
          if (pathTemplate != null) {
            methodCalls.push({ appMethod: methodName, httpMethod, rawPath: pathTemplate, bodyKeys, actionValue, kind: calleeName, formKeys: null });
          }
        }
      }
      ts.forEachChild(node, walkCalls);
    })(body);

    if (methodCalls.some((c) => c.kind === 'requestMultipart')) {
      const formKeys = [];
      (function collectFormAppend(node) {
        if (ts.isCallExpression(node)) {
          const callee = node.expression;
          if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'append') {
            const arg0 = node.arguments[0];
            if (arg0 && ts.isStringLiteralLike(arg0)) formKeys.push(arg0.text);
          }
        }
        ts.forEachChild(node, collectFormAppend);
      })(body);
      for (const c of methodCalls) if (c.kind === 'requestMultipart') c.formKeys = formKeys;
    }

    calls.push(...methodCalls);
  }
  return calls;
}

// ---------------------------------------------------------------------------
// 2. Fetch the backend's live OpenAPI schema (source of truth for routes; never hardcoded here).
// ---------------------------------------------------------------------------
function waitFor(url, attempts, delayMs) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const tick = () => {
      tries += 1;
      fetch(url)
        .then((res) => (res.ok ? resolve(res) : Promise.reject(new Error(`HTTP ${res.status}`))))
        .catch((err) => {
          if (tries >= attempts) reject(err);
          else setTimeout(tick, delayMs);
        });
    };
    tick();
  });
}

async function fetchBackendOpenApi() {
  if (!fs.existsSync(BACKEND_API_PY)) {
    throw new Error(`Backend not found at ${BACKEND_API_PY} (set EXCEED_BOX_APP_PATH to override).`);
  }
  log(`Starting exceed-box-app on 127.0.0.1:${PORT} (read-only — this script never writes to that repo)...`);
  const child = spawn('python3', ['-m', 'uvicorn', 'app.api:app', '--port', PORT], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, EXCEEDBOX_DEV_AUTH: '1' },
    stdio: 'ignore',
  });
  const kill = () => {
    try {
      child.kill('SIGTERM');
    } catch {
      // already dead
    }
  };
  try {
    const res = await waitFor(OPENAPI_URL, 40, 250);
    const schema = await res.json();
    return schema;
  } finally {
    kill();
  }
}

function buildBackendRouteManifest(openapi) {
  const routes = []; // { method, path, normalized, requestBodySchema }
  for (const [rawPath, methods] of Object.entries(openapi.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
      let requestBodySchema = null;
      const rb = op.requestBody;
      const multipart = rb && rb.content && rb.content['multipart/form-data'];
      if (multipart && multipart.schema && multipart.schema.$ref) {
        const schemaName = multipart.schema.$ref.split('/').pop();
        requestBodySchema = (openapi.components && openapi.components.schemas && openapi.components.schemas[schemaName]) || null;
      }
      routes.push({
        method: method.toUpperCase(),
        path: rawPath,
        normalized: normalizePath(rawPath),
        requestBodySchema,
      });
    }
  }
  return routes;
}

// ---------------------------------------------------------------------------
// 3. Advisory-only JSON-body key scan of api.py, for routes OpenAPI can't describe (the backend
//    mostly parses JSON bodies by hand via `await req.json()` rather than typed Pydantic params,
//    so OpenAPI has no schema for them at all). This can only ever WARN, never fail the build —
//    it is a heuristic regex over Python source, not a real parser.
// ---------------------------------------------------------------------------
/** Maps simple `VAR = body.get("key")` / `VAR1, VAR2 = body.get("k1"), body.get("k2")` assignment
 * lines to {varName -> bodyKey}, so a later `if not VAR: raise err(422...)` can be traced back to
 * which JSON key is actually required. */
function extractVarToKeyMap(blockText) {
  const map = new Map();
  const lineRe = /^([\w\s,]+?)=(.*body\.get\(.*)$/gm;
  let lm;
  while ((lm = lineRe.exec(blockText))) {
    const lhsNames = lm[1]
      .trim()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const rhsKeys = [];
    const keyRe = /body\.get\(\s*["'](\w+)["']/g;
    let km;
    while ((km = keyRe.exec(lm[2]))) rhsKeys.push(km[1]);
    lhsNames.forEach((name, i) => {
      if (rhsKeys[i]) map.set(name, rhsKeys[i]);
    });
  }
  return map;
}

/** Finds `if not VAR ... : raise err(4xx...)` / `if VAR not in (...): raise err(4xx...)` guard
 * clauses and resolves VAR back to a body key via varToKey — a best-effort "this field is
 * required" signal, heuristic like everything else in this section. */
function extractRequiredKeys(blockText, varToKey) {
  const required = new Set();
  const condRe = /if\s+((?:not\s+\w+|\w+\s+not in\s*\([^)]*\))(?:\s*(?:or|and)\s*(?:not\s+\w+|\w+\s+not in\s*\([^)]*\)))*)\s*:\s*\n\s*raise err\(4\d\d/g;
  let cm;
  while ((cm = condRe.exec(blockText))) {
    const cond = cm[1];
    const varRe = /\bnot\s+(\w+)\b|(\w+)\s+not in\b/g;
    let vm;
    while ((vm = varRe.exec(cond))) {
      const name = vm[1] || vm[2];
      if (varToKey.has(name)) required.add(varToKey.get(name));
    }
  }
  return required;
}

function backendKnownBodyKeysByRoute() {
  if (!fs.existsSync(BACKEND_API_PY)) return new Map();
  const src = fs.readFileSync(BACKEND_API_PY, 'utf8');
  const lines = src.split('\n');
  const decoratorLineRe = /^@app\.(get|post|put|patch|delete)\("([^"]+)"\)/;
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const dm = lines[i].match(decoratorLineRe);
    if (!dm) continue;
    // find end of this route block: next line starting with '@app.' at col 0, or EOF
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^@app\./.test(lines[j])) {
        end = j;
        break;
      }
    }
    blocks.push({ method: dm[1].toUpperCase(), path: dm[2], text: lines.slice(i, end).join('\n') });
  }
  const map = new Map();
  for (const b of blocks) {
    const keys = new Set();
    const getRe = /\bbody\.get\(\s*["']([\w-]+)["']/g;
    let gm;
    while ((gm = getRe.exec(b.text))) keys.add(gm[1]);
    const idxRe = /\bbody\[\s*["']([\w-]+)["']\s*\]/g;
    while ((gm = idxRe.exec(b.text))) keys.add(gm[1]);
    if (!keys.size) continue;
    const varToKey = extractVarToKeyMap(b.text);
    const required = extractRequiredKeys(b.text, varToKey);
    // Multi-purpose routes (e.g. POST /replies/{id}/send takes action='send'|'not_real') often
    // guard their "required field" checks behind `if action != 'X': raise err(4xx...)` — a field
    // only required on the 'X' branch must not be flagged missing for a call using a different
    // action value.
    const guardMatch = b.text.match(/if\s+action\s*!=\s*['"](\w+)['"]\s*:\s*\n\s*raise err\(4\d\d/);
    map.set(`${b.method} ${normalizePath(b.path)}`, { keys, required, actionGuard: guardMatch ? guardMatch[1] : null });
  }
  return map;
}

// ---------------------------------------------------------------------------
// 4. Compare and report.
// ---------------------------------------------------------------------------
async function main() {
  const appCalls = extractAppCalls();
  const openapi = await fetchBackendOpenApi();
  const backendRoutes = buildBackendRouteManifest(openapi);
  const backendBodyKeys = backendKnownBodyKeysByRoute();

  log(`\nParsed ${appCalls.length} real (non-mock) call sites from src/api/client.ts.`);
  log(`Fetched ${backendRoutes.length} live routes from ${OPENAPI_URL}.\n`);

  const backendByKey = new Map();
  for (const r of backendRoutes) {
    const key = `${r.method} ${r.normalized}`;
    if (!backendByKey.has(key)) backendByKey.set(key, []);
    backendByKey.get(key).push(r);
  }

  let hardFailures = 0;
  let warnings = 0;

  for (const call of appCalls) {
    const normalized = normalizePath(call.rawPath);
    const key = `${call.httpMethod} ${normalized}`;
    const matches = backendByKey.get(key);

    if (!matches) {
      hardFailures += 1;
      log(`FAIL  ${call.appMethod}(): ${call.httpMethod} ${call.rawPath}  -> no backend route matches "${key}"`);
      const sameMethod = backendRoutes.filter((r) => r.method === call.httpMethod);
      const samePath = backendRoutes.filter((r) => r.normalized === normalized);
      if (samePath.length) log(`        (backend has ${call.httpMethod === samePath[0].method ? '' : 'a different method on '}this path: ${samePath.map((r) => `${r.method} ${r.path}`).join(', ')})`);
      else if (sameMethod.length) log(`        (backend ${call.httpMethod} routes: ${sameMethod.map((r) => r.path).slice(0, 6).join(', ')}${sameMethod.length > 6 ? ', ...' : ''})`);
      continue;
    }

    log(`ok    ${call.appMethod}(): ${call.httpMethod} ${call.rawPath}`);

    // Multipart body: OpenAPI gives a real, typed schema — mismatches here are hard failures.
    const schema = matches[0].requestBodySchema;
    if (call.kind === 'requestMultipart' && schema) {
      const required = new Set(schema.required || []);
      const known = new Set(Object.keys(schema.properties || {}));
      const sent = new Set(call.formKeys || []);
      const missingRequired = [...required].filter((k) => !sent.has(k));
      const unknownSent = [...sent].filter((k) => !known.has(k));
      if (missingRequired.length) {
        hardFailures += 1;
        log(`FAIL    multipart field(s) required by the backend but never sent: ${missingRequired.join(', ')}`);
      }
      if (unknownSent.length) {
        warnings += 1;
        log(`WARN    multipart field(s) sent that the backend schema doesn't declare: ${unknownSent.join(', ')}`);
      }
    }

    // JSON body: advisory only (api.py mostly hand-parses `await req.json()`, so OpenAPI has no
    // schema to check against — this is a regex heuristic over the Python source, not proof).
    if (call.kind === 'request') {
      const routeBody = backendBodyKeys.get(key);
      if (routeBody && call.bodyKeys) {
        const unknown = call.bodyKeys.filter((k) => !routeBody.keys.has(k) && k !== 'action'); // 'action' dispatches behaviour, not a stored field
        if (unknown.length) {
          warnings += 1;
          log(`WARN    body key(s) the backend source never reads via body.get()/body[...] for this route: ${unknown.join(', ')} (heuristic — may be a false positive)`);
        }
      }
      // Only meaningful when the body was actually resolved statically (a literal object, in-call
      // or via a local `const NAME = {...}`) — `call.bodyKeys === null` means "built dynamically,
      // not statically resolvable" (e.g. `JSON.stringify(input)` from a function parameter), which
      // must never be treated as "sends nothing" or every such call would false-positive here.
      const differentActionBranch = routeBody && routeBody.actionGuard && call.actionValue && call.actionValue !== routeBody.actionGuard;
      if (routeBody && routeBody.required.size && call.bodyKeys && !differentActionBranch) {
        const sentKeys = new Set(call.bodyKeys);
        const missing = [...routeBody.required].filter((k) => !sentKeys.has(k));
        if (missing.length) {
          warnings += 1;
          log(`WARN    backend appears to require these body key(s) (raises 422 without them) that the app doesn't send: ${missing.join(', ')} (heuristic — may be a false positive, e.g. a different action= branch of a multi-purpose route)`);
        }
      }
    }
  }

  log(`\n${appCalls.length} call sites checked — ${hardFailures} hard failure(s), ${warnings} warning(s).`);
  if (hardFailures > 0) {
    log('\nFAILED — the app calls at least one route/required-field the backend does not have. Fix src/api/client.ts or the backend before shipping.');
    process.exitCode = 1;
  } else {
    log('\nPASSED — every real route src/api/client.ts calls exists on the live backend, with the right method.');
  }
}

main().catch((err) => {
  console.error('check-contract crashed:', err.stack || err.message || err);
  process.exitCode = 1;
});
