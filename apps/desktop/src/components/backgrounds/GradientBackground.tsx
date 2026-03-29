import { useGetImageColors } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface GradientBackgroundProps {
  showGradient?: boolean;
  imageSrc?: string;
  width?: string;
  height?: string;
  index?: number;
}

interface ImageColorsResponse {
  css?: string;
  data?: {
    css?: string;
  };
}

const GRADIENT_TRANSITION_MS = 700;

const windowsPathRegex = /^[a-zA-Z]:[\\/]/;
const unixPathRegex = /^\//;

const isAbsolutePath = (value: string): boolean => {
  return windowsPathRegex.test(value) || unixPathRegex.test(value);
};

const normalizeRelativeImageUrl = (serverUrl: string, imageSrc: string): string => {
  const normalizedServerUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  const normalizedImagePath = imageSrc.startsWith('/') ? imageSrc.slice(1) : imageSrc;

  return `${normalizedServerUrl}/${normalizedImagePath.replace('resources/img', 'img')}`;
};

const normalizeGradientCss = (value?: string): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/^background\s*:\s*/i, '')
    .replace(/;$/, '')
    .trim();
};

const getImageColorsSourceKey = (params?: { url?: string; localPath?: string }): string => {
  if (params?.url) {
    return `url:${params.url}`;
  }

  if (params?.localPath) {
    return `local:${params.localPath}`;
  }

  return '';
};

const buildImageColorsParams = (
  serverUrl: string,
  imageSrc?: string,
): { url?: string; localPath?: string } | undefined => {
  if (!imageSrc || imageSrc === '') {
    return undefined;
  }

  if (imageSrc.startsWith('http')) {
    return { url: imageSrc };
  }

  if (imageSrc.startsWith('local')) {
    return { localPath: imageSrc.replace('local', '') };
  }

  if (isAbsolutePath(imageSrc)) {
    return { localPath: imageSrc };
  }

  if (!serverUrl) {
    return undefined;
  }

  return { url: normalizeRelativeImageUrl(serverUrl, imageSrc) };
};

const GradientBackground = ({
  showGradient = true,
  imageSrc,
  width = '100%',
  height = '100%',
  index = -1,
}: GradientBackgroundProps) => {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [currentGradient, setCurrentGradient] = useState('');
  const [nextGradient, setNextGradient] = useState('');
  const [isNextGradientVisible, setIsNextGradientVisible] = useState(false);
  const gradientCacheRef = useRef<Record<string, string>>({});
  const transitionFrameRef = useRef<number | null>(null);

  const imageColorsParams = useMemo(
    () => buildImageColorsParams(serverUrl, imageSrc),
    [serverUrl, imageSrc],
  );
  const imageSourceKey = useMemo(
    () => getImageColorsSourceKey(imageColorsParams),
    [imageColorsParams],
  );

  const { data: imageColorsData } = useGetImageColors<ImageColorsResponse>({
    enabled: showGradient && !!imageColorsParams,
    params: imageColorsParams,
    queryKey: ['images', 'colors', serverUrl, imageSrc],
    staleTime: 1000 * 60 * 30,
  });

  const imageColorsCss = normalizeGradientCss(imageColorsData?.css ?? imageColorsData?.data?.css);

  const cancelScheduledTransition = useCallback(() => {
    if (transitionFrameRef.current !== null) {
      cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }
  }, []);

  const resetTransitionState = useCallback(() => {
    setNextGradient('');
    setIsNextGradientVisible(false);
  }, []);

  const scheduleTransition = useCallback(
    (gradient: string) => {
      setNextGradient(gradient);
      setIsNextGradientVisible(false);
      cancelScheduledTransition();

      transitionFrameRef.current = requestAnimationFrame(() => {
        setIsNextGradientVisible(true);
        transitionFrameRef.current = null;
      });
    },
    [cancelScheduledTransition],
  );

  useEffect(() => {
    if (!showGradient || !imageSourceKey) {
      cancelScheduledTransition();
      setCurrentGradient('');
      resetTransitionState();
      return;
    }

    const resolvedGradient = imageColorsCss || gradientCacheRef.current[imageSourceKey];
    if (!resolvedGradient) {
      return;
    }

    if (imageColorsCss) {
      gradientCacheRef.current[imageSourceKey] = imageColorsCss;
    }

    if (resolvedGradient === currentGradient) {
      cancelScheduledTransition();
      resetTransitionState();
      return;
    }

    if (!currentGradient) {
      cancelScheduledTransition();
      setCurrentGradient(resolvedGradient);
      resetTransitionState();
      return;
    }

    scheduleTransition(resolvedGradient);

    return () => {
      cancelScheduledTransition();
    };
  }, [
    showGradient,
    imageSourceKey,
    imageColorsCss,
    currentGradient,
    cancelScheduledTransition,
    resetTransitionState,
    scheduleTransition,
  ]);

  const handleNextGradientTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== 'opacity' || !isNextGradientVisible || !nextGradient) {
      return;
    }

    setCurrentGradient(nextGradient);
    setNextGradient('');
    setIsNextGradientVisible(false);
  };

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: index, width, height }}>
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          width,
          height,
          background: currentGradient,
        }}
      />
      <div
        className="absolute inset-0 h-full w-full transition-opacity duration-700"
        onTransitionEnd={handleNextGradientTransitionEnd}
        style={{
          width,
          height,
          background: nextGradient,
          opacity: isNextGradientVisible ? 1 : 0,
          transitionDuration: `${GRADIENT_TRANSITION_MS}ms`,
        }}
      />
    </div>
  );
};

export default GradientBackground;
