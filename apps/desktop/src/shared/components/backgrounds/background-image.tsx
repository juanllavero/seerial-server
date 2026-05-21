import { useGetLocalImage } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { memo, useEffect, useReducer, useRef } from 'react';

interface BackgroundImageProps {
  imageSrc: string | undefined;
  index?: number;
}

interface BackgroundImageState {
  currentSrc: string | null;
  nextSrc: string | null;
  showNext: boolean;
}

type BackgroundImageAction =
  | { type: 'source-changed'; resolvedSrc: string | undefined }
  | { type: 'reveal-next' }
  | { type: 'commit-next' }
  | { type: 'reset' };

const INITIAL_BACKGROUND_IMAGE_STATE: BackgroundImageState = {
  currentSrc: null,
  nextSrc: null,
  showNext: false,
};

function backgroundImageReducer(
  state: BackgroundImageState,
  action: BackgroundImageAction,
): BackgroundImageState {
  switch (action.type) {
    case 'source-changed':
      if (!action.resolvedSrc) {
        return INITIAL_BACKGROUND_IMAGE_STATE;
      }

      if (!state.currentSrc) {
        return {
          ...state,
          nextSrc: action.resolvedSrc,
        };
      }

      if (action.resolvedSrc !== (state.nextSrc ?? state.currentSrc)) {
        return {
          ...state,
          showNext: false,
          nextSrc: action.resolvedSrc,
        };
      }

      return state;
    case 'reveal-next':
      return {
        ...state,
        showNext: true,
      };
    case 'commit-next':
      return {
        currentSrc: state.nextSrc,
        nextSrc: null,
        showNext: false,
      };
    case 'reset':
      return INITIAL_BACKGROUND_IMAGE_STATE;
    default:
      return state;
  }
}

function BackgroundImage({ imageSrc, index = 1 }: BackgroundImageProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const isRemoteUrl = !!imageSrc?.startsWith('http');
  const localImagePath = imageSrc && !isRemoteUrl ? imageSrc : undefined;
  const objectUrlRef = useRef<string | null>(null);

  const { data: localImageBlob } = useGetLocalImage({
    enabled: !!localImagePath && !!serverUrl,
    params: localImagePath ? { path: localImagePath } : undefined,
    queryKey: ['images', 'local', serverUrl, localImagePath],
  });

  const [backgroundState, dispatchBackgroundState] = useReducer(
    backgroundImageReducer,
    INITIAL_BACKGROUND_IMAGE_STATE,
  );
  const { currentSrc, nextSrc, showNext } = backgroundState;
  const nextImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    let nextResolvedSrc: string | undefined;

    if (isRemoteUrl || !imageSrc) {
      nextResolvedSrc = isRemoteUrl ? imageSrc : undefined;
    } else if (localImageBlob) {
      const objectUrl = URL.createObjectURL(localImageBlob);
      objectUrlRef.current = objectUrl;
      nextResolvedSrc = objectUrl;
    }

    dispatchBackgroundState({ type: 'source-changed', resolvedSrc: nextResolvedSrc });

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [imageSrc, isRemoteUrl, localImageBlob]);

  const handleNextLoaded = () => {
    dispatchBackgroundState({ type: 'reveal-next' });
  };

  const handleFadeInComplete = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'opacity' || !showNext) return;
    dispatchBackgroundState({ type: 'commit-next' });
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
          }}
        />
      )}
    </div>
  );
}

export default memo(BackgroundImage);
