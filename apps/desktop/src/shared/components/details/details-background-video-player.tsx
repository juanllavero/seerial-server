import { getSignedVideoStreamUrlPassthrough } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useCallback, useEffect, useRef, useState } from 'react';

const VIDEO_REVEAL_DELAY_MS = 1250;

interface DetailsBackgroundVideoPlayerProps {
  localId: string;
  onEnded?: () => void;
  onUnavailable?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

function DetailsBackgroundVideoPlayer({
  localId,
  onEnded,
  onUnavailable,
  onVisibilityChange,
}: DetailsBackgroundVideoPlayerProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const isDisposedRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isDisposedRef.current = false;
    onVisibilityChange?.(false);
    setVideoSrc(null);

    if (!localId || !serverUrl) {
      return () => {
        isDisposedRef.current = true;
      };
    }

    getSignedVideoStreamUrlPassthrough({
      filePath: 'none',
      localId,
      expiresIn: '10m',
    })
      .then((signedUrl) => {
        if (isDisposedRef.current || !signedUrl) {
          if (!isDisposedRef.current) onUnavailable?.();
          return;
        }

        setVideoSrc(`${serverUrl}${signedUrl}`);
      })
      .catch(() => {
        if (!isDisposedRef.current) onUnavailable?.();
      });

    return () => {
      isDisposedRef.current = true;
      clearRevealTimer();
    };
  }, [clearRevealTimer, localId, onUnavailable, onVisibilityChange, serverUrl]);

  const handleCanPlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.volume = 1;
    }
    clearRevealTimer();
    revealTimerRef.current = window.setTimeout(() => {
      if (!isDisposedRef.current) {
        onVisibilityChange?.(true);
      }
    }, VIDEO_REVEAL_DELAY_MS);
  }, [clearRevealTimer, onVisibilityChange]);

  const handleEnded = useCallback(() => {
    onVisibilityChange?.(false);
    onEnded?.();
  }, [onEnded, onVisibilityChange]);

  const handleError = useCallback(() => {
    onVisibilityChange?.(false);
    if (!isDisposedRef.current) onUnavailable?.();
  }, [onUnavailable, onVisibilityChange]);

  const mask = 'radial-gradient(circle at 80% 50%, black 10%, transparent 90%)';

  if (!videoSrc) return null;

  return (
    <div
      className="fixed top-0 right-0 h-screen w-auto z-0 pointer-events-none"
      style={{
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
      />
    </div>
  );
}

export default DetailsBackgroundVideoPlayer;
