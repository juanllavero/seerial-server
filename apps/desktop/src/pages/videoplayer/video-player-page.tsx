import {
  getSignedVideoStreamUrlPassthrough,
  useGetVideo,
  useUpdateVideoWatchState,
} from '@seerial/api';
import type { Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import VideoPlayer from '@/features/video-player/video-player';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import Loading from '@/shared/components/loading';

const READY_POLL_INTERVAL_MS = 250;
const LOAD_TIMEOUT_MS = 5000;
const PLAYER_HEALTH_POLL_INTERVAL_MS = 1000;

type PlayerErrorMode = 'load' | 'playback';

interface PlaybackStatus {
  position?: number;
  duration?: number;
  pausedForCache: boolean;
  seeking: boolean;
  idleActive: boolean;
  eofReached: boolean;
}

function VideoPlayerPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { serverUrl, currentUserId } = useServerStore((state) => ({
    serverUrl: state.selectedServer?.url ?? '',
    currentUserId: state.currentUser?.id,
  }));

  const { data: video, isLoading: loadingVideo } = useGetVideo<Video>(videoId ?? '', {
    enabled: !!videoId && serverUrl !== '',
  });

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showInitialLoadingBackdrop, setShowInitialLoadingBackdrop] = useState(true);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMode, setErrorMode] = useState<PlayerErrorMode>('load');
  const [isRecoveringPlaybackError, setIsRecoveringPlaybackError] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [isPlaybackBuffering, setIsPlaybackBuffering] = useState(false);

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

  const waitForVideoReady = useCallback(async (timeoutMs: number): Promise<boolean> => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      try {
        const duration = await invoke<number>('get_duration');
        if (Number.isFinite(duration) && duration > 0) {
          return true;
        }
      } catch {
        // Keep polling until timeout to allow MPV buffering and metadata parsing.
      }

      await new Promise((resolve) => setTimeout(resolve, READY_POLL_INTERVAL_MS));
    }

    return false;
  }, []);

  const getSignedStreamUrl = useCallback(
    async (video: Video) => {
      const url = await getSignedVideoStreamUrlPassthrough({
        filePath: video.fileSrc,
        expiresIn: '2m',
      });
      return `${serverUrl}${url}`;
    },
    [serverUrl],
  );

  const loadVideo = useCallback(
    async (videoToPlay: Video, resumeAt = 0): Promise<boolean> => {
      setIsPlayerLoading(true);
      setIsPlaybackBuffering(false);

      try {
        const url = await getSignedStreamUrl(videoToPlay);
        await invoke('load_url', { url });

        const ready = await waitForVideoReady(LOAD_TIMEOUT_MS);
        if (!ready) {
          throw new Error('Timed out waiting for video to become ready');
        }

        if (resumeAt > 0) {
          await invoke('set_position', { position: resumeAt });
        }

        lastKnownPositionRef.current = resumeAt;
        setVideoLoaded(true);
        setIsPlayerLoading(false);
        setIsErrorDialogOpen(false);
        setIsRecoveringPlaybackError(false);
        return true;
      } catch (e) {
        console.error(e);
        setIsPlayerLoading(false);
        setVideoLoaded(false);
        return false;
      } finally {
        if (!completedFirstLoadAttemptRef.current) {
          completedFirstLoadAttemptRef.current = true;
          setShowInitialLoadingBackdrop(false);
        }
      }
    },
    [getSignedStreamUrl, waitForVideoReady],
  );

  useEffect(() => {
    invoke('embed_mpv').catch(console.error);
  }, []);

  useEffect(() => {
    currentVideoRef.current = video ?? null;
    currentUserIdRef.current = currentUserId;
  }, [video, currentUserId]);

  // Track when video playback starts
  useEffect(() => {
    if (!videoLoaded || !video || !currentUserId || watchStateTrackedRef.current) {
      return;
    }

    watchStateTrackedRef.current = true;

    // Mark the video as being watched (watched: false means still watching, not finished)
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
      setVideoLoaded(false);

      const initialPosition = getInitialPlaybackPosition(video);
      const loaded = await loadVideo(video, initialPosition);

      if (cancelled || loaded) {
        return;
      }

      setErrorMode('load');
      setIsErrorDialogOpen(true);
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
    setIsRecoveringPlaybackError(true);
    setIsPlayerLoading(true);
    setVideoLoaded(false);

    const recovered = await loadVideo(video, lastKnownPositionRef.current);

    playbackRecoveryInFlightRef.current = false;

    if (!recovered) {
      setErrorMode('playback');
      setIsRecoveringPlaybackError(false);
      setIsPlaybackBuffering(false);
      setIsErrorDialogOpen(true);
    }
  }, [loadVideo, video]);

  const pollPlaybackHealth = useCallback(async () => {
    if (healthCheckInFlightRef.current || playbackRecoveryInFlightRef.current) {
      return;
    }

    healthCheckInFlightRef.current = true;

    try {
      const playbackStatus = await invoke<PlaybackStatus>('get_playback_status');
      const currentPosition = playbackStatus.position;

      if (
        typeof currentPosition === 'number' &&
        Number.isFinite(currentPosition) &&
        currentPosition >= 0
      ) {
        lastKnownPositionRef.current = currentPosition;
      }

      const buffering = playbackStatus.pausedForCache || playbackStatus.seeking;
      setIsPlaybackBuffering(buffering);
    } catch (error) {
      console.error('Playback health check failed:', error);
      setIsPlaybackBuffering(false);
      await attemptPlaybackRecovery();
    } finally {
      healthCheckInFlightRef.current = false;
    }
  }, [attemptPlaybackRecovery]);

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

  // Track when video ends
  useEffect(() => {
    if (!videoLoaded || !video || !currentUserId) {
      return;
    }

    const checkIfEnded = async () => {
      try {
        const playbackStatus = await invoke<PlaybackStatus>('get_playback_status');

        if (playbackStatus.eofReached && !videoEndedTrackedRef.current) {
          videoEndedTrackedRef.current = true;
          // Mark the video as watched (watched: true means finished watching)
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
  }, [videoLoaded, video, currentUserId, updateWatchState]);

  useEffect(() => {
    return () => {
      const currentVideo = currentVideoRef.current;
      const activeUserId = currentUserIdRef.current;

      // Update watch state with current position when leaving the player
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

      invoke('stop').catch(console.error);
    };
  }, [updateWatchState]);

  const handleGoBack = useCallback(async () => {
    await invoke('stop').catch(console.error);
    await invoke('embed_mpv').catch(console.error);
    navigate(-1);
  }, [navigate]);

  const handleRetry = useCallback(async () => {
    if (!video) {
      return;
    }

    setIsErrorDialogOpen(false);
    setVideoLoaded(false);
    setIsPlayerLoading(true);
    setIsPlaybackBuffering(false);

    const retryPosition =
      errorMode === 'playback' ? lastKnownPositionRef.current : getInitialPlaybackPosition(video);
    const loaded = await loadVideo(video, retryPosition);

    if (!loaded) {
      setIsErrorDialogOpen(true);
      return;
    }

    setIsRecoveringPlaybackError(false);
  }, [errorMode, getInitialPlaybackPosition, loadVideo, video]);

  if (!video || loadingVideo) {
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

      {!!videoLoaded && !isRecoveringPlaybackError && <VideoPlayer video={video} />}
    </>
  );
}

export default memo(VideoPlayerPage);
