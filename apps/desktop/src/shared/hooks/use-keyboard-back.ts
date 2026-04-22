import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function isBackKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape' || event.key === 'Backspace';
}

function hasModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

export function useKeyboardBack({
  fallbackPath = '/home',
  preAction,
  enabled = true,
  navigateOnBack = true,
  capture = false,
  stopPropagation = false,
}: {
  fallbackPath?: string;
  preAction?: () => void;
  enabled?: boolean;
  navigateOnBack?: boolean;
  capture?: boolean;
  stopPropagation?: boolean;
} = {}) {
  const navigate = useNavigate();

  const runPreAction = useCallback(() => {
    if (preAction) {
      preAction();
    }
  }, [preAction]);

  useEffect(() => {
    const isTypingElement = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };

    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const shouldIgnore =
        !isBackKey(event) ||
        event.defaultPrevented ||
        hasModifier(event) ||
        isTypingElement(event.target);

      if (shouldIgnore) return;

      event.preventDefault();

      if (stopPropagation) {
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

      // Run any pre-navigation action (like closing a modal) before navigating back
      runPreAction();

      if (!navigateOnBack) {
        return;
      }

      // Fallback if there's no history to go back to
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath, { replace: true });
      }
    };

    window.addEventListener('keydown', onKeyDown, capture);
    return () => window.removeEventListener('keydown', onKeyDown, capture);
  }, [navigate, fallbackPath, runPreAction, enabled, navigateOnBack, capture, stopPropagation]);
}
