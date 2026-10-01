import { Platform } from 'react-native';

import NativeModule from './ExpoTextRecognitionModule';
import { guessFields } from './fieldGuesser';
import type { TextRecognitionResult } from './ExpoTextRecognition.types';

export type { NativeTextBlock, TextBlock, TextBoundingBox, TextRecognitionResult } from './ExpoTextRecognition.types';
export type { FieldGuesserInput, GuessedField, GuessedFieldKey, GuessedFields } from './fieldGuesser.types';
export { guessFields };

/**
 * Thrown by `recognizeText` whenever on-device text recognition cannot run —
 * wrong platform, module not linked, or a bad/missing input. Callers should catch
 * this specifically (or just any rejection) and fall back to the manual-entry form;
 * the module never resolves an empty result to paper over unavailability.
 */
export class TextRecognitionUnavailableError extends Error {
  constructor(reason: string) {
    super(`On-device text recognition is unavailable: ${reason}`);
    this.name = 'TextRecognitionUnavailableError';
  }
}

/**
 * True only when running on iOS/iPadOS with the native module linked (i.e. after
 * `expo prebuild` + a native rebuild that includes this local module). Useful for a
 * screen that wants to hide/disable a "scan" affordance up front rather than wait for
 * `recognizeText` to reject.
 */
export function isTextRecognitionAvailable(): boolean {
  return Platform.OS === 'ios' && NativeModule != null;
}

/**
 * Runs on-device OCR (Apple Vision's `VNRecognizeTextRequest`, accurate mode,
 * `recognitionLanguages: ["ja-JP", "en-US"]`, language correction on) over the image
 * at `uri` and resolves with every recognized line of text, its confidence, and its
 * normalized top-left-origin bounding box, ordered top-to-bottom then left-to-right.
 *
 * **iOS-only by design.** On Android, web, or if the native module isn't linked for
 * any other reason, this *rejects* with a `TextRecognitionUnavailableError` — it does
 * not resolve `{ blocks: [] }`. That distinction matters: an empty-but-successful
 * result would look like "we scanned it and found nothing," which would be wrong and
 * could cause a caller to skip its manual-entry fallback. A rejection makes the
 * "this platform can't do this" case impossible to miss.
 */
export async function recognizeText(uri: string): Promise<TextRecognitionResult> {
  if (Platform.OS !== 'ios') {
    throw new TextRecognitionUnavailableError(
      `platform "${Platform.OS}" is not supported — this module wraps Apple's Vision framework and only runs on iOS/iPadOS.`
    );
  }
  if (NativeModule == null) {
    throw new TextRecognitionUnavailableError(
      'the native module is not linked. Run `npx expo prebuild` and rebuild the iOS app (a JS-only reload is not enough).'
    );
  }
  if (!uri || typeof uri !== 'string') {
    throw new TextRecognitionUnavailableError('no image uri was provided.');
  }

  const blocks = await NativeModule.recognizeText(uri);
  return { blocks };
}
