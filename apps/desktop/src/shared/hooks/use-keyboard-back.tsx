import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardBack(fallbackPath = '/home') {
  const navigate = useNavigate();

  useEffect(() => {
    const isTypingElement = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const isBackKey = event.key === 'Escape' || event.key === 'Backspace';
      if (!isBackKey) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isTypingElement(event.target)) return;

      event.preventDefault();

      // Fallback if there's no history to go back to
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath, { replace: true });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, fallbackPath]);
}
