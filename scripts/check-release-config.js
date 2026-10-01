#!/usr/bin/env node
/**
 * Refuses to let a production build ship demo data or developer tokens.
 *
 * Two things this catches that nothing else does:
 *
 *   1. `eas.json`'s production profile setting a mock flag. It set
 *      EXPO_PUBLIC_USE_MOCKS=1 on ALL THREE profiles until 2026-09-10, so every
 *      release binary served invented leads behind a real App Store build.
 *   2. A production build with no EXPO_PUBLIC_API_URL. That used to fall back to
 *      demo data silently; it now fails closed to ConfigErrorScreen, and this
 *      turns "the app shows an error screen" into "the build never happened".
 *
 * Usage:
 *   node scripts/check-release-config.js              # lint eas.json only
 *   node scripts/check-release-config.js --env        # also check this shell's env
 *   EXPO_PUBLIC_API_URL=... node scripts/check-release-config.js --env
 *
 * Exit code 1 on any failure, so it can gate a build script or CI step.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FORBIDDEN_IN_PRODUCTION = [
  'EXPO_PUBLIC_USE_MOCKS',
  'EXPO_PUBLIC_ALLOW_MOCKS',
  'EXPO_PUBLIC_MOCK_EMPTY',
  'EXPO_PUBLIC_MOCK_ERROR',
  'EXPO_PUBLIC_DEV_AUTH',
];

const failures = [];
const notes = [];

// ── 1. eas.json production profile ───────────────────────────────────────────
const easPath = path.join(ROOT, 'eas.json');
if (!fs.existsSync(easPath)) {
  failures.push('eas.json not found');
} else {
  const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  const prod = (eas.build && eas.build.production) || null;
  if (!prod) {
    failures.push('eas.json has no build.production profile');
  } else {
    const env = prod.env || {};
    for (const key of FORBIDDEN_IN_PRODUCTION) {
      if (key in env) {
        failures.push(
          `eas.json build.production.env sets ${key}=${JSON.stringify(env[key])} — ` +
            'a release build must never enable mocks or dev auth'
        );
      }
    }
    if (!('EXPO_PUBLIC_API_URL' in env)) {
      notes.push(
        'eas.json build.production.env does not pin EXPO_PUBLIC_API_URL. That is fine if it ' +
          'is supplied as an EAS environment variable or secret at build time — but it MUST ' +
          'be set, or the release will mount ConfigErrorScreen. Run with --env on the build ' +
          'machine to check the value that will actually be inlined.'
      );
    }
  }
}

// ── 2. the mock gate still exists in client.ts ───────────────────────────────
const clientPath = path.join(ROOT, 'src', 'api', 'client.ts');
if (!fs.existsSync(clientPath)) {
  failures.push('src/api/client.ts not found');
} else {
  const src = fs.readFileSync(clientPath, 'utf8');
  if (!/const\s+MOCKS_ALLOWED\s*=/.test(src)) {
    failures.push(
      'src/api/client.ts no longer defines MOCKS_ALLOWED — the production mock gate is gone'
    );
  }
  if (!/MOCKS_ALLOWED\s*&&/.test(src)) {
    failures.push(
      'src/api/client.ts computes USE_MOCKS without gating on MOCKS_ALLOWED — a release ' +
        'build could fall back to demo data again'
    );
  }
}

// ── 3. optionally, the actual build environment ──────────────────────────────
if (process.argv.includes('--env')) {
  for (const key of FORBIDDEN_IN_PRODUCTION) {
    if (process.env[key]) {
      failures.push(`${key}=${process.env[key]} is set in this environment — unset it before a release build`);
    }
  }
  if (!process.env.EXPO_PUBLIC_API_URL) {
    failures.push(
      'EXPO_PUBLIC_API_URL is not set — a production bundle built here would have no backend ' +
        'to call and would show ConfigErrorScreen'
    );
  } else if (/localhost|127\.0\.0\.1|0\.0\.0\.0|::1/.test(process.env.EXPO_PUBLIC_API_URL)) {
    failures.push(
      `EXPO_PUBLIC_API_URL=${process.env.EXPO_PUBLIC_API_URL} points at loopback — on a real ` +
        'device that is the phone calling itself'
    );
  } else if (!/^https:\/\//.test(process.env.EXPO_PUBLIC_API_URL)) {
    failures.push(
      `EXPO_PUBLIC_API_URL=${process.env.EXPO_PUBLIC_API_URL} is not https — iOS App Transport ` +
        'Security will block it'
    );
  }
}

for (const n of notes) console.log('note: %s', n);
if (failures.length) {
  console.error('\nRelease config check FAILED:\n');
  for (const f of failures) console.error('  ✗ %s', f);
  console.error('');
  process.exit(1);
}
console.log('Release config check PASSED — production cannot ship mocks or dev auth.');
