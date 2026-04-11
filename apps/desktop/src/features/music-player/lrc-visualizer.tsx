import type { LRCFile } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import type { CSSProperties, WheelEvent } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import FlexBox from '@/components/ui/FlexBox';
import { buildLyricGroups } from '@/features/music-player/lyrics-utils';
import Loading from '@/shared/components/loading';

interface LRCVisualizerProps {
  lyrics: LRCFile[];
  isLoading: boolean;
  showPronunciation: boolean;
  selectedTranslationLanguage: string | null;
}

interface LyricsLineState {
  containerClass: string;
  textClass: string;
  groupClass: string;
  style: CSSProperties;
}

const UPCOMING_LINE_OFFSET_VH = 24;
const PREVIOUS_LINE_EXIT_OFFSET_VH = 16;
const PAST_LINE_EXIT_OFFSET_VH = 24;

function getLyricsLineState(index: number, currentLineIndex: number): LyricsLineState {
  const anchorIndex = currentLineIndex >= 0 ? currentLineIndex : -1;
  const relativeIndex = index - anchorIndex;
  const isCurrentLine = currentLineIndex >= 0 && index === currentLineIndex;
  const isPreviousLine = currentLineIndex > 0 && index === currentLineIndex - 1;
  const isPastLine = currentLineIndex >= 0 && index < currentLineIndex;

  let offsetY = relativeIndex * UPCOMING_LINE_OFFSET_VH;
  let opacity = 0;
  let scale = 0.96;
  let blurPx = 0;
  let zIndex = Math.max(1, 20 - Math.abs(relativeIndex));
  let textClass = 'text-neutral-400';
  let groupClass = 'gap-[0.95vh]';

  if (isCurrentLine) {
    offsetY = 0;
    opacity = 1;
    scale = 1;
    blurPx = 0;
    zIndex = 40;
    textClass = 'text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.28)]';
    groupClass = 'gap-[1.05vh]';
  } else if (isPreviousLine) {
    offsetY = -PREVIOUS_LINE_EXIT_OFFSET_VH;
    opacity = 0;
    scale = 0.985;
    blurPx = 2;
    zIndex = 30;
    textClass = 'text-neutral-300';
    groupClass = 'gap-[1vh]';
  } else if (isPastLine) {
    offsetY = -PAST_LINE_EXIT_OFFSET_VH;
    opacity = 0;
    scale = 0.97;
    blurPx = 4;
    zIndex = 10;
  } else if (relativeIndex === 1) {
    opacity = currentLineIndex < 0 ? 0.42 : 0.5;
    scale = 0.995;
    blurPx = 0;
    zIndex = 25;
    textClass = 'text-neutral-100';
    groupClass = 'gap-[1vh]';
  } else if (relativeIndex === 2) {
    opacity = 0.2;
    scale = 0.985;
    blurPx = 1;
    zIndex = 20;
  } else if (relativeIndex > 2) {
    opacity = 0.06;
    scale = 0.97;
    blurPx = 2;
    zIndex = 5;
  }

  return {
    containerClass:
      'absolute inset-x-0 transition-[transform,opacity,filter] duration-500 ease-out will-change-transform',
    textClass,
    groupClass,
    style: {
      top: '50%',
      opacity,
      zIndex,
      filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
      transform: `translate3d(0, calc(${offsetY}vh - 50%), 0) scale(${scale})`,
    },
  };
}

function getLineSizeClass(lineIndex: number) {
  if (lineIndex === 0) {
    return 'text-[6.5vh] font-bold';
  }

  if (lineIndex === 1) {
    return 'text-[4vh] font-semibold';
  }

  return 'text-[3vh] font-medium pt-4';
}

function LRCVisualizer({
  lyrics,
  isLoading,
  showPronunciation,
  selectedTranslationLanguage,
}: LRCVisualizerProps) {
  const { t } = useTranslation();
  const { currentTime } = useMusicStore(
    (state) => ({
      currentTime: state.currentTime,
    }),
    shallow,
  );

  const lyricGroups = useMemo(
    () =>
      buildLyricGroups(lyrics, {
        showPronunciation,
        selectedTranslationLanguage,
      }),
    [lyrics, selectedTranslationLanguage, showPronunciation],
  );

  const currentLineIndex = useMemo(() => {
    for (let index = lyricGroups.length - 1; index >= 0; index -= 1) {
      if (currentTime >= lyricGroups[index].time) {
        return index;
      }
    }

    return -1;
  }, [currentTime, lyricGroups]);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  if (isLoading) {
    return (
      <FlexBox width="100%" height="100%" justify="center" align="center">
        <Loading />
      </FlexBox>
    );
  }

  if (lyricGroups.length === 0) {
    return (
      <FlexBox width="100%" height="100%" justify="center" align="center" className="px-[2vh]">
        <span className="text-[2.2vh] font-semibold text-neutral-200">{t('lyricsNotFound')}</span>
      </FlexBox>
    );
  }

  return (
    <FlexBox
      direction="column"
      width="100%"
      height="100%"
      className="relative z-0 min-h-0 min-w-0 overflow-hidden"
    >
      <div className="relative min-h-0 w-full flex-1 overflow-hidden" onWheel={handleWheel}>
        <div className="absolute inset-0 overflow-hidden px-[2.2vh]">
          {lyricGroups.map((group, index) => {
            const { containerClass, textClass, groupClass, style } = getLyricsLineState(
              index,
              currentLineIndex,
            );

            return (
              <div
                key={`${group.time}-${group.lines.join('-')}`}
                data-line-index={index}
                className={`pl-[2dvw] text-left transition-[max-height,opacity,transform,filter,margin] duration-500 ease-out ${containerClass}`}
                style={style}
              >
                <div className={`flex flex-col items-start ${groupClass}`}>
                  {group.lines.map((line, lineIndex) => (
                    <span
                      key={`${group.time}-${line}-${getLineSizeClass(lineIndex)}`}
                      className={`bg-transparent px-[1vh] leading-none transition-all duration-300 ease-out ${textClass} ${getLineSizeClass(lineIndex)}`}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FlexBox>
  );
}

export default memo(LRCVisualizer);
