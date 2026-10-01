/**
 * Standalone unit tests for `guessFields`, run without any test framework so the
 * module never needs a jest/testing dependency added to the host app's package.json.
 *
 * Run with:
 *   npx tsc -p modules/expo-text-recognition/tsconfig.test.json
 *   node modules/expo-text-recognition/.test-build/__tests__/fieldGuesser.test.js
 */
import { guessFields } from '../fieldGuesser';
import type { TextBlock } from '../ExpoTextRecognition.types';
import type { GuessedFields } from '../fieldGuesser.types';

let failures = 0;
let passed = 0;

function ok(description: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1;
    console.log(`  ok  - ${description}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${description}${detail ? `\n         ${detail}` : ''}`);
  }
}

/** Builds a TextBlock with a normalized top-left-origin box, stacking downward. */
function block(text: string, y: number, opts: { x?: number; w?: number; h?: number; confidence?: number } = {}): TextBlock {
  return {
    text,
    confidence: opts.confidence ?? 0.95,
    box: { x: opts.x ?? 0.08, y, w: opts.w ?? 0.6, h: opts.h ?? 0.05 },
  };
}

function assertField(
  fields: GuessedFields,
  key: keyof GuessedFields,
  expected: { value?: string; nonEmpty?: boolean; minConfidence?: number } | 'empty',
  caseLabel: string
): void {
  const field = fields[key];
  if (expected === 'empty') {
    ok(`${caseLabel}: ${key} is left blank (declines to guess)`, field.value === '' && field.confidence === 0, `got ${JSON.stringify(field)}`);
    return;
  }
  if (expected.value !== undefined) {
    ok(`${caseLabel}: ${key} === ${JSON.stringify(expected.value)}`, field.value === expected.value, `got ${JSON.stringify(field)}`);
  } else if (expected.nonEmpty) {
    ok(`${caseLabel}: ${key} is non-empty`, field.value !== '' && field.confidence > 0, `got ${JSON.stringify(field)}`);
  }
  if (expected.minConfidence !== undefined) {
    ok(
      `${caseLabel}: ${key} confidence >= ${expected.minConfidence}`,
      field.confidence >= expected.minConfidence,
      `got confidence ${field.confidence}`
    );
  }
  // Global product rule: any non-empty value must carry confidence > 0, and vice versa.
  ok(
    `${caseLabel}: ${key} value/confidence are consistent (never a value with 0 confidence)`,
    (field.value === '' && field.confidence === 0) || (field.value !== '' && field.confidence > 0)
  );
}

// ---------------------------------------------------------------------------
// Case 1 — plain English card.
// ---------------------------------------------------------------------------
{
  const label = 'Case 1 (English card)';
  const blocks: TextBlock[] = [
    block('ACME Corp.', 0.05),
    block('John Smith', 0.15),
    block('Sales Director', 0.22),
    block('john.smith@acme.com', 0.35),
    block('(415) 555-0182', 0.42),
    block('123 Market Street, Suite 400, San Francisco, CA 94105', 0.55),
  ];
  const fields = guessFields(blocks);
  assertField(fields, 'company', { value: 'ACME Corp.', minConfidence: 0.8 }, label);
  assertField(fields, 'title', { value: 'Sales Director', minConfidence: 0.6 }, label);
  assertField(fields, 'email', { value: 'john.smith@acme.com', minConfidence: 0.9 }, label);
  assertField(fields, 'phone', { value: '(415) 555-0182', minConfidence: 0.8 }, label);
  assertField(fields, 'address', { nonEmpty: true, minConfidence: 0.6 }, label);
  assertField(fields, 'name', { value: 'John Smith', minConfidence: 0.5 }, label);
  assertField(fields, 'reading', 'empty', label);
}

// ---------------------------------------------------------------------------
// Case 2 — Japanese card, 株式会社 + furigana pairing.
// ---------------------------------------------------------------------------
{
  const label = 'Case 2 (JP card, 株式会社 + furigana)';
  const blocks: TextBlock[] = [
    block('株式会社エクシード', 0.05),
    block('タナカ タロウ', 0.15, { h: 0.03 }),
    block('田中 太郎', 0.2),
    block('営業部長', 0.27),
    block('090-1234-5678', 0.4),
    block('tanaka@exceed-re.jp', 0.47),
    block('〒150-0001 東京都渋谷区神宮前1-2-3', 0.55),
  ];
  const fields = guessFields(blocks);
  assertField(fields, 'company', { value: '株式会社エクシード', minConfidence: 0.8 }, label);
  assertField(fields, 'reading', { value: 'タナカ タロウ', minConfidence: 0.6 }, label);
  assertField(fields, 'name', { value: '田中 太郎', minConfidence: 0.7 }, label);
  assertField(fields, 'title', { value: '営業部長', minConfidence: 0.6 }, label);
  assertField(fields, 'phone', { value: '090-1234-5678', minConfidence: 0.8 }, label);
  assertField(fields, 'email', { value: 'tanaka@exceed-re.jp', minConfidence: 0.9 }, label);
  assertField(fields, 'address', { nonEmpty: true, minConfidence: 0.7 }, label);
}

