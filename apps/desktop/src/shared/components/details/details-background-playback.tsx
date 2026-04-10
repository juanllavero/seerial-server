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

  const [mode, setMode] = useState<PlaybackMode>('none');
  const [audioIndex, setAudioIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const previousCandidatesRef = useRef({ audio: '', video: '' });

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

    setAudioIndex(0);
    setVideoIndex(0);
    onVideoVisibilityChange?.(false);

    if (hasVideoCandidates) {
      setMode('video');
      return;
    }

    if (hasAudioCandidates) {
      setMode('audio');
      return;
    }

    setMode('none');
  }, [
    audioCandidatesKey,
    hasAudioCandidates,
    hasVideoCandidates,
    onVideoVisibilityChange,
    videoCandidatesKey,
  ]);

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
