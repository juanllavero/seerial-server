import { ROOT_FOCUS_KEY, SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect, useEffectEvent, useRef } from 'react';
import { useSettingsStore } from '@/features/settings/stores/settings.store';
import { useKeyboardShortcut } from './use-keyboard-shortcut';

function createAudio(src: string) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

function playAudio(audio: HTMLAudioElement | null) {
  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {
    // Ignore playback rejections caused by the WebView media policy.
  });
}

export function useFeedbackSounds() {
  const feedbackSoundsEnabled = useSettingsStore((state) => state.settings.feedbackSounds);
  const movementAudioRef = useRef<HTMLAudioElement | null>(null);
  const interactionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    movementAudioRef.current = createAudio(`${import.meta.env.BASE_URL}audio/movement.wav`);
    interactionAudioRef.current = createAudio(`${import.meta.env.BASE_URL}audio/interaction.wav`);

    return () => {
      for (const audio of [movementAudioRef.current, interactionAudioRef.current]) {
        if (!audio) {
          continue;
        }

        audio.pause();
        audio.src = '';
      }

      movementAudioRef.current = null;
      interactionAudioRef.current = null;
    };
  }, []);

  const playMovementSound = useEffectEvent(() => {
    if (!feedbackSoundsEnabled) {
      return;
    }

    playAudio(movementAudioRef.current);
  });

  const playInteractionSound = useEffectEvent(() => {
    if (!feedbackSoundsEnabled) {
      return;
    }

    playAudio(interactionAudioRef.current);
  });

  useEffect(() => {
    const originalSetCurrentFocusedKey =
      SpatialNavigation.setCurrentFocusedKey.bind(SpatialNavigation);

    SpatialNavigation.setCurrentFocusedKey = ((newFocusKey, focusDetails) => {
      const previousFocusKey = SpatialNavigation.getCurrentFocusKey();

      originalSetCurrentFocusedKey(newFocusKey, focusDetails);

      if (
        previousFocusKey &&
        previousFocusKey !== ROOT_FOCUS_KEY &&
        previousFocusKey !== newFocusKey
      ) {
        playMovementSound();
      }
    }) as typeof SpatialNavigation.setCurrentFocusedKey;

    return () => {
      SpatialNavigation.setCurrentFocusedKey = originalSetCurrentFocusedKey;
    };
  }, []);

  useKeyboardShortcut({
    key: 'Enter',
    enabled: feedbackSoundsEnabled,
    onKeyDown: useEffectEvent((event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      playInteractionSound();
    }),
  });
}
