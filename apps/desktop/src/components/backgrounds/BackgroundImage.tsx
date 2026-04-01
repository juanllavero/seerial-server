import { useGetLocalImage } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { memo, useEffect, useRef, useState } from 'react';

interface BackgroundImageProps {
  imageSrc: string | undefined;
  index?: number;
}

function BackgroundImage({ imageSrc, index = 1 }: BackgroundImageProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const isRemoteUrl = !!imageSrc?.startsWith('http');
  const localImagePath = imageSrc && !isRemoteUrl ? imageSrc : undefined;

  const { data: localImageBlob } = useGetLocalImage({
    enabled: !!localImagePath && !!serverUrl,
    params: localImagePath ? { path: localImagePath } : undefined,
    queryKey: ['images', 'local', serverUrl, localImagePath],
  });

  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(
    isRemoteUrl ? imageSrc : undefined,
  );

  useEffect(() => {
    if (isRemoteUrl) {
      setResolvedSrc(imageSrc);
      return;
    }
    if (!imageSrc) {
      setResolvedSrc(undefined);
      return;
    }
    if (!localImageBlob) {
      return;
    }

    const objectUrl = URL.createObjectURL(localImageBlob);
    setResolvedSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageSrc, isRemoteUrl, localImageBlob]);

  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [nextSrc, setNextSrc] = useState<string | null>(null);
  const [showNext, setShowNext] = useState(false);
  const nextImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!resolvedSrc) {
      setShowNext(false);
      setCurrentSrc(null);
      setNextSrc(null);
      return;
    }

    if (!currentSrc) {
      setNextSrc(resolvedSrc);
      return;
    }

    if (resolvedSrc !== (nextSrc ?? currentSrc)) {
      setShowNext(false);
      setNextSrc(resolvedSrc);
    }
  }, [resolvedSrc, currentSrc, nextSrc]);

  const handleNextLoaded = () => {
    setShowNext(true);
  };

  const handleFadeInComplete = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'opacity' || !showNext) return;
    setCurrentSrc(nextSrc);
    setNextSrc(null);
    setShowNext(false);
  };

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(0.2)',
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: index }}>
      {currentSrc && (
        <img
          src={currentSrc}
          alt=""
          draggable={false}
          decoding="async"
          style={{ ...imgStyle, opacity: 1 }}
        />
      )}

      {nextSrc && (
        <img
          ref={nextImgRef}
          src={nextSrc}
          alt=""
          draggable={false}
          decoding="async"
          onLoad={handleNextLoaded}
          onTransitionEnd={handleFadeInComplete}
          style={{
            ...imgStyle,
            opacity: showNext ? 1 : 0,
            transition: 'opacity 700ms ease-in-out',
            willChange: 'opacity',
          }}
        />
      )}
    </div>
  );
}

export default memo(BackgroundImage);
