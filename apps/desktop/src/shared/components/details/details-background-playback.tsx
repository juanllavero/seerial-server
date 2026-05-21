import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DetailsBackgroundAudioPlayer from '@/shared/components/details/details-background-audio-player';
import DetailsBackgroundVideoPlayer from '@/shared/components/details/details-background-video-player';

type PlaybackMode = 'none' | 'audio' | 'video';

function normalizeLocalIds(localIds: Array<string | null | undefined>): string[] {
  return Array.from(new Set(localIds.filter((value): value is string => Boolean(value))));
}

interface DetailsBackgroundPlaybackProps {
  audioLocalIds: Array<string | null | undefined>;
  videoLocalIds: Array<string | null | undefined>;
  onVideoVisibilityChange?: (isVisible: boolean) => void;
}

function DetailsBackgroundPlayback({
  audioLocalIds,
  videoLocalIds,
  onVideoVisibilityChange,
}: DetailsBackgroundPlaybackProps) {
  const audioCandidates = useMemo(() => normalizeLocalIds(audioLocalIds), [audioLocalIds]);
  const videoCandidates = useMemo(() => normalizeLocalIds(videoLocalIds), [videoLocalIds]);

  const audioCandidatesKey = audioCandidates.join('|');
  const videoCandidatesKey = videoCandidates.join('|');
  const hasAudioCandidates = audioCandidates.length > 0;
  const hasVideoCandidates = videoCandidates.length > 0;

  const [playbackState, setPlaybackState] = useState<{
    mode: PlaybackMode;
    audioIndex: number;
    videoIndex: number;
  }>({
    mode: 'none',
    audioIndex: 0,
    videoIndex: 0,
  });
  const previousCandidatesRef = useRef({ audio: '', video: '' });

  const { mode, audioIndex, videoIndex } = playbackState;

  useEffect(() => {
    if (
      previousCandidatesRef.current.audio === audioCandidatesKey &&
      previousCandidatesRef.current.video === videoCandidatesKey
    ) {
      return;
    }

    previousCandidatesRef.current = {
      audio: audioCandidatesKey,
      video: videoCandidatesKey,
    };

    let nextMode: PlaybackMode = 'none';
    if (hasVideoCandidates) {
      nextMode = 'video';
    } else if (hasAudioCandidates) {
      nextMode = 'audio';
    }

    setPlaybackState({
      audioIndex: 0,
      videoIndex: 0,
      mode: nextMode,
    });
  }, [audioCandidatesKey, hasAudioCandidates, hasVideoCandidates, videoCandidatesKey]);

  const handleVideoUnavailable = useCallback(() => {
    onVideoVisibilityChange?.(false);

    setPlaybackState((currentState) => {
      if (currentState.videoIndex + 1 < videoCandidates.length) {
        return {
          ...currentState,
          videoIndex: currentState.videoIndex + 1,
        };
      }

      if (audioCandidates.length > 0) {
        return {
          ...currentState,
          audioIndex: 0,
          mode: 'audio',
        };
      }

      return {
        ...currentState,
        mode: 'none',
      };
    });
  }, [audioCandidates.length, onVideoVisibilityChange, videoCandidates.length]);

  const handleAudioUnavailable = useCallback(() => {
    setPlaybackState((currentState) => {
      if (currentState.audioIndex + 1 < audioCandidates.length) {
        return {
          ...currentState,
          audioIndex: currentState.audioIndex + 1,
        };
      }

      return {
        ...currentState,
        mode: 'none',
      };
    });
  }, [audioCandidates.length]);

  const handleVideoEnded = useCallback(() => {
    onVideoVisibilityChange?.(false);
    setPlaybackState((currentState) => ({
      ...currentState,
      mode: 'none',
    }));
  }, [onVideoVisibilityChange]);

  const activeAudioLocalId = audioCandidates[audioIndex];
  const activeVideoLocalId = videoCandidates[videoIndex];

  if (mode === 'video' && activeVideoLocalId) {
    return (
      <DetailsBackgroundVideoPlayer
        localId={activeVideoLocalId}
        onEnded={handleVideoEnded}
        onUnavailable={handleVideoUnavailable}
        onVisibilityChange={onVideoVisibilityChange}
      />
    );
  }

  if (mode === 'audio' && activeAudioLocalId) {
    return (
      <DetailsBackgroundAudioPlayer
        localId={activeAudioLocalId}
        onUnavailable={handleAudioUnavailable}
      />
    );
  }

  return null;
}

export default memo(DetailsBackgroundPlayback);
