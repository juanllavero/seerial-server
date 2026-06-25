import { getSignedVideoStreamUrlPassthrough } from '@seerial/api';
import type { Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { memo, useCallback, useEffect, useReducer, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { VideoPlayer } from '@/features/video-player';
import { useMpvPlayer } from '@/features/video-player/hooks/use-mpv-player';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import {
    resetAppShellBackground,
    setAppShellBackground,
} from '@/shared/components/details/details-background-mpv';
import Loading from '@/shared/components/loading';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { useAppSettingsMpv } from '../../../features/video-player/hooks/use-app-settings-mpv';

const LOAD_TIMEOUT_MS = 15000;
const PLAYER_HEALTH_POLL_INTERVAL_MS = 1000;

type PlayerErrorMode = 'load' | 'playback';

interface PlayerViewState {
  videoLoaded: boolean;
  showInitialLoadingBackdrop: boolean;
  isErrorDialogOpen: boolean;
  errorMode: PlayerErrorMode;
  isRecoveringPlaybackError: boolean;
  isPlayerLoading: boolean;
  isPlaybackBuffering: boolean;
}

type PlayerViewAction = Partial<PlayerViewState>;

const INITIAL_PLAYER_VIEW_STATE: PlayerViewState = {
  videoLoaded: false,
  showInitialLoadingBackdrop: true,
  isErrorDialogOpen: false,
  errorMode: 'load',
  isRecoveringPlaybackError: false,
  isPlayerLoading: true,
  isPlaybackBuffering: false,
};

function playerViewReducer(state: PlayerViewState, action: PlayerViewAction): PlayerViewState {
  return { ...state, ...action };
}

function buildMinimalVideo(filePath: string, title: string): Video {
  return {
    id: '',
    title,
    fileSrc: filePath,
    hash: '',
    runtime: 0,
    imgSrc: '',
    imgUrls: [],
    continueWatching: [],
    watchLists: [],
  };
}

function VideoPlayerFilePage() {
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path') ?? '';
  const title = searchParams.get('title') ?? filePath.split(/[\\/]/).pop() ?? '';

  const navigate = useNavigate();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  useAppSettingsMpv();

  const mpv = useMpvPlayer();
  const video = buildMinimalVideo(filePath, title);

  const [playerViewState, dispatchPlayerViewState] = useReducer(
    playerViewReducer,
    INITIAL_PLAYER_VIEW_STATE,
  );
  const {
    videoLoaded,
    showInitialLoadingBackdrop,
    isErrorDialogOpen,
    errorMode,
    isRecoveringPlaybackError,
    isPlayerLoading,
    isPlaybackBuffering,
  } = playerViewState;

  const lastKnownPositionRef = useRef(0);
  const completedFirstLoadAttemptRef = useRef(false);
  const healthCheckInFlightRef = useRef(false);
  const playbackRecoveryInFlightRef = useRef(false);

  useKeyboardBack({
    enabled: !videoLoaded && !isErrorDialogOpen,
    preAction: () => {
      void mpv.stop();
      void mpv.embedMpv();
    },
  });

  const loadVideo = useCallback(
    async (resumeAt = 0): Promise<boolean> => {
      dispatchPlayerViewState({ isPlayerLoading: true, isPlaybackBuffering: false });

      try {
        const url = await getSignedVideoStreamUrlPassthrough({
          filePath,
          expiresIn: '2m',
        });
        const [_, ready] = await Promise.all([
          mpv.loadUrl(`${serverUrl}${url}`),
          mpv.waitForReady(LOAD_TIMEOUT_MS),
        ]);
        if (!ready) {
          throw new Error('Timed out waiting for video to become ready');
        }

        if (resumeAt > 0) {
          await mpv.setPosition(resumeAt);
        }

        lastKnownPositionRef.current = resumeAt;
        dispatchPlayerViewState({
          videoLoaded: true,
          isPlayerLoading: false,
          isErrorDialogOpen: false,
          isRecoveringPlaybackError: false,
        });
        return true;
      } catch (e) {
        console.error(e);
        dispatchPlayerViewState({ isPlayerLoading: false, videoLoaded: false });
        return false;
      } finally {
        if (!completedFirstLoadAttemptRef.current) {
          completedFirstLoadAttemptRef.current = true;
          dispatchPlayerViewState({ showInitialLoadingBackdrop: false });
        }
      }
    },
    [filePath, serverUrl, mpv.loadUrl, mpv.setPosition, mpv.waitForReady],
  );

  useEffect(() => {
    void mpv.embedMpv();
  }, [mpv.embedMpv]);

  useEffect(() => {
    setAppShellBackground('transparent');

    return () => {
      resetAppShellBackground();
    };
  }, []);

  useEffect(() => {
    if (!filePath || !serverUrl) {
      return;
    }

    let cancelled = false;

    const loadInitialVideo = async () => {
      dispatchPlayerViewState({ videoLoaded: false });
      const loaded = await loadVideo();

      if (cancelled || loaded) {
        return;
      }

      dispatchPlayerViewState({ errorMode: 'load', isErrorDialogOpen: true });
    };

    void loadInitialVideo();

    return () => {
      cancelled = true;
    };
  }, [filePath, serverUrl, loadVideo]);

  const attemptPlaybackRecovery = useCallback(async () => {
    playbackRecoveryInFlightRef.current = true;
    dispatchPlayerViewState({
      isRecoveringPlaybackError: true,
      isPlayerLoading: true,
      videoLoaded: false,
    });

    const recovered = await loadVideo(lastKnownPositionRef.current);

    playbackRecoveryInFlightRef.current = false;

    if (!recovered) {
      dispatchPlayerViewState({
        errorMode: 'playback',
        isRecoveringPlaybackError: false,
        isPlaybackBuffering: false,
        isErrorDialogOpen: true,
      });
    }
  }, [loadVideo]);

  const pollPlaybackHealth = useCallback(async () => {
    if (healthCheckInFlightRef.current || playbackRecoveryInFlightRef.current) {
      return;
    }

    healthCheckInFlightRef.current = true;

    try {
      const playbackStatus = await mpv.getPlaybackStatus();
      const currentPosition = playbackStatus.position;

      if (
        typeof currentPosition === 'number' &&
        Number.isFinite(currentPosition) &&
        currentPosition >= 0
      ) {
        lastKnownPositionRef.current = currentPosition;
      }

      const buffering = playbackStatus.pausedForCache || playbackStatus.seeking;
      dispatchPlayerViewState({ isPlaybackBuffering: buffering });
    } catch (error) {
      console.error('Playback health check failed:', error);
      dispatchPlayerViewState({ isPlaybackBuffering: false });
      await attemptPlaybackRecovery();
    } finally {
      healthCheckInFlightRef.current = false;
    }
  }, [attemptPlaybackRecovery, mpv.getPlaybackStatus]);

  useEffect(() => {
    if (!videoLoaded || isErrorDialogOpen) {
      return;
    }

    const interval = window.setInterval(() => {
      void pollPlaybackHealth();
    }, PLAYER_HEALTH_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [videoLoaded, isErrorDialogOpen, pollPlaybackHealth]);

  useEffect(() => {
    return () => {
      void mpv.stop();
    };
  }, [mpv.stop]);

  const handleGoBack = useCallback(async () => {
    await mpv.stop();
    await mpv.embedMpv();
    navigate(-1);
  }, [navigate, mpv.embedMpv, mpv.stop]);

  const handleRetry = useCallback(async () => {
    dispatchPlayerViewState({
      isErrorDialogOpen: false,
      videoLoaded: false,
      isPlayerLoading: true,
      isPlaybackBuffering: false,
    });

    const retryPosition = errorMode === 'playback' ? lastKnownPositionRef.current : 0;
    const loaded = await loadVideo(retryPosition);

    if (!loaded) {
      dispatchPlayerViewState({ isErrorDialogOpen: true });
      return;
    }

    dispatchPlayerViewState({ isRecoveringPlaybackError: false });
  }, [errorMode, loadVideo]);

  const handleSeekCommitted = useCallback((position: number) => {
    if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) {
      return;
    }

    lastKnownPositionRef.current = position;
  }, []);

  if (!filePath) {
    return <Loading />;
  }

  const shouldShowLoadingOverlay =
    !isErrorDialogOpen && (isPlayerLoading || isPlaybackBuffering || !videoLoaded);
  const shouldUseBlackLoadingBackdrop = !videoLoaded || showInitialLoadingBackdrop;

  return (
    <>
      {!!shouldShowLoadingOverlay && (
        <div
          className={`fixed inset-0 z-90 flex items-center justify-center ${shouldUseBlackLoadingBackdrop ? 'bg-black' : 'pointer-events-none bg-transparent'}`}
        >
          <Loading />
        </div>
      )}

      <AppAlertDialog
        open={isErrorDialogOpen}
        subtitle={errorMode === 'playback' ? 'Playback interrupted' : 'Unable to start playback'}
        title="Video could not be loaded"
        description={
          errorMode === 'playback'
            ? 'Playback failed while the video was running. We tried to recover your session and could not continue streaming.'
            : 'We could not load this video in time. Please check your connection or try again.'
        }
        secondaryAction={{
          label: 'Go back',
          onPress: handleGoBack,
        }}
        primaryAction={{
          label: 'Retry',
          onPress: handleRetry,
        }}
      />

      {!!videoLoaded && !isRecoveringPlaybackError && (
        <VideoPlayer video={video} onSeekCommitted={handleSeekCommitted} />
      )}
    </>
  );
}

export default memo(VideoPlayerFilePage);
