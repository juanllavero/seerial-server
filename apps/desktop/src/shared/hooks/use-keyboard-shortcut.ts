import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  key: string | string[];
  onKeyDown: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  enabled?: boolean;
  ignoreModifiers?: boolean;
  ignoreTypingElements?: boolean;
  capture?: boolean;
}

function isTypingElement(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function useKeyboardShortcut({
  key,
  onKeyDown,
  onKeyUp,
  enabled = true,
  ignoreModifiers = true,
  ignoreTypingElements = true,
  capture = false,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const keys = Array.isArray(key) ? key : [key];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keys.includes(event.key)) return;
      if (ignoreModifiers && (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey))
        return;
      if (ignoreTypingElements && isTypingElement(event.target)) return;

      onKeyDown(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!onKeyUp) return;
      if (!keys.includes(event.key)) return;

      onKeyUp(event);
    };

    window.addEventListener('keydown', handleKeyDown, capture);
    if (onKeyUp) {
      window.addEventListener('keyup', handleKeyUp, capture);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, capture);
      if (onKeyUp) {
        window.removeEventListener('keyup', handleKeyUp, capture);
      }
    };
  }, [key, onKeyDown, onKeyUp, enabled, ignoreModifiers, ignoreTypingElements, capture]);
}
