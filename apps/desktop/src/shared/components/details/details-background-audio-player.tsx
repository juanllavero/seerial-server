import { getSignedSongStreamUrl } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppSettingsMpv } from '@/features/video-player/hooks/use-app-settings-mpv';
import { useSettingsStore } from '@/shared/stores';
import {
  enqueueMpvCommand,
  fadeOutAndStopMpv,
  getBackgroundPlaybackVolume,
  waitForMediaReady,
} from './details-background-mpv';

const LOAD_TIMEOUT_MS = 5000;
const PLAYER_HEALTH_POLL_INTERVAL_MS = 500;
const AUDIO_LOOP_DELAY_MS = 3000;

interface PlaybackStatus {
  eofReached: boolean;
}

interface DetailsBackgroundAudioPlayerProps {
  localId: string;
  onUnavailable?: () => void;
}

function getSongIdentityFromSignedUrl(signedUrl: string): string | null {
  try {
    const parsed = new URL(signedUrl, 'http://localhost');
    const token = parsed.searchParams.get('token');
    if (!token) {
      return null;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length < 2) {
      return null;
    }

    const payloadPart = tokenParts[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payloadPart) {
      return null;
    }

    const paddedPayload = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
    const payloadJson = atob(paddedPayload);
    const payload = JSON.parse(payloadJson) as { path?: string };

    return payload.path ?? null;
  } catch {
    return null;
  }
}

function DetailsBackgroundAudioPlayer({
  localId,
  onUnavailable,
}: DetailsBackgroundAudioPlayerProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const themeMusicVolume = useSettingsStore((state) => state.settings.themeMusicVolume);

  useAppSettingsMpv();

  const isDisposedRef = useRef(false);
  const loadAttemptRef = useRef(0);
  const eofGuardRef = useRef(false);
  const loopTimerRef = useRef<number | null>(null);
  const originalVolumeRef = useRef<number>(100);
  const currentSongIdentityRef = useRef<string | null>(null);
  const hasActivePlaybackRef = useRef(false);

  const targetVolume = useMemo(
    () => getBackgroundPlaybackVolume(themeMusicVolume),
    [themeMusicVolume],
  );

  const clearLoopTimer = useCallback(() => {
    if (loopTimerRef.current !== null) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    clearLoopTimer();

    await enqueueMpvCommand(async () => {
      await fadeOutAndStopMpv(originalVolumeRef.current, () => false);
    });

    hasActivePlaybackRef.current = false;
    currentSongIdentityRef.current = null;
  }, [clearLoopTimer]);

  const loadAndPlay = useCallback(async () => {
    if (!localId || !serverUrl || targetVolume <= 0) {
      return false;
    }

    const currentAttempt = ++loadAttemptRef.current;

    try {
      await enqueueMpvCommand(async () => {
        try {
          originalVolumeRef.current = await invoke<number>('get_volume');
        } catch {
          originalVolumeRef.current = 100;
        }

        const signedUrl = await getSignedSongStreamUrl({
          filePath: 'none',
          localId,
          expiresIn: '10m',
          isDesktop: true,
        });

        const nextSongIdentity = signedUrl ? getSongIdentityFromSignedUrl(signedUrl) : null;
        const canReuseCurrentPlayback =
          !!nextSongIdentity &&
          hasActivePlaybackRef.current &&
          currentSongIdentityRef.current === nextSongIdentity;

        if (canReuseCurrentPlayback) {
          await invoke('set_volume', { volume: targetVolume });
          return;
        }

        if (!signedUrl || isDisposedRef.current || currentAttempt !== loadAttemptRef.current) {
          throw new Error('Background audio is not available');
        }

        await invoke('embed_mpv');
        await Promise.all([
          invoke('set_volume', { volume: targetVolume }),
          invoke('load_url', { url: `${serverUrl}${signedUrl}` }),
        ]);

        currentSongIdentityRef.current = nextSongIdentity;
      });

      const ready = await waitForMediaReady(LOAD_TIMEOUT_MS, () => {
        return isDisposedRef.current || currentAttempt !== loadAttemptRef.current;
      });

      if (!ready || isDisposedRef.current || currentAttempt !== loadAttemptRef.current) {
        throw new Error('Background audio timed out');
      }

      await enqueueMpvCommand(async () => {
        if (isDisposedRef.current || currentAttempt !== loadAttemptRef.current) {
          return;
        }

        await invoke('play');
        hasActivePlaybackRef.current = true;
      });

      return true;
    } catch {
      if (!isDisposedRef.current && currentAttempt === loadAttemptRef.current) {
        onUnavailable?.();
      }

      return false;
    }
  }, [localId, onUnavailable, serverUrl, targetVolume]);

  useEffect(() => {
    isDisposedRef.current = false;
    eofGuardRef.current = false;

    if (!localId || !serverUrl || targetVolume <= 0) {
      return () => {
        isDisposedRef.current = true;
      };
    }

    void loadAndPlay();

    return () => {
      isDisposedRef.current = true;
      void stopPlayback();
    };
  }, [localId, loadAndPlay, serverUrl, stopPlayback, targetVolume]);

  useEffect(() => {
    if (!localId || !serverUrl || targetVolume <= 0 || !hasActivePlaybackRef.current) {
      return;
    }

    void enqueueMpvCommand(async () => {
      await invoke('set_volume', { volume: targetVolume });
    });
  }, [localId, serverUrl, targetVolume]);

  useEffect(() => {
    if (!localId || !serverUrl || targetVolume <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      void invoke<PlaybackStatus>('get_playback_status')
        .then((status) => {
          if (!status.eofReached) {
            eofGuardRef.current = false;
            return;
          }

          if (eofGuardRef.current) {
            return;
          }

          eofGuardRef.current = true;
          clearLoopTimer();
          loopTimerRef.current = window.setTimeout(() => {
            eofGuardRef.current = false;
            void loadAndPlay();
          }, AUDIO_LOOP_DELAY_MS);
        })
        .catch(() => undefined);
    }, PLAYER_HEALTH_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      clearLoopTimer();
    };
  }, [clearLoopTimer, loadAndPlay, localId, serverUrl, targetVolume]);

  return null;
}

export default DetailsBackgroundAudioPlayer;
