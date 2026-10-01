import type { TextBlock } from './ExpoTextRecognition.types';
import type { FieldGuesserInput, GuessedField, GuessedFieldKey, GuessedFields } from './fieldGuesser.types';

/**
 * Turns raw OCR blocks (from `recognizeText`) into a best-effort guess for each
 * business-card field. This is pure TypeScript — no native dependency — specifically
 * so it can be unit tested without a device/simulator.
 *
 * Product rule (do not relax this): **never show an invented value**. Every field
 * defaults to `{ value: '', confidence: 0 }` and is only filled in when a specific,
 * checkable signal (a regex match, a known keyword, a geometric pairing) clears
 * `MIN_CONFIDENCE`. When multiple blocks are equally plausible candidates for a field
 * and nothing disambiguates them (most commonly `name`), the guesser declines and
 * leaves the field blank rather than picking one arbitrarily.
 *
 * Every field's confidence is the *structural* signal (regex/keyword/layout match)
 * multiplied by Vision's own per-block OCR `confidence` — a badly-read block can never
 * produce a high-confidence field, however clean the layout looks (round-2 audit N5: a
 * phone read at Vision confidence 0.15 was previously surfaced at 0.8). `name` in
 * particular requires positive evidence it names a person (furigana pairing with a
 * name-shaped neighbour, or a name-shaped last-line-standing) — "the one remaining
 * unclaimed line" is not evidence by itself, which is how a tagline or a department name
 * won before this fix.
 */

/** Minimum confidence required for a guess to be returned instead of blank. */
const MIN_CONFIDENCE = 0.5;

function emptyField(): GuessedField {
  return { value: '', confidence: 0 };
}

function emptyFields(): GuessedFields {
  return {
    name: emptyField(),
    reading: emptyField(),
    company: emptyField(),
    title: emptyField(),
    email: emptyField(),
    phone: emptyField(),
    address: emptyField(),
  };
}

// --- Signals ------------------------------------------------------------------

