import { useGetLocalImage } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useEffect, useReducer, useRef } from 'react';
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

interface ImageState {
  imageSrc: string | undefined;
  isLoading: boolean;
  hasError: boolean;
  isInView: boolean;
}

type ImageAction =
  | { type: 'reset-source'; directImageSrc: string | undefined; localImagePath: string | undefined }
  | { type: 'set-local-image'; imageSrc: string }
  | { type: 'apply-fallback'; fallbackSrc?: string }
  | { type: 'mark-loaded' }
  | { type: 'mark-error' }
  | { type: 'enter-view' };

const INITIAL_IMAGE_STATE: ImageState = {
  imageSrc: undefined,
  isLoading: true,
  hasError: false,
  isInView: false,
};

function imageReducer(state: ImageState, action: ImageAction): ImageState {
  switch (action.type) {
    case 'reset-source':
      return {
        ...state,
        imageSrc: action.localImagePath ? undefined : action.directImageSrc,
        isLoading: true,
        hasError: false,
      };
    case 'set-local-image':
      return {
        ...state,
        imageSrc: action.imageSrc,
      };
    case 'apply-fallback':
      if (action.fallbackSrc) {
        return {
          ...state,
          imageSrc: action.fallbackSrc,
        };
      }

      return {
        ...state,
        hasError: true,
        isLoading: false,
      };
    case 'mark-loaded':
      return {
        ...state,
        isLoading: false,
      };
    case 'mark-error':
      return {
        ...state,
        hasError: true,
        isLoading: false,
      };
    case 'enter-view':
      return {
        ...state,
        isInView: true,
      };
    default:
      return state;
  }
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

const LazyImage: React.FC<ImageProps> = ({
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
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [imageState, dispatchImageState] = useReducer(imageReducer, {
    ...INITIAL_IMAGE_STATE,
    imageSrc: directImageSrc,
  });
  const { imageSrc, isLoading, hasError, isInView } = imageState;

  const { data: localImageBlob, error: localImageError } = useGetLocalImage({
    enabled: isInView && !!localImagePath && !!serverUrl,
    params: localImagePath ? { path: localImagePath } : undefined,
    queryKey: ['images', 'local', serverUrl, localImagePath],
  });

  // Reset image state when the source changes.
  useEffect(() => {
    dispatchImageState({ type: 'reset-source', directImageSrc, localImagePath });
  }, [directImageSrc, localImagePath]);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!localImageBlob) {
      return;
    }

    const objectUrl = URL.createObjectURL(localImageBlob);
    objectUrlRef.current = objectUrl;
    dispatchImageState({ type: 'set-local-image', imageSrc: objectUrl });

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [localImageBlob]);

  useEffect(() => {
    if (!localImageError) {
      return;
    }

    dispatchImageState({ type: 'apply-fallback', fallbackSrc });
  }, [fallbackSrc, localImageError]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            dispatchImageState({ type: 'enter-view' });
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
    dispatchImageState({ type: 'mark-loaded' });
  };

  const handleImageError = () => {
    if (hasError) {
      dispatchImageState({ type: 'mark-loaded' });
    } else {
      dispatchImageState({ type: 'mark-error' });
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
          <svg className="size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default LazyImage;
