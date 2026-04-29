import {
  type ArrowPressHandler,
  setFocus,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation';
import { memo, useCallback, useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useSettingsStore } from '@/shared/stores';
import CollageImage from './collage-image';
import FlexBox from './flex-box';
import Image from './image';
import WatchProgressBar from './watch-progress-bar';

const IMAGE_HEIGHT_PERCENTAGE = 0.9;

function parseAspectRatio(aspectRatio: string) {
  if (aspectRatio.includes('/')) {
    const [width, height] = aspectRatio.split('/').map(Number);

    if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
      return width / height;
    }
  }

  const numericAspectRatio = Number.parseFloat(aspectRatio);

  if (Number.isFinite(numericAspectRatio) && numericAspectRatio > 0) {
    return numericAspectRatio;
  }

  return 1;
}

interface CardProps {
  imgSrc: string;
  /** Up to 4 server image paths for collection collage. When provided with more than 1 entry, renders a 2×2 grid. */
  collageImages?: string[];
  /** Public-asset fallback used to fill empty collage slots (e.g. '/img/fileNotFound.jpg'). */
  defaultImageSrc?: string;
  aspectRatio?: string;
  width?: string;
  height?: string;
  title?: string;
  subtitle?: string;
  action: () => void;
  onFocus?: () => void;
  onArrowPress?: ArrowPressHandler<unknown>;
  customKey?: string;
  noInfo?: boolean;
  duration?: number;
  timeWatched?: number;
}

function ContentCard({
  imgSrc,
  collageImages,
  defaultImageSrc = '/img/fileNotFound.jpg',
  aspectRatio = '2/3',
  width = 'auto',
  title,
  subtitle,
  action,
  onFocus,
  onArrowPress,
  customKey,
  noInfo = false,
  duration,
  timeWatched,
}: CardProps) {
  const isCollage = collageImages && collageImages.length > 1;
  const mediaAspectRatio = parseAspectRatio(aspectRatio);
  const cardAspectRatio = mediaAspectRatio * IMAGE_HEIGHT_PERCENTAGE;
  const hasWatchProgress = duration !== undefined && timeWatched !== undefined && duration > 0;

  // Keep latest callbacks in refs so the stable wrappers below never need to
  // change identity, even when the parent passes inline arrows every render.
  const actionRef = useRef(action);
  actionRef.current = action;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  const stableAction = useCallback(() => actionRef.current(), []);
  const stableOnFocus = useCallback(() => onFocusRef.current?.(), []);

  const { ref, focused } = useFocusable({
    onEnterPress: stableAction,
    focusKey: customKey,
    onArrowPress,
  });
  const { cardRoundness } = useSettingsStore(
    (state) => ({
      cardRoundness: state.settings.cardRoundness,
    }),
    shallow,
  );

  useEffect(() => {
    if (focused) stableOnFocus();
  }, [focused, stableOnFocus]);

  return (
    <FlexBox
      ref={ref}
      data-focus-key={customKey}
      onClick={() => {
        if (customKey) setFocus(customKey);
        if (focused) stableAction();
      }}
      direction="column"
      width={width}
      className={`shrink-0 overflow-hidden`}
      css={{
        flex: width ? `0 0 ${width}` : undefined,
        maxWidth: width,
        aspectRatio: `${cardAspectRatio}`,
      }}
    >
      <div
        className={`${noInfo ? 'h-full' : 'h-[90%]'} relative w-full overflow-hidden rounded-md`}
      >
        <div
          className={`h-full w-full scale-95 ${cardRoundness} border-2 border-transparent transition-all duration-350 ${focused ? 'transform scale-100 border-white' : ''}`}
        >
          {isCollage ? (
            <CollageImage
              images={collageImages}
              defaultSrc={defaultImageSrc}
              className={cardRoundness}
            />
          ) : (
            <Image
              url={imgSrc}
              height="100%"
              width="100%"
              className={`h-full w-full ${cardRoundness}`}
              aspectRatio="auto"
            />
          )}
          {hasWatchProgress && <WatchProgressBar duration={duration} timeWatched={timeWatched} />}
        </div>
      </div>
      {!noInfo && (
        <div className="flex scale-95 min-h-0 w-full flex-col justify-center overflow-hidden pt-1">
          {title && <span className="truncate text-[1.5vh] leading-tight">{title}</span>}
          {subtitle && (
            <span
              className="truncate text-[1.25vh] leading-tight"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </FlexBox>
  );
}

export default memo(
  ContentCard,
  (prev, next) =>
    prev.imgSrc === next.imgSrc &&
    prev.title === next.title &&
    prev.subtitle === next.subtitle &&
    prev.collageImages === next.collageImages &&
    prev.aspectRatio === next.aspectRatio &&
    prev.width === next.width,
);
