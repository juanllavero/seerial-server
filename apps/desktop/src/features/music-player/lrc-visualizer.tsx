import type { LRCFile } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
}

function getLyricsLineState(
  index: number,
  currentLineIndex: number,
  isUserScrolling: boolean,
): LyricsLineState {
  const distanceFromCurrent =
    currentLineIndex < 0 ? Number.POSITIVE_INFINITY : Math.abs(index - currentLineIndex);
  const isCurrentLine = index === currentLineIndex;
  const isPastLine = index < currentLineIndex;
  const isPreviousLine = currentLineIndex > 0 && index === currentLineIndex - 1;
  const isNearCurrentLine = distanceFromCurrent === 1;

  if (!isUserScrolling && isPastLine && !isPreviousLine) {
    return {
      containerClass:
        'max-h-0 translate-y-[-1vh] overflow-hidden opacity-0 blur-sm mb-0 scale-[0.98] py-0',
      textClass: 'text-neutral-500',
      groupClass: 'gap-[0.6vh]',
    };
  }

  if (isCurrentLine) {
    return {
      containerClass: 'max-h-[24vh] opacity-100 blur-0 mb-[4.8vh] scale-100',
      textClass: 'text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.28)]',
      groupClass: 'gap-[1.05vh]',
    };
  }

  if (isNearCurrentLine) {
    return {
      containerClass: `max-h-[24vh] mb-[4.8vh] scale-100 ${isPastLine ? 'opacity-18 blur-[1px]' : 'opacity-45 blur-0'}`,
      textClass: isPastLine ? 'text-neutral-300' : 'text-neutral-100',
      groupClass: 'gap-[1vh]',
    };
  }

  return {
    containerClass: `max-h-[24vh] mb-[4.8vh] scale-[0.985] ${
      isUserScrolling ? 'opacity-28 blur-[1px]' : 'opacity-15 blur-[2px]'
    }`,
    textClass: 'text-neutral-400',
    groupClass: 'gap-[0.95vh]',
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

  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    if (isUserScrolling || !containerRef.current || lyricGroups.length === 0) {
      return;
    }

    const currentLineElement = containerRef.current.querySelector<HTMLElement>(
      `[data-line-index="${currentLineIndex}"]`,
    );

    if (!currentLineElement) {
      return;
    }

    const containerHeight = containerRef.current.clientHeight;
    const targetScrollTop =
      currentLineElement.offsetTop - containerHeight / 2 + currentLineElement.offsetHeight / 2;

    containerRef.current.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }, [currentLineIndex, isUserScrolling, lyricGroups.length]);

  const handleScroll = useCallback(() => {
    setIsUserScrolling(true);

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolling(false);
      scrollTimeoutRef.current = null;
    }, 1800);
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
      <div
        ref={containerRef}
        className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        onScroll={handleScroll}
      >
        <div className="px-[2.2vh] py-[10vh]">
          {lyricGroups.map((group, index) => {
            const { containerClass, textClass, groupClass } = getLyricsLineState(
              index,
              currentLineIndex,
              isUserScrolling,
            );

            return (
              <div
                key={`${group.time}-${group.lines.join('-')}`}
                data-line-index={index}
                className={`text-left transition-[max-height,opacity,transform,filter,margin] duration-500 ease-out ${containerClass}`}
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
