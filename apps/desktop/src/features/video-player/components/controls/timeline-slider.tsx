import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { formatTime } from '@seerial/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tertiary } from '@/shared/components/text';
import FlexBox from '@/shared/components/ui/flex-box';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import { useMpvPlayer } from '../../hooks/use-mpv-player';
import SeekIndicator from './seek-indicator';

interface TimelineSliderProps {
  position: number;
  setPosition: (pos: number) => void;
  duration: number;
  setDuration: (dur: number) => void;
  keyboardShortcutEnabled?: boolean;
  onFocusChange?: (focused: boolean) => void;
  togglePlayPause?: () => void;
  playbackControls?: {
    getPosition?: () => Promise<number>;
    getDuration?: () => Promise<number>;
    setPosition?: (position: number) => Promise<void>;
  };
}

function TimelineSlider({
  position,
  setPosition,
  duration,
  setDuration,
  keyboardShortcutEnabled,
  onFocusChange,
  togglePlayPause,
  playbackControls,
}: TimelineSliderProps) {
  const seeking = useRef<boolean>(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [seekDirection, setSeekDirection] = useState<'left' | 'right' | null>(null);
  const mpv = useMpvPlayer();

  const { ref: focusableRef, focused } = useFocusable({
    focusKey: NavigationFocusKeys.player.timeline,
    onFocus: () => onFocusChange?.(true),
    onBlur: () => onFocusChange?.(false),
    onArrowPress: (direction) => {
      if (direction === 'left' || direction === 'right') {
        // Consume arrow left/right to seek, don't navigate away
        return false;
      }
      if (direction === 'up') {
        // Consume up arrow — controls visibility hook handles hiding
        return false;
      }
      return true;
    },
  });

  const shortcutsEnabled = keyboardShortcutEnabled ?? focused;

  const getPlaybackPosition = useCallback(() => {
    if (playbackControls?.getPosition) {
      return playbackControls.getPosition();
    }

    return mpv.getPosition();
  }, [playbackControls, mpv.getPosition]);

  const getPlaybackDuration = useCallback(() => {
    if (playbackControls?.getDuration) {
      return playbackControls.getDuration();
    }

    return mpv.getDuration();
  }, [playbackControls, mpv.getDuration]);

  const setPlaybackPosition = useCallback(
    (nextPosition: number) => {
      if (playbackControls?.setPosition) {
        return playbackControls.setPosition(nextPosition);
      }

      return mpv.setPosition(nextPosition);
    },
    [playbackControls, mpv.setPosition],
  );

  const handleSeekStart = () => {
    seeking.current = true;
  };

  const handleSeekChange = (value: number) => {
    setPosition(value);
  };

  const handleSeekEnd = async (value: number) => {
    seeking.current = false;
    try {
      const currentDur = await getPlaybackDuration();
      const clamped = Math.max(0, Math.min(currentDur, value));
      await setPlaybackPosition(clamped);
      setPosition(clamped);
      setDuration(currentDur);
    } catch (error) {
      console.error('Seek set failed:', error);
    }
  };

  const seekRelative = useCallback(
    async (delta: number) => {
      // Show visual indicator
      setSeekDirection(delta < 0 ? 'left' : 'right');

      try {
        const currentPos = await getPlaybackPosition();
        const currentDur = await getPlaybackDuration();

        const newPos = Math.max(0, Math.min(currentDur, currentPos + delta));
        await setPlaybackPosition(newPos);
        setPosition(newPos);
        setDuration(currentDur);
      } catch (error) {
        console.error('Seek failed:', error);
      }
    },
    [getPlaybackDuration, getPlaybackPosition, setPlaybackPosition, setPosition, setDuration],
  );

  // Calculate knob position as a percentage
  const getKnobPosition = () => {
    if (duration === 0) return 0;
    const percentage = (position / duration) * 100;
    return percentage;
  };

  // Seek only when the timeline is focused
  useKeyboardShortcut({
    key: ['ArrowLeft', 'ArrowRight'],
    enabled: shortcutsEnabled,
    onKeyDown: useCallback(
      (e: KeyboardEvent) => {
        e.preventDefault();
        seekRelative(e.key === 'ArrowLeft' ? -10 : 10);
      },
      [seekRelative],
    ),
  });

  useKeyboardShortcut({
    key: [' ', 'Enter', 'Spacebar'],
    enabled: shortcutsEnabled,
    onKeyDown: useCallback(
      (e: KeyboardEvent) => {
        e.preventDefault();
        togglePlayPause?.();
      },
      [togglePlayPause],
    ),
  });

  // Update position every 500ms if not seeking
  useEffect(() => {
    const interval = setInterval(() => {
      if (!seeking.current) {
        getPlaybackPosition().then(setPosition).catch(console.error);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [getPlaybackPosition, setPosition]);

  // Update slider color on position change
  useEffect(() => {
    if (position && sliderRef.current) {
      const min = Number(sliderRef.current.min);
      const max = Number(sliderRef.current.max);
      const value = Number(sliderRef.current.value);

      const percentage = ((value - min) / (max - min)) * 100;

      sliderRef.current.style.setProperty('--value-percent', `${percentage}%`);
    }
  }, [position]);

  return (
    <FlexBox direction="column" width={'100%'} gap={0.5}>
      <SeekIndicator direction={seekDirection} onAnimationEnd={() => setSeekDirection(null)} />
      <div ref={focusableRef} style={{ position: 'relative', width: '100%' }}>
        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={position}
          onMouseDown={handleSeekStart}
          onChange={(e) => handleSeekChange(parseFloat(e.target.value))}
          onMouseUp={(e) => handleSeekEnd(parseFloat((e.target as HTMLInputElement).value))}
          onTouchEnd={() => handleSeekEnd(position)}
          tabIndex={-1}
          className={`
        w-full h-3 rounded-lg appearance-none cursor-pointer outline-none ring-0
        bg-stone-500/80
        ${focused ? 'bg-[linear-gradient(to_right,var(--app-color)_0%,var(--app-color)_var(--value-percent),var(--color-stone-500)_var(--value-percent),var(--color-stone-500)_100%)]' : ''}
        transition-all duration-200

        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-1 
        [&::-webkit-slider-thumb]:h-3  
        [&::-webkit-slider-thumb]:bg-white
        [&::-webkit-slider-thumb]:shadow-md
        [&::-webkit-slider-thumb]:transition-all 
        [&::-webkit-slider-thumb]:duration-200 

        [&::-moz-range-progress]:bg-white 
        [&::-moz-range-track]:bg-stone-600

        ${
          focused
            ? `h-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:bg-white`
            : ''
        }
      `}
        />

        {/* Current time indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${getKnobPosition()}%`,
            transform: 'translateX(-35%)',
            top: '100%',
            whiteSpace: 'nowrap',
            fontSize: '1.8vh',
            fontWeight: '500',
            pointerEvents: 'none',
          }}
        >
          {formatTime(position)}
        </div>
      </div>
      <FlexBox width={'100%'} justify="end">
        <Tertiary>{formatTime(duration - position)}</Tertiary>
      </FlexBox>
    </FlexBox>
  );
}

export default TimelineSlider;
