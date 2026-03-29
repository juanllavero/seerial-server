import { useGetImageColors } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useEffect, useRef, useState } from 'react';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const gradientRef = useRef<HTMLDivElement>(null);
  const handleTransitionEndRef = useRef<((event: TransitionEvent) => void) | null>(null);

  const imageColorsParams = buildImageColorsParams(serverUrl, imageSrc);

  const { data: imageColorsData } = useGetImageColors<ImageColorsResponse>({
    enabled: showGradient && !!imageColorsParams,
    params: imageColorsParams,
    queryKey: ['images', 'colors', serverUrl, imageSrc],
  });

  const imageColorsCss = imageColorsData?.css ?? imageColorsData?.data?.css;

  useEffect(() => {
    if (!showGradient || !imageSrc || imageSrc === '') {
      setCurrentGradient('');
      return;
    }

    const nextCss = imageColorsCss;
    if (!nextCss) {
      return;
    }

    const cleanCss = nextCss.replace('background: ', '').replace(';', '');

    if (cleanCss === currentGradient) {
      return;
    }

    if (!currentGradient) {
      setCurrentGradient(cleanCss);
      return;
    }

    setIsTransitioning(true);

    handleTransitionEndRef.current = (event: TransitionEvent) => {
      if (event.propertyName !== 'opacity') return;

      setCurrentGradient(cleanCss);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 0);

      if (gradientRef.current && handleTransitionEndRef.current) {
        gradientRef.current.removeEventListener('transitionend', handleTransitionEndRef.current);
      }
      handleTransitionEndRef.current = null;
    };

    if (gradientRef.current && handleTransitionEndRef.current) {
      gradientRef.current.addEventListener('transitionend', handleTransitionEndRef.current);
    }

    return () => {
      if (gradientRef.current && handleTransitionEndRef.current) {
        gradientRef.current.removeEventListener('transitionend', handleTransitionEndRef.current);
        handleTransitionEndRef.current = null;
      }
    };
  }, [imageSrc, showGradient, currentGradient, imageColorsCss]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: index, width, height }}>
      <div
        ref={gradientRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          width,
          height,
          background: currentGradient,
        }}
      />
    </div>
  );
};

export default GradientBackground;
