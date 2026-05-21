import { useCallback, useEffect, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onPress?: () => void;
  delay?: number;
}

/**
 * Detects a long press on the Enter key while a component is focused.
 * Returns handlers to attach to the focused element's keyboard events.
 *
 * When the key is held for `delay` ms the `onLongPress` callback fires.
 * If the key is released before the timer, `onPress` fires instead.
 */
export function useLongPress({ onLongPress, onPress, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const handlePressStart = useCallback(() => {
    longPressTriggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPressRef.current();
    }, delay);
  }, [delay]);

  const handlePressEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!longPressTriggeredRef.current) {
      onPressRef.current?.();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { handlePressStart, handlePressEnd };
}
