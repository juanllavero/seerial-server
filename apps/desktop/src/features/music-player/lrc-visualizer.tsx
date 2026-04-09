import { useMusicStore } from '@seerial/stores';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import NavigationButton from '@/components/navigation/NavigationButton';
import FlexBox from '@/components/ui/FlexBox';
import { useLanguageName as getTrackLanguageName } from '@/localization/TrackLanguages';
import Loading from '@/shared/components/loading';
import type { LRCFile, LRCLine } from '@seerial/domain';

interface LRCVisualizerProps {
  lyrics: LRCFile[];
  isLoading: boolean;
}

interface LyricsLineState {
  containerClass: string;
  opacityClass: string;
  textClass: string;
  scaleClass: string;
  sizeClass: string;
  weightClass: string;
  blurClass: string;
}

function parseLrcContent(content: string): LRCLine[] {
  const parsedLines: LRCLine[] = [];

  for (const rawLine of content.split(/\r\n?|\n/)) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine || /^\[[a-zA-Z]+:.*\]$/.test(trimmedLine)) {
      continue;
    }

    const matches = [...trimmedLine.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    if (matches.length === 0) {
      continue;
    }

    const text = trimmedLine.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, '').trim() || '♪';

    for (const match of matches) {
      const minutes = Number.parseInt(match[1], 10);
      const seconds = Number.parseInt(match[2], 10);
      const milliseconds = Number.parseInt((match[3] ?? '0').padEnd(3, '0'), 10);

      parsedLines.push({
        time: minutes * 60 + seconds + milliseconds / 1000,
        text,
      });
    }
  }

  return parsedLines.sort((left, right) => left.time - right.time);
}

function formatLanguageLabel(language: string, userLanguage: string, originalLabel: string) {
  if (language === 'original') {
    return originalLabel;
  }

  try {
    const displayNames = new Intl.DisplayNames([userLanguage], { type: 'language' });
    const translated = displayNames.of(language.toLowerCase());
    if (translated) {
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
  } catch {
    // Fallback below when Intl.DisplayNames is unavailable or the code is unsupported.
  }

  if (language.length === 3) {
    const translated = getTrackLanguageName(language, userLanguage);
    if (translated && translated !== 'Unknown language') {
      return translated;
    }
  }

  return language.toUpperCase();
}

function getLineOpacityClass(
  isCurrentLine: boolean,
  isNearCurrentLine: boolean,
  isPastLine: boolean,
  isUserScrolling: boolean,
) {
  if (isCurrentLine) {
    return 'opacity-100';
  }

  if (isNearCurrentLine) {
    return 'opacity-50';
  }

  if (!isUserScrolling && isPastLine) {
    return 'opacity-20';
  }

  return 'opacity-20';
}

function getLineTextClass(isCurrentLine: boolean, isNearCurrentLine: boolean) {
  if (isCurrentLine) {
    return 'text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.3)]';
  }

  if (isNearCurrentLine) {
    return 'text-neutral-100';
  }

  return 'text-neutral-400';
}

function getLineSizeClass(isCurrentLine: boolean, isNearCurrentLine: boolean) {
  if (isCurrentLine) {
    return 'text-[4.5vh]';
  }

  if (isNearCurrentLine) {
    return 'text-[3vh]';
  }

  return 'text-[2.5vh]';
}

function getLineWeightClass(isCurrentLine: boolean, isNearCurrentLine: boolean) {
  if (isCurrentLine) {
    return 'font-bold';
  }

  if (isNearCurrentLine) {
    return 'font-semibold';
  }

  return 'font-medium';
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
  const isNearCurrentLine = distanceFromCurrent === 1;

  return {
    containerClass: isCurrentLine ? 'scale-[1.02]' : 'scale-100',
    opacityClass: getLineOpacityClass(
      isCurrentLine,
      isNearCurrentLine,
      isPastLine,
      isUserScrolling,
    ),
    textClass: getLineTextClass(isCurrentLine, isNearCurrentLine),
    scaleClass: isCurrentLine ? 'scale-105' : 'scale-100',
    sizeClass: getLineSizeClass(isCurrentLine, isNearCurrentLine),
    weightClass: getLineWeightClass(isCurrentLine, isNearCurrentLine),
    blurClass: isUserScrolling || isCurrentLine || isNearCurrentLine ? '' : 'blur-[0.6px]',
  };
}

function LRCVisualizer({ lyrics, isLoading }: LRCVisualizerProps) {
  const { t, i18n } = useTranslation();
  const { currentTime } = useMusicStore(
    (state) => ({
      currentTime: state.currentTime,
    }),
    shallow,
  );

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedLanguage(lyrics[0]?.language ?? null);
  }, [lyrics]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const selectedLyrics = useMemo(
    () => lyrics.find((lyric) => lyric.language === selectedLanguage) ?? lyrics[0] ?? null,
    [lyrics, selectedLanguage],
  );

  const lines = useMemo(
    () => (selectedLyrics ? parseLrcContent(selectedLyrics.content) : []),
    [selectedLyrics],
  );

  const currentLineIndex = useMemo(() => {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (currentTime >= lines[index].time) {
        return index;
      }
    }

    return -1;
  }, [currentTime, lines]);

  useEffect(() => {
    if (isUserScrolling || !containerRef.current || lines.length === 0) {
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
  }, [currentLineIndex, isUserScrolling, lines.length]);

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

  if (lines.length === 0) {
    return (
      <FlexBox width="100%" height="100%" justify="center" align="center" className="px-[2vh]">
        <span className="text-center text-[2.2vh] font-semibold text-neutral-200">
          {t('lyricsNotFound')}
        </span>
      </FlexBox>
    );
  }

  return (
    <FlexBox
      direction="column"
      gap={1.5}
      width="100%"
      height="100%"
      className="relativez-0 min-h-0 min-w-0 overflow-hidden"
    >
      {lyrics.length > 1 && (
        <FlexBox wrap="wrap" gap={0.75} width="100%" className="shrink-0">
          {lyrics.map((lyric) => (
            <NavigationButton
              key={lyric.language}
              customKey={`player-lyrics-language-${lyric.language}`}
              text={formatLanguageLabel(lyric.language, i18n.language, t('originalLanguage'))}
              variant="secondary"
              selected={selectedLyrics?.language === lyric.language}
              onClick={() => setSelectedLanguage(lyric.language)}
              className="min-h-[4.8vh] px-[2vh] py-[1.2vh]"
            />
          ))}
        </FlexBox>
      )}

      <div
        ref={containerRef}
        className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
        onScroll={handleScroll}
      >
        <div className="space-y-[2.2vh] px-[1.2vh] py-[10vh]">
          {lines.map((line, index) => {
            const {
              containerClass,
              opacityClass,
              textClass,
              scaleClass,
              sizeClass,
              weightClass,
              blurClass,
            } = getLyricsLineState(index, currentLineIndex, isUserScrolling);

            return (
              <div
                key={`${line.time}-${line.text}`}
                data-line-index={index}
                className={`text-center transition-transform duration-300 ease-out ${containerClass}`}
              >
                <span
                  className={`cursor-pointer bg-transparent px-[1vh] transition-all duration-300 ease-out ${opacityClass} ${textClass} ${scaleClass} ${sizeClass} ${weightClass} ${blurClass}`}
                >
                  {line.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </FlexBox>
  );
}

export default memo(LRCVisualizer);
