import { RotateCcw, RotateCw } from 'lucide-react';
import { useEffect, useEffectEvent, useReducer } from 'react';

type SeekDirection = 'left' | 'right' | null;

interface SeekIndicatorProps {
  direction: SeekDirection;
  onAnimationEnd?: () => void;
}

interface SeekIndicatorState {
  isVisible: boolean;
  activeDirection: SeekDirection;
}

type SeekIndicatorAction =
  | { type: 'show'; direction: Exclude<SeekDirection, null> }
  | { type: 'hide' }
  | { type: 'reset' };

function seekIndicatorReducer(
  state: SeekIndicatorState,
  action: SeekIndicatorAction,
): SeekIndicatorState {
  switch (action.type) {
    case 'show':
      return {
        isVisible: true,
        activeDirection: action.direction,
      };
    case 'hide':
      return {
        ...state,
        isVisible: false,
      };
    case 'reset':
      return {
        isVisible: false,
        activeDirection: null,
      };
    default:
      return state;
  }
}

function SeekIndicator({ direction, onAnimationEnd }: SeekIndicatorProps) {
  const [state, dispatch] = useReducer(seekIndicatorReducer, {
    isVisible: false,
    activeDirection: null,
  });
  const onAnimationEndEvent = useEffectEvent(() => {
    onAnimationEnd?.();
  });

  useEffect(() => {
    if (direction) {
      dispatch({ type: 'show', direction });

      const fadeOutTimer = setTimeout(() => {
        dispatch({ type: 'hide' });
      }, 800);

      const cleanupTimer = setTimeout(() => {
        onAnimationEndEvent();
        dispatch({ type: 'reset' });
      }, 1000); // 800ms + 200ms

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [direction]);

  if (!state.activeDirection) {
    return null;
  }

  const isLeft = state.activeDirection === 'left';

  return (
    <div
      className={`seek-indicator ${isLeft ? 'seek-indicator-left' : 'seek-indicator-right'}${state.isVisible ? ' visible' : ''}`}
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
