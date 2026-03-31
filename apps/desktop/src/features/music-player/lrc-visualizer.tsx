import { useMusicStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import NavigationButton from '@/components/navigation/NavigationButton';
import FlexBox from '@/components/ui/FlexBox';
import { useLanguageName as getTrackLanguageName } from '@/localization/TrackLanguages';
import Loading from '@/shared/components/loading';

export interface SongLyricsFile {
  language: string;
  content: string;
}

interface LrcLine {
  time: number;
  text: string;
}

interface LRCVisualizerProps {
  lyrics: SongLyricsFile[];
  isLoading: boolean;
}

interface LyricsLineState {
  opacityClass: string;
  textClass: string;
  scaleClass: string;
  blurClass: string;
}

function parseLrcContent(content: string): LrcLine[] {
  const parsedLines: LrcLine[] = [];

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

function getLyricsLineState(
  index: number,
  currentLineIndex: number,
  isUserScrolling: boolean,
): LyricsLineState {
  const isCurrentLine = index === currentLineIndex;
  const isPastLine = index < currentLineIndex;

  let opacityClass = 'opacity-55';
  if (isCurrentLine) {
    opacityClass = 'opacity-100';
  } else if (!isUserScrolling && isPastLine) {
    opacityClass = 'opacity-25';
  }

  return {
    opacityClass,
    textClass: isCurrentLine ? 'text-white' : 'text-neutral-300',
    scaleClass: isCurrentLine ? 'scale-105' : 'scale-100',
    blurClass: isUserScrolling || isCurrentLine ? '' : 'blur-[1px]',
  };
}

function LRCVisualizer({ lyrics, isLoading }: LRCVisualizerProps) {
  const { t, i18n } = useTranslation();
  const { currentTime, duration, setCurrentTime, setProgress } = useMusicStore(
    (state) => ({
      currentTime: state.currentTime,
      duration: state.duration,
      setCurrentTime: state.setCurrentTime,
      setProgress: state.setProgress,
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

    return 0;
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

  const handleLineClick = useCallback(
    async (time: number) => {
      try {
        await invoke('set_position', { position: time });
        setCurrentTime(time);

        if (duration > 0) {
          setProgress((time / duration) * 100);
        }
      } catch (error) {
        console.error('Failed to seek from lyrics:', error);
      }
    },
    [duration, setCurrentTime, setProgress],
  );

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
      className="min-w-0 rounded-[3vh] bg-black/20 p-[2.4vh] backdrop-blur-md"
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
            const { opacityClass, textClass, scaleClass, blurClass } = getLyricsLineState(
              index,
              currentLineIndex,
              isUserScrolling,
            );

            return (
              <div
                key={`${line.time}-${line.text}`}
                data-line-index={index}
                className="text-center"
              >
                <button
                  type="button"
                  onClick={() => void handleLineClick(line.time)}
                  className={`cursor-pointer bg-transparent px-[1vh] text-[2.5vh] font-semibold transition-all duration-300 ease-out ${opacityClass} ${textClass} ${scaleClass} ${blurClass}`}
                >
                  {line.text}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </FlexBox>
  );
}

export default memo(LRCVisualizer);