const EMAIL_RE = /[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

// Japanese local numbers (0X-XXXX-XXXX / 0XX-XXX-XXXX / 0XXXX-XX-XXXX, etc.),
// Japanese international (+81 ...), and a generic Western 3-3-4 grouping.
const PHONE_RE =
  /(\+81[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})|(0\d{1,4}[-\s]\d{1,4}[-\s]\d{3,4})|(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/;

const FAX_LABEL_RE = /\bFAX\b|ＦＡＸ/i;
const PHONE_LABEL_RE = /\bTEL\b|\bMobile\b|\bCell\b|携帯|電話/i;

const JP_COMPANY_RE = /(株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|一般財団法人)/;
const EN_COMPANY_RE = /\b(Inc\.?|Corp\.?|Corporation|Co\.,?\s?Ltd\.?|LLC|LLP|K\.K\.|Group)/;

const TITLE_RE =
  /(代表取締役|取締役|常務|専務|営業部長|部長|次長|課長|係長|支店長|マネージャー|主任|会長|社長|\bCEO\b|\bCTO\b|\bCFO\b|\bCOO\b|\bVP\b|President|Director|Manager|Founder|Vice President|Executive|Representative)/i;

// Furigana / a standalone kana reading: hiragana + katakana + the prolonged-sound
// mark + middle dot + spaces only, nothing else (no kanji, no latin letters).
const KANA_ONLY_RE = /^[ぁ-んァ-ヶー\s・]+$/u;

const JP_ADDRESS_RE = /(〒\s?\d{3}-\d{4}|丁目|番地|[都道府県].{1,4}[市区町村])/;
// A common street/building-type word *and* at least one digit somewhere in the block
// (so a bare word like "Suite" with no numbers, e.g. a stray label, doesn't count).
const EN_ADDRESS_KEYWORD_RE =
  /\b(Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd|Suite|Ste\.|Floor|Fl\.|Building|Bldg\.|Drive|Dr\.|Plaza|Highway|Hwy)/i;
const HAS_DIGIT_RE = /\d/;
function looksLikeEnAddress(text: string): boolean {
  return EN_ADDRESS_KEYWORD_RE.test(text) && HAS_DIGIT_RE.test(text);
}

// --- Name-shape validation (round-2 audit N5) ------------------------------------
// A block only becomes `name` when it has *positive* evidence of being a person's name.
// "It's the only unclaimed line left" is not evidence — that's exactly how a tagline
// ("Your trusted partner in real estate") and a department ("営業部" sitting under a kana
// reading) previously won. Two shapes are accepted: a short JP kanji/kana personal name,
// or a 2-4 word Western name in Title Case. Anything with a digit, an '@', a URL, a known
// organisational/job-function word, or that reads as a sentence/slogan is rejected.

const EN_NON_NAME_WORD_RE =
  /\b(Partner|Trusted|Solutions?|Group|Team|Division|Department|Dept\.?|Company|Global|Trade|Booth|Suite|Floor|Building|Realty|Realtors?|Services?|Corp\.?|Inc\.?|LLC|LLP|Ltd\.?)\b/i;

// Kanji/kana organisational or job-function words — a furigana-paired line that's actually
// a department/team (not a person) commonly contains one of these.
const JP_NON_NAME_RE = /(部|課|室|係|支店|本部|事業部|グループ|チーム|センター|営業|人事|総務|経理|広報|会社)/;

// CJK Unified Ideographs (一-鿿), Hiragana (぀-ゟ), Katakana (゠-ヿ),
// the prolonged-sound mark and the kanji iteration mark.
const JP_NAME_CHARS_RE = /^[一-鿿぀-ゟ゠-ヿー々\s]+$/u;
const HAS_JAPANESE_RE = /[一-鿿぀-ゟ゠-ヿ]/;
const EN_NAME_WORD_RE = /^[A-Z][A-Za-z'’.-]*$/;

/**
 * True when a Title-Case line reads as marketing copy rather than a person.
 *
 * Taglines are assembled from ordinary describing words — adjectives, gerunds, abstractions
 * ("Smart Living", "Trusted Partner", "Building Better Futures"). Surnames are not. This is the
 * only signal that separates them, since both are two or three capitalised words in the same part
 * of the card. Anything matching stays out of `name`.
 */
const TAGLINE_WORDS = new Set([
  'smart','living','trusted','partner','partners','best','better','premium','luxury','global',
  'international','solutions','services','service','group','consulting','realty','estate','estates',
  'property','properties','homes','home','future','futures','building','build','creating','create',
  'making','make','your','our','the','excellence','quality','professional','expert','experts',
  'leading','leader','first','choice','dream','dreams','life','lifestyle','value','values','care',
  'success','growth','together','beyond','simply','pure','true','new','world','worldwide',
]);

function isTaglineish(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return false;
  const lower = words.map((w) => w.replace(/[^A-Za-z]/g, '').toLowerCase()).filter(Boolean);
  if (!lower.length) return false;
  // Any ordinary describing word, or any gerund, and it is not a name.
  return lower.some((w) => TAGLINE_WORDS.has(w) || (w.length > 4 && w.endsWith('ing')));
}

function isNameShaped(rawText: string): boolean {
  const text = rawText.trim();
  if (!text) return false;
  if (/[0-9@]/.test(text)) return false;
  if (/https?:|www\./i.test(text)) return false;

  if (HAS_JAPANESE_RE.test(text)) {
    if (!JP_NAME_CHARS_RE.test(text)) return false;
    if (JP_NON_NAME_RE.test(text)) return false;
    const bare = text.replace(/\s/g, '');
    return bare.length >= 2 && bare.length <= 6;
  }

  if (EN_NON_NAME_WORD_RE.test(text)) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((w) => EN_NAME_WORD_RE.test(w));
}

// --- Helpers --------------------------------------------------------------------

interface Positioned {
  block: TextBlock;
  index: number;
}

/** Defensive top-to-bottom, then left-to-right ordering by box center — the caller
 * (`recognizeText`) already returns blocks in this order, but the guesser doesn't
 * assume that, since it's meant to be usable standalone/in tests too. */
function orderBlocks(blocks: FieldGuesserInput): Positioned[] {
  return blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const ay = a.block.box.y + a.block.box.h / 2;
      const by = b.block.box.y + b.block.box.h / 2;
      if (Math.abs(ay - by) > 0.02) return ay - by;
      return a.block.box.x - b.block.box.x;
    });
}

function unclaimedMatching(ordered: Positioned[], claimed: Set<number>, regex: RegExp): Positioned[] {
  return ordered.filter((p) => !claimed.has(p.index) && regex.test(p.block.text));
}

function claimAll(claimed: Set<number>, positioned: Positioned[]): void {
  for (const p of positioned) claimed.add(p.index);
}

// --- Guesser ----------------------------------------------------------------

export function guessFields(blocksInput: FieldGuesserInput): GuessedFields {
  const result = emptyFields();
  if (!blocksInput || blocksInput.length === 0) return result;

  const ordered = orderBlocks(blocksInput);
  const claimed = new Set<number>();

  // --- Email: every @-shaped block is claimed (so a CC address can't leak into the
  // name pool), the best (ideally a block that's *only* the address) wins. Structural
  // confidence is scaled by Vision's own per-block OCR confidence (N5) — a well-shaped
  // match on a badly-read block is not trustworthy just because it parses. ---
  const emailCandidates = unclaimedMatching(ordered, claimed, EMAIL_RE);
  if (emailCandidates.length > 0) {
    let best: { value: string; confidence: number; index: number } | null = null;
    for (const { block, index } of emailCandidates) {
      const match = block.text.match(EMAIL_RE);
      if (!match) continue;
      const exact = match[0].trim() === block.text.trim();
      const structural = exact ? 0.95 : 0.85;
      const confidence = structural * block.confidence;
      if (!best || confidence > best.confidence) best = { value: match[0].trim(), confidence, index };
    }
    claimAll(claimed, emailCandidates);
    if (best) result.email = { value: best.value, confidence: best.confidence, sourceBlockIndex: best.index };
  }

  // --- Phone: every phone-shaped block is claimed (TEL *and* FAX lines), but a
  // FAX-labelled line is scored down so a TEL line always wins when both exist. Structural
  // confidence is scaled by Vision's per-block OCR confidence (N5) — a shakily-read digit
  // string that happens to match the phone shape must not surface as trustworthy. ---
  const phoneCandidates = unclaimedMatching(ordered, claimed, PHONE_RE);
  if (phoneCandidates.length > 0) {
    let best: { value: string; confidence: number; index: number } | null = null;
    for (const { block, index } of phoneCandidates) {
      const match = block.text.match(PHONE_RE);
      if (!match) continue;
      const raw = match[0].trim();
      const exact = raw === block.text.trim();
      const isFaxOnly = FAX_LABEL_RE.test(block.text) && !PHONE_LABEL_RE.test(block.text);
      let structural = exact ? 0.9 : PHONE_LABEL_RE.test(block.text) ? 0.8 : 0.65;
      if (isFaxOnly) structural -= 0.35;
      const confidence = structural * block.confidence;
      if (!best || confidence > best.confidence) best = { value: raw, confidence, index };
    }
    claimAll(claimed, phoneCandidates);
    if (best && best.confidence >= MIN_CONFIDENCE) {
      result.phone = { value: best.value, confidence: best.confidence, sourceBlockIndex: best.index };
    }
  }

  // --- Company: 株式会社/有限会社/合同会社 etc., or an EN corporate suffix. ---
  const companyCandidates = unclaimedMatching(
    ordered,
    claimed,
    new RegExp(`${JP_COMPANY_RE.source}|${EN_COMPANY_RE.source}`)
  );
  if (companyCandidates.length > 0) {
    const chosen = companyCandidates[0];
    result.company = { value: chosen.block.text.trim(), confidence: 0.9 * chosen.block.confidence, sourceBlockIndex: chosen.index };
    claimAll(claimed, companyCandidates);
  }

  // --- Title: JP/EN job-title keywords. ---
  const titleCandidates = unclaimedMatching(ordered, claimed, TITLE_RE);
  if (titleCandidates.length > 0) {
    const chosen = titleCandidates[0];
    result.title = { value: chosen.block.text.trim(), confidence: 0.75 * chosen.block.confidence, sourceBlockIndex: chosen.index };
    claimAll(claimed, titleCandidates);
  }

  // --- Address: JP postal/丁目/番地/都道府県+市区町村 markers score higher than a
  // generic EN street-address match. ---
  const jpAddrCandidates = unclaimedMatching(ordered, claimed, JP_ADDRESS_RE);
  const enAddrCandidates = ordered.filter(
    (p) => !claimed.has(p.index) && !jpAddrCandidates.some((jp) => jp.index === p.index) && looksLikeEnAddress(p.block.text)
  );
  const allAddrCandidates = [...jpAddrCandidates, ...enAddrCandidates];
  if (allAddrCandidates.length > 0) {
    const chosen = jpAddrCandidates[0] ?? enAddrCandidates[0];
    const structural = jpAddrCandidates.length > 0 ? 0.75 : 0.65;
    const confidence = structural * chosen.block.confidence;
    result.address = { value: chosen.block.text.trim(), confidence, sourceBlockIndex: chosen.index };
    claimAll(claimed, allAddrCandidates);
  }

  // --- Furigana pairing: a standalone kana-only line immediately followed by a
  // non-kana line is read as (kana reading, name) — but the paired line only becomes
  // `name` when it's actually name-shaped (N5): proximity to a kana reading is not, by
  // itself, evidence a line names a person, which is how a department ("営業部") won
  // before this fix. The kana line itself is claimed either way so a rejected neighbour
  // can't fall through to the last-one-standing fallback below and win there instead. ---
  const kanaCandidates = unclaimedMatching(ordered, claimed, /^.+$/).filter(
    (p) => KANA_ONLY_RE.test(p.block.text.trim()) && p.block.text.trim().length >= 2
  );
  if (kanaCandidates.length > 0) {
    const kana = kanaCandidates[0];
    const kanaPos = ordered.findIndex((p) => p.index === kana.index);
    const next = ordered[kanaPos + 1];
    if (next && !claimed.has(next.index)) {
      result.reading = { value: kana.block.text.trim(), confidence: 0.75 * kana.block.confidence, sourceBlockIndex: kana.index };
      if (isNameShaped(next.block.text)) {
        result.name = { value: next.block.text.trim(), confidence: 0.8 * next.block.confidence, sourceBlockIndex: next.index };
      }
      claimed.add(kana.index);
      claimed.add(next.index);
    } else {
      // A kana line with no unclaimed neighbor below it is still a reasonable
      // reading guess on its own, just at lower confidence.
      result.reading = { value: kana.block.text.trim(), confidence: 0.6 * kana.block.confidence, sourceBlockIndex: kana.index };
      claimed.add(kana.index);
    }
  }

  // --- Name fallback (no furigana pairing found, or the paired line wasn't name-shaped): ---
  // "John Smith" and "Smart Living" are the same shape to a structural check, so shape alone can
  // never separate them — dropping this fallback entirely just loses every Western name instead.
  // The real discriminator is vocabulary: a tagline is built from ordinary describing words, a
  // surname is not. isTaglineish() below rejects the marketing register; anything it isn't sure
  // about stays blank.
  if (!result.name.value) {
    const remaining = ordered.filter((p) => !claimed.has(p.index));
    const only = remaining.length === 1 ? remaining[0] : null;
    if (only && isNameShaped(only.block.text) && !isTaglineish(only.block.text)) {
      const conf = 0.6 * only.block.confidence;
      result.name = { value: only.block.text.trim(), confidence: conf, sourceBlockIndex: only.index };
      claimed.add(only.index);
    }
    // 0 or 2+ remaining candidates, no name shape, or tagline vocabulary: genuinely ambiguous,
    // leave name blank rather than inventing a value.
  }

  // Final safety net: nothing below MIN_CONFIDENCE ever carries a non-empty value.
  for (const key of Object.keys(result) as GuessedFieldKey[]) {
    // Written as a negated >= so a non-finite confidence (NaN) fails the test and is cleared.
    // `NaN > 0` and `NaN < MIN` are both false, so the old form let a NaN through untouched.
    if (result[key].value !== '' && !(result[key].confidence >= MIN_CONFIDENCE)) {
      result[key] = emptyField();
    }
  }

  return result;
}
