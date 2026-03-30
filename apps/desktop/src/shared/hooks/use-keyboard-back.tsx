import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardBack({
  fallbackPath = '/home',
  preAction,
  enabled = true,
  navigateOnBack = true,
}: {
  fallbackPath?: string;
  preAction?: () => void;
  enabled?: boolean;
  navigateOnBack?: boolean;
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
      const isBackKey = event.key === 'Escape' || event.key === 'Backspace';
      const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      const shouldIgnore =
        !isBackKey || event.defaultPrevented || hasModifier || isTypingElement(event.target);

      if (shouldIgnore) return;

      event.preventDefault();

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

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, fallbackPath, runPreAction, enabled, navigateOnBack]);
}
