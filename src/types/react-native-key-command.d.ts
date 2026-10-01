/**
 * `react-native-key-command` ships no TypeScript types (checked: no `.d.ts` in the published
 * package). This is a narrow ambient declaration of exactly the surface
 * `src/components/KeyboardShortcutsProvider.tsx` uses — see that file and
 * `src/hooks/useKeyboardShortcuts.ts` for how it's used and why it's loaded via a deferred,
 * try/catchable `require()` rather than a static `import`.
 */
declare module 'react-native-key-command' {
  export interface KeyCommandDescriptor {
    input: string;
    modifierFlags?: number;
  }

  export interface KeyCommandConstants {
    keyInputUpArrow: string;
    keyInputDownArrow: string;
    keyInputLeftArrow: string;
    keyInputRightArrow: string;
    keyInputEscape: string;
    keyInputEnter: string;
    keyModifierCapsLock: number;
    keyModifierShift: number;
    keyModifierControl: number;
    keyModifierOption: number;
    keyModifierCommand: number;
    keyModifierControlOption: number;
    keyModifierControlOptionCommand: number;
    keyModifierControlCommand: number;
    keyModifierOptionCommand: number;
    keyModifierShiftCommand: number;
    keyModifierNumericPad: number;
    [key: string]: string | number;
  }

  export interface KeyCommandEventSubscription {
    remove: () => void;
  }

  export const constants: KeyCommandConstants;
  export const eventEmitter: {
    addListener: (eventType: 'onKeyCommand', listener: (response: { input: string; modifierFlags?: number }) => void) => KeyCommandEventSubscription;
  };

  export function registerKeyCommands(keyCommands: KeyCommandDescriptor[]): Promise<void>;
  export function unregisterKeyCommands(keyCommands: KeyCommandDescriptor[]): Promise<void>;
  export function addListener(
    keyCommand: KeyCommandDescriptor,
    callback: (response: { input: string; modifierFlags?: number }, event?: unknown) => void
  ): () => void;
}

/**
 * Metro/RN provide `require` as a real global at runtime; TypeScript doesn't know about it (this
 * project has no `@types/node`, deliberately — it would pull in Node/browser globals that don't
 * exist on-device). Overloaded narrowly for the one module `KeyboardShortcutsProvider.tsx` loads
 * this way, rather than declaring `require` globally for every string.
 */
declare function require(id: 'react-native-key-command'): typeof import('react-native-key-command');
