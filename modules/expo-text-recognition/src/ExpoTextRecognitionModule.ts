import { requireOptionalNativeModule } from 'expo-modules-core';

import type { NativeTextBlock } from './ExpoTextRecognition.types';

/**
 * The raw native module surface. Only present on iOS/iPadOS when the module has been
 * autolinked (i.e. after `expo prebuild` + a native rebuild). `requireOptionalNativeModule`
 * (rather than `requireNativeModule`) is used deliberately so importing this file never
 * throws on Android/web — `null` is returned instead, and the public API in `index.ts`
 * turns that into a clear rejection instead of a crash at import time.
 */
export interface ExpoTextRecognitionNativeModule {
  /**
   * Runs `VNRecognizeTextRequest` (accurate, Japanese-first, language-correction on)
   * against the image at `uri` and resolves with every recognized line, top-to-bottom.
   */
  recognizeText(uri: string): Promise<NativeTextBlock[]>;
  /** Cheap synchronous availability check, mostly useful for diagnostics/logging. */
  isAvailable(): boolean;
}

export default requireOptionalNativeModule<ExpoTextRecognitionNativeModule>('ExpoTextRecognition');