// ---------------------------------------------------------------------------
// Case 3 — Japanese card, 有限会社 + furigana, +81 international phone, 代表取締役.
// ---------------------------------------------------------------------------
{
  const label = 'Case 3 (JP card, 有限会社 + furigana, +81)';
  const blocks: TextBlock[] = [
    block('有限会社ヤマトデザイン', 0.05),
    block('ヤマダ ハナコ', 0.14, { h: 0.03 }),
    block('山田 花子', 0.19),
    block('代表取締役', 0.26),
    block('+81 90-1234-5678', 0.38),
    block('hanako@yamato-design.co.jp', 0.45),
    block('大阪府大阪市北区梅田1-1-1 梅田ビル5F', 0.53),
  ];
  const fields = guessFields(blocks);
  assertField(fields, 'company', { value: '有限会社ヤマトデザイン', minConfidence: 0.8 }, label);
  assertField(fields, 'reading', { value: 'ヤマダ ハナコ', minConfidence: 0.6 }, label);
  assertField(fields, 'name', { value: '山田 花子', minConfidence: 0.7 }, label);
  assertField(fields, 'title', { value: '代表取締役', minConfidence: 0.6 }, label);
  assertField(fields, 'phone', { nonEmpty: true, minConfidence: 0.5 }, label);
  assertField(fields, 'email', { value: 'hanako@yamato-design.co.jp', minConfidence: 0.9 }, label);
  assertField(fields, 'address', { nonEmpty: true, minConfidence: 0.7 }, label);
}

// ---------------------------------------------------------------------------
// Case 4 — no extractable fields at all: proves the guesser declines rather than
// inventing values (a slogan, a website, a booth number — nothing regex/keyword-solvable).
// ---------------------------------------------------------------------------
{
  const label = 'Case 4 (mostly empty — declines to guess)';
  const blocks: TextBlock[] = [
    block('EST. 1998', 0.05),
    block('Building Tomorrow Together', 0.15),
    block('www.example-industries.com', 0.25),
    block('Suite', 0.3),
    block('Booth 12B', 0.35),
  ];
  const fields = guessFields(blocks);
  assertField(fields, 'name', 'empty', label);
  assertField(fields, 'reading', 'empty', label);
  assertField(fields, 'company', 'empty', label);
  assertField(fields, 'title', 'empty', label);
  assertField(fields, 'email', 'empty', label);
  assertField(fields, 'phone', 'empty', label);
  assertField(fields, 'address', 'empty', label);
}

// ---------------------------------------------------------------------------
// Case 5 — email/phone/address/company are solvable, but two remaining lines are
// genuinely ambiguous for "name": proves the guesser declines per-field, not all-or-nothing.
// ---------------------------------------------------------------------------
{
  const label = 'Case 5 (ambiguous name among otherwise-solvable fields)';
  const blocks: TextBlock[] = [
    block('GLOBAL TRADE LLC', 0.05),
    block('Import / Export Division', 0.13),
    block('Business Development', 0.2),
    block('info@globaltrade.example', 0.3),
    block('+1 212-555-0199', 0.38),
    block('One World Plaza, 45th Floor, New York, NY 10001', 0.48),
  ];
  const fields = guessFields(blocks);
  assertField(fields, 'company', { value: 'GLOBAL TRADE LLC', minConfidence: 0.8 }, label);
  assertField(fields, 'email', { value: 'info@globaltrade.example', minConfidence: 0.9 }, label);
  assertField(fields, 'phone', { nonEmpty: true, minConfidence: 0.5 }, label);
  assertField(fields, 'address', { nonEmpty: true, minConfidence: 0.6 }, label);
  assertField(fields, 'name', 'empty', label); // ambiguous — must not guess
  assertField(fields, 'reading', 'empty', label);
}

// ---------------------------------------------------------------------------
// Case 6 — TEL vs FAX disambiguation: both are phone-shaped, only the TEL-labelled
// line should win, and the FAX line must not leak into the "name" candidate pool.
// ---------------------------------------------------------------------------
{
  const label = 'Case 6 (TEL vs FAX disambiguation)';
  const blocks: TextBlock[] = [
    block('Sunrise Realty Group', 0.05),
    block('Emily Chen', 0.13),
    block('Senior Sales Manager', 0.2),
    block('TEL: 03-4567-8901', 0.3),
    block('FAX: 03-4567-8902', 0.36),
    block('emily.chen@sunrise-realty.example', 0.45),
  ];
  const fields = guessFields(blocks);
  assertField(fields, 'company', { value: 'Sunrise Realty Group', minConfidence: 0.8 }, label);
  assertField(fields, 'name', { value: 'Emily Chen', minConfidence: 0.5 }, label);
  assertField(fields, 'title', { value: 'Senior Sales Manager', minConfidence: 0.6 }, label);
  assertField(fields, 'phone', { value: '03-4567-8901', minConfidence: 0.7 }, label);
  assertField(fields, 'email', { value: 'emily.chen@sunrise-realty.example', minConfidence: 0.9 }, label);
}

