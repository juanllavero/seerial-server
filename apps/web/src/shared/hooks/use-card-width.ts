import { useEffect, useState } from 'react';

export const useCardWidth = () => {
  const [cardWidth, setCardWidth] = useState(() => {
    const saved = localStorage.getItem('cardWidth');
    return saved ? Number(saved) : 200;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cardWidth' && e.newValue) {
        setCardWidth(Number(e.newValue));
      }
    };

    // Custom event for changes in the same tab
    const handleCardWidthChange = (e: CustomEvent<number>) => {
      setCardWidth(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cardWidthChange', handleCardWidthChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cardWidthChange', handleCardWidthChange as EventListener);
    };
  }, []);

  const updateCardWidth = (newWidth: number) => {
    setCardWidth(newWidth);
    localStorage.setItem('cardWidth', newWidth.toString());

    // Fire custom event for the same tab
    window.dispatchEvent(new CustomEvent('cardWidthChange', { detail: newWidth }));
  };

  return { cardWidth, updateCardWidth };
};
