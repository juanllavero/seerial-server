import { invoke } from '@tauri-apps/api/core';
import { useCallback } from 'react';

const READY_POLL_INTERVAL_MS = 250;

export interface MpvPlaybackStatus {
  position?: number;
  duration?: number;
  pausedForCache: boolean;
  seeking: boolean;
  idleActive: boolean;
  eofReached: boolean;
}

/**
 * Thin abstraction over the MPV Tauri IPC commands for the video player.
 * All native player communication should go through this hook instead of
 * calling invoke() directly from components.
 */
export function useMpvPlayer() {
  const embedMpv = useCallback(() => invoke('embed_mpv').catch(console.error), []);

  const loadUrl = useCallback((url: string) => invoke('load_url', { url }), []);

  const play = useCallback(() => invoke('play').catch(console.error), []);

  const pause = useCallback(() => invoke('pause').catch(console.error), []);

  const stop = useCallback(() => invoke('stop').catch(console.error), []);

  const stopAndEmbed = useCallback(async () => {
    await invoke('stop').catch(console.error);
    await invoke('embed_mpv').catch(console.error);
  }, []);

  const togglePlayPause = useCallback(() => invoke('toggle_play_pause').catch(console.error), []);

  const getPosition = useCallback(() => invoke<number>('get_position'), []);

  const getDuration = useCallback(() => invoke<number>('get_duration'), []);

  const setPosition = useCallback(
    (position: number) => invoke<void>('set_position', { position }),
    [],
  );

  const getPlaybackStatus = useCallback(() => invoke<MpvPlaybackStatus>('get_playback_status'), []);

  const setVolume = useCallback((volume: number) => invoke('set_volume', { volume }), []);

  const setAudioTrack = useCallback(
    (trackId: number) => invoke('set_audio_track', { trackId }),
    [],
  );

  const setSubtitleTrack = useCallback(
    (trackId: number) => invoke('set_subtitle_track', { trackId }),
    [],
  );

  const waitForReady = useCallback(async (timeoutMs: number): Promise<boolean> => {
    const startedAt = Date.now();

    const pollUntilReady = async (): Promise<boolean> => {
      if (Date.now() - startedAt >= timeoutMs) {
        return false;
      }

      try {
        const duration = await invoke<number>('get_duration');
        if (Number.isFinite(duration) && duration > 0) {
          return true;
        }
      } catch {
        // Keep polling until timeout to allow MPV buffering and metadata parsing.
      }

      await new Promise<void>((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS));
      return pollUntilReady();
    };

    return pollUntilReady();
  }, []);

  return {
    embedMpv,
    loadUrl,
    play,
    pause,
    stop,
    stopAndEmbed,
    togglePlayPause,
    getPosition,
    getDuration,
    setPosition,
    getPlaybackStatus,
    setVolume,
    setAudioTrack,
    setSubtitleTrack,
    waitForReady,
  };
}
