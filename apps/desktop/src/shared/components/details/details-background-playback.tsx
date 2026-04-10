import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import DetailsBackgroundAudioPlayer from '@/shared/components/details/details-background-audio-player';
import DetailsBackgroundVideoPlayer from '@/shared/components/details/details-background-video-player';

type PlaybackMode = 'none' | 'audio' | 'video';

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
  const audioCandidates = useMemo(() => {
    return Array.from(new Set(audioLocalIds.filter((value): value is string => Boolean(value))));
  }, [audioLocalIds]);

  const videoCandidates = useMemo(() => {
    return Array.from(new Set(videoLocalIds.filter((value): value is string => Boolean(value))));
  }, [videoLocalIds]);

  const [mode, setMode] = useState<PlaybackMode>('none');
  const [audioIndex, setAudioIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    setAudioIndex(0);
    setVideoIndex(0);
    onVideoVisibilityChange?.(false);

    if (videoCandidates.length > 0) {
      setMode('video');
      return;
    }

    if (audioCandidates.length > 0) {
      setMode('audio');
      return;
    }

    setMode('none');
  }, [audioCandidates, onVideoVisibilityChange, videoCandidates]);

  const handleVideoUnavailable = useCallback(() => {
    onVideoVisibilityChange?.(false);

    if (videoIndex + 1 < videoCandidates.length) {
      setVideoIndex(videoIndex + 1);
      return;
    }

    if (audioCandidates.length > 0) {
      setAudioIndex(0);
      setMode('audio');
      return;
    }

    setMode('none');
  }, [audioCandidates.length, onVideoVisibilityChange, videoCandidates.length, videoIndex]);

  const handleAudioUnavailable = useCallback(() => {
    if (audioIndex + 1 < audioCandidates.length) {
      setAudioIndex(audioIndex + 1);
      return;
    }

    setMode('none');
  }, [audioCandidates.length, audioIndex]);

  const handleVideoEnded = useCallback(() => {
    onVideoVisibilityChange?.(false);
    setMode('none');
  }, [onVideoVisibilityChange]);

  const activeAudioLocalId = audioCandidates[audioIndex];
  const activeVideoLocalId = videoCandidates[videoIndex];

  if (mode === 'video' && activeVideoLocalId) {
    return (
      <DetailsBackgroundVideoPlayer
        key={`video:${activeVideoLocalId}`}
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
        key={`audio:${activeAudioLocalId}`}
        localId={activeAudioLocalId}
        onUnavailable={handleAudioUnavailable}
      />
    );
  }

  return null;
}

export default memo(DetailsBackgroundPlayback);
