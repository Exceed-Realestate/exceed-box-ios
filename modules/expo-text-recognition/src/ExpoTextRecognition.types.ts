/**
 * Normalized bounding box for a recognized line of text.
 *
 * All values are in the 0..1 range, relative to the image's width/height, with the
 * origin at the TOP-LEFT of the image (x grows right, y grows down) — i.e. already
 * converted from Vision's bottom-left-origin coordinate space so callers never have
 * to think about Vision's convention.
 */
export interface TextBoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One recognized line of text, as returned by `VNRecognizeTextRequest`'s top candidate. */
export interface TextBlock {
  /** The recognized line of text. */
  text: string;
  /** Vision's confidence for this line's top candidate, 0..1. */
  confidence: number;
  /** Normalized, top-left-origin bounding box for this line. */
  box: TextBoundingBox;
}

/** Result of `recognizeText`. Blocks are ordered top-to-bottom, then left-to-right. */
export interface TextRecognitionResult {
  blocks: TextBlock[];
}

/** Shape returned directly by the native module, before it's wrapped into `TextRecognitionResult`. */
export type NativeTextBlock = TextBlock;
