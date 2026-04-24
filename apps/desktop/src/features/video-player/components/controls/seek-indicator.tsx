import { RotateCcw, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';

type SeekDirection = 'left' | 'right' | null;

interface SeekIndicatorProps {
  direction: SeekDirection;
  onAnimationEnd?: () => void;
}

function SeekIndicator({ direction, onAnimationEnd }: SeekIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeDirection, setActiveDirection] = useState<SeekDirection>(null);

  useEffect(() => {
    if (direction) {
      setActiveDirection(direction);
      setIsVisible(true);

      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 800);

      const cleanupTimer = setTimeout(() => {
        onAnimationEnd?.();
        setActiveDirection(null);
      }, 1000); // 800ms + 200ms

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [direction, onAnimationEnd]);

  if (!activeDirection) {
    return null;
  }

  const isLeft = activeDirection === 'left';

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        [isLeft ? 'left' : 'right']: '40%',
        transform: `translate(${isLeft ? '-50%' : '50%'}, -50%)`,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {isLeft ? (
        <RotateCcw size={48} style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />
      ) : (
        <RotateCw size={48} style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }} />
      )}
      <div
        className="text-lg font-bold"
        style={{
          marginTop: '8px',
          textAlign: 'center',
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        {isLeft ? '-10s' : '+10s'}
      </div>
    </div>
  );
}

export default SeekIndicator;