// ---------------------------------------------------------------------------
// Case 7 — empty/degenerate input must not throw.
// ---------------------------------------------------------------------------
{
  const label = 'Case 7 (empty input)';
  const fields = guessFields([]);
  for (const key of Object.keys(fields) as (keyof GuessedFields)[]) {
    assertField(fields, key, 'empty', label);
  }
}

// ---------------------------------------------------------------------------
// Round-2 audit N5 regressions — three cases Fable reproduced live where the guesser
// surfaced an invented/mis-slotted value above the fill threshold. All three must now
// come back empty.
// ---------------------------------------------------------------------------

// Case 8 (N5 regression #1) — a tagline must not win `name` by elimination. Before the
// fix: company/title/email/phone/address all parse, leaving the tagline as "the one
// remaining unclaimed line", which the old last-one-standing fallback assigned to `name`
// at 0.6 confidence. Reproduces the audit's exact input.
{
  const label = 'Case 8 (N5 regression: tagline-as-name)';
  const blocks: TextBlock[] = [
    block('ACME Corp.', 0.05),
    block('Sales Director', 0.13),
    block('john.smith@acme.com', 0.22),
    block('(415) 555-0182', 0.3),
    block('123 Market Street, Suite 400, San Francisco, CA 94105', 0.4),
    block('Your trusted partner in real estate', 0.5),
  ];
  const fields = guessFields(blocks);
  assertField(fields, 'company', { value: 'ACME Corp.' }, label);
  assertField(fields, 'title', { value: 'Sales Director' }, label);
  assertField(fields, 'email', { value: 'john.smith@acme.com' }, label);
  assertField(fields, 'phone', { value: '(415) 555-0182' }, label);
  assertField(fields, 'name', 'empty', label); // the tagline must not surface as a name
}

// Case 9 (N5 regression #2) — a department must not win `name` via furigana-adjacency.
// Before the fix: the kana-line-then-next-line pairing assigned whatever sits directly
// below a kana reading to `name` with no validation it names a person, so a department
// line won at 0.8 confidence. Reproduces the audit's exact input.
{
  const label = 'Case 9 (N5 regression: department-as-name)';
  const blocks: TextBlock[] = [block('えいぎょう', 0.1), block('営業部', 0.16)];
  const fields = guessFields(blocks);
  assertField(fields, 'name', 'empty', label); // a department is not a person's name
}

// Case 10 (N5 regression #3) — a shakily-read phone must not surface at high confidence.
// Before the fix: the guesser never read Vision's per-block `confidence` at all, so a
// phone-shaped block read at Vision confidence 0.15 still surfaced at structural
// confidence 0.9 (exact match). Reproduces the audit's exact scenario.
{
  const label = 'Case 10 (N5 regression: shaky-OCR phone)';
  const blocks: TextBlock[] = [block('090-0000-0000', 0.1, { confidence: 0.15 })];
  const fields = guessFields(blocks);
  assertField(fields, 'phone', 'empty', label); // 0.9 structural * 0.15 OCR = 0.135, below MIN_CONFIDENCE
}

// ---------------------------------------------------------------------------
// Round-2 audit N6 regression — the furigana guess must reach the form's `reading`
// field, not a phantom `name_kana` key the UI never shows. Mirrors CardScanScreen.tsx's
// own fill loop against a `CardScanFields`-shaped object (src/api/types.ts) to prove the
// keys actually line up end to end, not just inside the guesser's own type.
// ---------------------------------------------------------------------------
{
  const label = "Case 11 (N6 regression: furigana reaches the form's `reading` field)";
  const blocks: TextBlock[] = [
    block('株式会社エクシード', 0.05),
    block('タナカ タロウ', 0.15, { h: 0.03 }),
    block('田中 太郎', 0.2),
  ];
  const guessed = guessFields(blocks);

  type CardScanFieldsLike = { name: string; reading: string; company: string; title: string; email: string; phone: string; address: string };
  const EMPTY_FORM: CardScanFieldsLike = { name: '', reading: '', company: '', title: '', email: '', phone: '', address: '' };
  // Exactly CardScanScreen.tsx's readCard() fill loop: only fills empty fields, keyed by
  // whatever guessFields() returns.
  const filled: CardScanFieldsLike = { ...EMPTY_FORM };
  (Object.keys(guessed) as (keyof CardScanFieldsLike)[]).forEach((k) => {
    const g = guessed[k as keyof typeof guessed];
    if (g && g.value && !filled[k]) filled[k] = g.value;
  });

  ok(`${label}: reading is filled on the form`, filled.reading === 'タナカ タロウ', `got ${JSON.stringify(filled)}`);
  ok(`${label}: name is filled on the form`, filled.name === '田中 太郎', `got ${JSON.stringify(filled)}`);
  ok(`${label}: no phantom 'name_kana' key leaks out of the guesser`, !('name_kana' in guessed));
}

console.log(`\n${passed} passed, ${failures} failed`);
if (failures > 0) {
  process.exit(1);
}
