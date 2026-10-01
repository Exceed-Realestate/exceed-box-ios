import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Counts a number up from 0 and settles on the real value.
 *
 * Balraj asked for this on the Dashboard KPI tiles: the figure should run up and stop at where we
 * actually are. It replays every time the screen is focused, which is why the caller passes a
 * `runKey` — bumping it restarts the animation without the value having to change.
 *
 * Deliberately driven by a timer rather than `Animated`: these are text values, and RN's animated
 * driver cannot interpolate into a `<Text>` child without a listener anyway. Frame budget is tiny
 * (six tiles, ~60 ticks each).
 *
 * Honours "Reduce Motion" — if the user has it on, the real number appears immediately rather than
 * animating. A count-up is decoration; it must never delay someone seeing their own numbers.
 */
export function useCountUp(target: number | null, durationMs = 900, runKey: number = 0): number | null {
  const [value, setValue] = useState<number | null>(target);
  const frame = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }

    let cancelled = false;

    const runInstantly = () => {
      if (!cancelled) setValue(target);
    };

    const animate = () => {
      if (cancelled) return;
      const start = Date.now();
      const from = 0;
      setValue(from);

      const tick = () => {
        const elapsed = Date.now() - start;
        const t = Math.min(1, elapsed / durationMs);
        // easeOutCubic — fast at first, decelerating into the final value so it "lands"
        const eased = 1 - Math.pow(1 - t, 3);
        const next = from + (target - from) * eased;
        // round toward the target so the last frame is exact, never 29.97
        setValue(t >= 1 ? target : Math.round(next));
        if (t >= 1 && frame.current) {
          clearInterval(frame.current);
          frame.current = null;
        }
      };

      frame.current = setInterval(tick, 16);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => (reduced ? runInstantly() : animate()))
      .catch(() => animate()); // if we cannot ask, animating is the safe default

    return () => {
      cancelled = true;
      if (frame.current) {
        clearInterval(frame.current);
        frame.current = null;
      }
    };
  }, [target, durationMs, runKey]);

  return value;
}
