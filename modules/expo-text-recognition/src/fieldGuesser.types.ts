import type { TextBlock } from './ExpoTextRecognition.types';

/** The business-card fields this module can guess at from raw OCR blocks.
 * Keys are named to match `CardScanFields` (src/api/types.ts) exactly — the furigana guess
 * is `reading`, not `name_kana`, so `CardScanScreen`'s fill loop actually reaches the form
 * field instead of writing a phantom key (round-2 audit N6). */
export type GuessedFieldKey =
  | 'name'
  | 'reading'
  | 'company'
  | 'title'
  | 'email'
  | 'phone'
  | 'address';

/**
 * A single guessed field. `value` is `''` and `confidence` is `0` whenever the guesser
 * declined to guess — the caller (the form) should treat that exactly like "leave blank",
 * never as "we found an empty string."
 */
export interface GuessedField {
  value: string;
  /** 0..1. Never > 0 unless `value` is non-empty. */
  confidence: number;
  /** Index into the input `blocks` array this guess was primarily derived from, if any. */
  sourceBlockIndex?: number;
}

export type GuessedFields = Record<GuessedFieldKey, GuessedField>;

/** Input to the guesser: OCR text blocks, ideally top-to-bottom as `recognizeText` returns. */
export type FieldGuesserInput = TextBlock[];
