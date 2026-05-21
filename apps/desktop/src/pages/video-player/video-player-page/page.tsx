import {
  getSignedVideoStreamUrlPassthrough,
  useGetVideo,
  useUpdateVideoWatchState,
} from '@seerial/api';
import type { Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { memo, useCallback, useEffect, useReducer, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
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

function useVideoPlayerPageController({
  video,
  loadingVideo,
  serverUrl,
  currentUserId,
  navigate,
}: {
  video?: Video;
  loadingVideo: boolean;
  serverUrl: string;
  currentUserId?: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const mpv = useMpvPlayer();
  const [playerViewState, setPlayerViewState] = useReducer(
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
  const watchStateTrackedRef = useRef(false);
  const videoEndedTrackedRef = useRef(false);
  const currentVideoRef = useRef<Video | null>(null);
  const currentUserIdRef = useRef<string | undefined>(undefined);

  const { mutate: updateWatchState } = useUpdateVideoWatchState();

  const getInitialPlaybackPosition = useCallback(
    (videoToPlay: Video) => {
      const watchList = videoToPlay.watchLists?.find((list) => list.userId === currentUserId);
      const timeWatched = watchList?.timeWatched ?? 0;
      return timeWatched > 0 ? timeWatched : 0;
    },
    [currentUserId],
  );

  const getSignedStreamUrl = useCallback(
    async (videoToPlay: Video) => {
      const url = await getSignedVideoStreamUrlPassthrough({
        filePath: videoToPlay.fileSrc,
        expiresIn: '2m',
      });
      return `${serverUrl}${url}`;
    },
    [serverUrl],
  );

  const loadVideo = useCallback(
    async (videoToPlay: Video, resumeAt = 0): Promise<boolean> => {
      setPlayerViewState({ isPlayerLoading: true, isPlaybackBuffering: false });

      try {
        const url = await getSignedStreamUrl(videoToPlay);
        const [_, ready] = await Promise.all([mpv.loadUrl(url), mpv.waitForReady(LOAD_TIMEOUT_MS)]);
        if (!ready) {
          throw new Error('Timed out waiting for video to become ready');
        }

        if (resumeAt > 0) {
          await mpv.setPosition(resumeAt);
        }

        lastKnownPositionRef.current = resumeAt;
        setPlayerViewState({
          videoLoaded: true,
          isPlayerLoading: false,
          isErrorDialogOpen: false,
          isRecoveringPlaybackError: false,
        });
        return true;
      } catch (e) {
        console.error(e);
        setPlayerViewState({ isPlayerLoading: false, videoLoaded: false });
        return false;
      } finally {
        if (!completedFirstLoadAttemptRef.current) {
          completedFirstLoadAttemptRef.current = true;
          setPlayerViewState({ showInitialLoadingBackdrop: false });
        }
      }
    },
    [getSignedStreamUrl, mpv.loadUrl, mpv.waitForReady, mpv.setPosition],
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
    currentVideoRef.current = video ?? null;
    currentUserIdRef.current = currentUserId;
  }, [video, currentUserId]);

  useEffect(() => {
    if (!videoLoaded || !video || !currentUserId || watchStateTrackedRef.current) {
      return;
    }

    watchStateTrackedRef.current = true;

    updateWatchState({
      videoId: video.id,
      timeWatched: lastKnownPositionRef.current,
      watched: false,
      userId: currentUserId,
    });
  }, [videoLoaded, video, currentUserId, updateWatchState]);

  useEffect(() => {
    if (!video || !serverUrl) {
      return;
    }

    let cancelled = false;

    const loadInitialVideo = async () => {
      watchStateTrackedRef.current = false;
      videoEndedTrackedRef.current = false;
      setPlayerViewState({ videoLoaded: false });

      const initialPosition = getInitialPlaybackPosition(video);
      const loaded = await loadVideo(video, initialPosition);

      if (cancelled || loaded) {
        return;
      }

      setPlayerViewState({ errorMode: 'load', isErrorDialogOpen: true });
    };

    void loadInitialVideo();

    return () => {
      cancelled = true;
    };
  }, [video?.id, video?.fileSrc, serverUrl, getInitialPlaybackPosition, loadVideo, video]);

  const attemptPlaybackRecovery = useCallback(async () => {
    if (!video) {
      return;
    }

    playbackRecoveryInFlightRef.current = true;
    setPlayerViewState({
      isRecoveringPlaybackError: true,
      isPlayerLoading: true,
      videoLoaded: false,
    });

    const recovered = await loadVideo(video, lastKnownPositionRef.current);

    playbackRecoveryInFlightRef.current = false;

    if (!recovered) {
      setPlayerViewState({
        errorMode: 'playback',
        isRecoveringPlaybackError: false,
        isPlaybackBuffering: false,
        isErrorDialogOpen: true,
      });
    }
  }, [loadVideo, video]);

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

      if (playbackStatus.idleActive && !playbackStatus.eofReached) {
        setPlayerViewState({ isPlaybackBuffering: false });
        await attemptPlaybackRecovery();
        return;
      }

      const buffering = playbackStatus.pausedForCache || playbackStatus.seeking;
      setPlayerViewState({ isPlaybackBuffering: buffering });
    } catch (error) {
      console.error('Playback health check failed:', error);
      setPlayerViewState({ isPlaybackBuffering: false });
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
    if (!videoLoaded || !video || !currentUserId) {
      return;
    }

    const checkIfEnded = async () => {
      try {
        const playbackStatus = await mpv.getPlaybackStatus();

        if (playbackStatus.eofReached && !videoEndedTrackedRef.current) {
          videoEndedTrackedRef.current = true;
          updateWatchState({
            videoId: video.id,
            timeWatched: lastKnownPositionRef.current,
            watched: true,
            userId: currentUserId,
          });
        }
      } catch (error) {
        console.error('Error checking if video ended:', error);
      }
    };

    const interval = window.setInterval(() => {
      void checkIfEnded();
    }, PLAYER_HEALTH_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [videoLoaded, video, currentUserId, updateWatchState, mpv.getPlaybackStatus]);

  useEffect(() => {
    return () => {
      const currentVideo = currentVideoRef.current;
      const activeUserId = currentUserIdRef.current;

      if (
        currentVideo &&
        activeUserId &&
        watchStateTrackedRef.current &&
        !videoEndedTrackedRef.current
      ) {
        updateWatchState({
          videoId: currentVideo.id,
          timeWatched: lastKnownPositionRef.current,
          watched: false,
          userId: activeUserId,
        });
      }

      void mpv.stop();
    };
  }, [updateWatchState, mpv.stop]);

  const handleGoBack = useCallback(async () => {
    await mpv.stop();
    await mpv.embedMpv();
    navigate(-1);
  }, [navigate, mpv.stop, mpv.embedMpv]);

  const handleRetry = useCallback(async () => {
    if (!video) {
      return;
    }

    setPlayerViewState({
      isErrorDialogOpen: false,
      videoLoaded: false,
      isPlayerLoading: true,
      isPlaybackBuffering: false,
    });

    const retryPosition =
      errorMode === 'playback' ? lastKnownPositionRef.current : getInitialPlaybackPosition(video);
    const loaded = await loadVideo(video, retryPosition);

    if (!loaded) {
      setPlayerViewState({ isErrorDialogOpen: true });
      return;
    }

    setPlayerViewState({ isRecoveringPlaybackError: false });
  }, [errorMode, getInitialPlaybackPosition, loadVideo, video]);

  useKeyboardBack({
    enabled: !videoLoaded && !isErrorDialogOpen,
    preAction: () => {
      void mpv.stop();
      void mpv.embedMpv();
    },
  });

  const shouldShowLoadingOverlay =
    !isErrorDialogOpen && (isPlayerLoading || isPlaybackBuffering || !videoLoaded);
  const shouldUseBlackLoadingBackdrop = !videoLoaded || showInitialLoadingBackdrop;

  return {
    isPageLoading: !video || loadingVideo,
    videoLoaded,
    isRecoveringPlaybackError,
    isErrorDialogOpen,
    errorMode,
    shouldShowLoadingOverlay,
    shouldUseBlackLoadingBackdrop,
    handleGoBack,
    handleRetry,
  };
}

function VideoPlayerPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { serverUrl, currentUserId } = useServerStore((state) => ({
    serverUrl: state.selectedServer?.url ?? '',
    currentUserId: state.currentUser?.id,
  }));

  useAppSettingsMpv();

  const { data: video, isLoading: loadingVideo } = useGetVideo<Video>(videoId ?? '', {
    enabled: !!videoId && serverUrl !== '',
  });
  const {
    isPageLoading,
    videoLoaded,
    isRecoveringPlaybackError,
    isErrorDialogOpen,
    errorMode,
    shouldShowLoadingOverlay,
    shouldUseBlackLoadingBackdrop,
    handleGoBack,
    handleRetry,
  } = useVideoPlayerPageController({
    video,
    loadingVideo,
    serverUrl,
    currentUserId,
    navigate,
  });

  if (isPageLoading) {
    return <Loading />;
  }

  if (!video) {
    return <Loading />;
  }

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

      {!!videoLoaded && !isRecoveringPlaybackError && <VideoPlayer video={video} />}
    </>
  );
}

export default memo(VideoPlayerPage);
