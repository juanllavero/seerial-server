import { useGetLocalImage } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from './skeleton';

/**
 * Valid TMDB CDN image size tokens.
 * Posters:   w92 | w154 | w185 | w342 | w500 | w780 | original
 * Backdrops: w300 | w780 | w1280 | original
 * Logos:     w45 | w92 | w154 | w185 | w300 | w500 | original
 * Stills:    w92 | w185 | w300 | original
 */
type TmdbImageSize =
  | 'w45'
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w300'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'w1280'
  | 'original';

interface ImageProps {
  url?: string;
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  aspectRatio?: string;
  width?: string;
  height?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Controls the TMDB CDN size used for remote TMDB URLs. Defaults to 'w500'. */
  tmdbSize?: TmdbImageSize;
  style?: React.CSSProperties;
  className?: string;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

/**
 * Replaces the size segment of a TMDB image URL with the requested size.
 * Defaults to w500, which is appropriate for card thumbnails. Serving "original"
 * (up to ~2000px) in a small card forces the browser to downscale by 10x+,
 * causing visible aliasing on fine details.
 */
function optimizeTmdbUrl(url: string, size: TmdbImageSize = 'w500'): string {
  if (!url.startsWith(TMDB_IMAGE_BASE)) return url;
  const afterBase = url.slice(TMDB_IMAGE_BASE.length);
  const slashIdx = afterBase.indexOf('/');
  if (slashIdx === -1) return url;
  return `${TMDB_IMAGE_BASE}${size}${afterBase.slice(slashIdx)}`;
}

const Image: React.FC<ImageProps> = ({
  url,
  src,
  fallbackSrc,
  alt,
  aspectRatio = '2/3',
  width,
  height,
  style,
  objectFit = 'cover',
  tmdbSize = 'original',
  className = '',
}) => {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const isRemoteUrl = !!url?.startsWith('http');
  const localImagePath = url && !isRemoteUrl ? url : undefined;
  const directImageSrc = url
    ? isRemoteUrl
      ? optimizeTmdbUrl(url, tmdbSize)
      : undefined
    : (src ?? fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: localImageBlob, error: localImageError } = useGetLocalImage({
    enabled: isInView && !!localImagePath && !!serverUrl,
    params: localImagePath ? { path: localImagePath } : undefined,
    queryKey: ['images', 'local', serverUrl, localImagePath],
  });

  const [imageSrc, setImageSrc] = useState(directImageSrc);

  // Reset image state when the source changes.
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setImageSrc(localImagePath ? undefined : directImageSrc);
  }, [directImageSrc, localImagePath]);

  useEffect(() => {
    if (!localImageBlob) {
      return;
    }

    const objectUrl = URL.createObjectURL(localImageBlob);
    setImageSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [localImageBlob]);

  useEffect(() => {
    if (!localImageError) {
      return;
    }

    if (fallbackSrc) {
      setImageSrc(fallbackSrc);
      return;
    }

    setHasError(true);
    setIsLoading(false);
  }, [fallbackSrc, localImageError]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    if (hasError) {
      setIsLoading(false);
    } else {
      setHasError(true);
      if (imgRef.current) {
        imgRef.current.src = fallbackSrc ?? '';
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className} transition-all duration-500 ease-in-out`}
      style={{
        width,
        height,
        aspectRatio,
      }}
    >
      <Skeleton className="absolute inset-0 h-full w-full" />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className} transition-all duration-500 ease-in-out`}
      style={{
        width,
        height,
        aspectRatio,
      }}
    >
      {isLoading && <Skeleton className="absolute inset-0 h-full w-full" />}

      {isInView && imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`h-full w-full object-${objectFit} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} `}
          style={style}
        />
      )}

      {/* Fallback when every image fails */}
      {!isLoading && hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-200">
          {/** biome-ignore lint/a11y/noSvgWithoutTitle: <This is just a fallback> */}
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Image;
