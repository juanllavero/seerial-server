import {
  type ArrowPressHandler,
  setFocus,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useSettingsStore } from '@/shared/stores';
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

export interface ReorderingArrows {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
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
  remainingItems?: number;
  showRemainingItems?: boolean;
  /** When provided, holding Enter triggers this callback instead of immediate action on press. */
  onLongPress?: () => void;
  /** Activates reorder mode visual treatment (scale + colored border + chevrons). */
  isReordering?: boolean;
  /** Which movement directions are available in reorder mode. */
  reorderingArrows?: ReorderingArrows;
  /** Called when an arrow is pressed while in reorder mode. */
  onReorderMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI card handles multiple interaction modes in one place by design.
function ContentCard({
  imgSrc,
  collageImages,
  defaultImageSrc: _defaultImageSrc = '/img/fileNotFound.jpg',
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
  remainingItems,
  showRemainingItems = true,
  onLongPress,
  isReordering = false,
  reorderingArrows,
  onReorderMove,
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
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;
  const onReorderMoveRef = useRef(onReorderMove);
  onReorderMoveRef.current = onReorderMove;
  const onArrowPressRef = useRef(onArrowPress);
  onArrowPressRef.current = onArrowPress;

  const stableAction = useCallback(() => actionRef.current(), []);
  const stableOnFocus = useCallback(() => onFocusRef.current?.(), []);

  // Persists across effect re-runs: set to true when long press fires, reset on next keydown.
  const longPressTriggeredRef = useRef(false);

  // Intercept arrow presses in reorder mode to move the card instead of focus.
  const effectiveArrowPress = useCallback<ArrowPressHandler<unknown>>(
    (direction, props, details) => {
      if (isReordering && onReorderMoveRef.current) {
        const dir = direction.toLowerCase() as 'up' | 'down' | 'left' | 'right';
        onReorderMoveRef.current(dir);
        return false;
      }
      return onArrowPressRef.current ? onArrowPressRef.current(direction, props, details) : true;
    },
    [isReordering],
  );

  const { ref, focused } = useFocusable({
    // When long press is enabled we handle Enter manually via keyboard listeners below.
    onEnterPress: onLongPress ? undefined : stableAction,
    focusKey: customKey,
    onArrowPress: effectiveArrowPress,
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

  // Long-press detection: when this card is focused and onLongPress is provided,
  // delay regular action until key release. If held for the delay, fire long press instead.
  useEffect(() => {
    if (!focused || !onLongPress) return;

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      // Reset for each new physical key press.
      longPressTriggeredRef.current = false;
      timerId = setTimeout(() => {
        longPressTriggeredRef.current = true;
        onLongPressRef.current?.();
      }, 500);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (!longPressTriggeredRef.current) {
        actionRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [focused, onLongPress]);

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
          className={`relative h-full w-full scale-95 ${cardRoundness} border-2 transition-transform duration-350 ${
            isReordering
              ? 'transform scale-[1.04] border-yellow-400'
              : focused
                ? 'transform scale-100 border-white'
                : 'border-transparent'
          }`}
        >
          {/* Image */}
          {isCollage ? (
            // <CollageImage
            //   images={collageImages}
            //   defaultSrc={defaultImageSrc}
            //   className={cardRoundness}
            // />
            <Image
              url={collageImages[0]} // TODO: implement actual collage layout instead of just using the first image
              height="100%"
              width="100%"
              tmdbSize="w500"
              className={`h-full w-full ${cardRoundness}`}
              aspectRatio="auto"
            />
          ) : (
            <Image
              url={imgSrc}
              height="100%"
              width="100%"
              tmdbSize="w500"
              className={`h-full w-full ${cardRoundness}`}
              aspectRatio="auto"
            />
          )}

          {/* Progress Bar */}
          {hasWatchProgress && <WatchProgressBar duration={duration} timeWatched={timeWatched} />}

          {/* Remaining Items */}
          {showRemainingItems && remainingItems !== undefined && remainingItems > 0 && (
            <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1">
              <span className="text-xs font-medium">{remainingItems}</span>
            </div>
          )}

          {/* Reorder direction arrows */}
          {isReordering && (
            <>
              {reorderingArrows?.up && (
                <div className="absolute inset-x-0 top-2 z-20 flex justify-center">
                  <div className="rounded-full bg-black/70 p-0.5">
                    <ChevronUp className="size-[2dvh] text-white" />
                  </div>
                </div>
              )}
              {reorderingArrows?.down && (
                <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center">
                  <div className="rounded-full bg-black/70 p-0.5">
                    <ChevronDown className="size-[2dvh] text-white" />
                  </div>
                </div>
              )}
              {reorderingArrows?.left && (
                <div className="absolute inset-y-0 left-2 z-20 flex items-center">
                  <div className="rounded-full bg-black/70 p-0.5">
                    <ChevronLeft className="size-[2dvh] text-white" />
                  </div>
                </div>
              )}
              {reorderingArrows?.right && (
                <div className="absolute inset-y-0 right-2 z-20 flex items-center">
                  <div className="rounded-full bg-black/70 p-0.5">
                    <ChevronRight className="size-[2dvh] text-white" />
                  </div>
                </div>
              )}
            </>
          )}
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
    prev.collageImages?.join(',') === next.collageImages?.join(',') &&
    prev.aspectRatio === next.aspectRatio &&
    prev.width === next.width &&
    prev.duration === next.duration &&
    prev.timeWatched === next.timeWatched &&
    prev.isReordering === next.isReordering &&
    prev.reorderingArrows?.up === next.reorderingArrows?.up &&
    prev.reorderingArrows?.down === next.reorderingArrows?.down &&
    prev.reorderingArrows?.left === next.reorderingArrows?.left &&
    prev.reorderingArrows?.right === next.reorderingArrows?.right,
);
