import type { LRCFile } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import type { CSSProperties, WheelEvent } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import FlexBox from '@/components/ui/FlexBox';
import {
  buildLyricGroups,
  type LyricDisplayLine,
  type LyricGroup,
  type LyricSegment,
} from '@/features/music-player/lyrics-utils';
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
  isCurrentLine: boolean;
  style: CSSProperties;
}

const UPCOMING_LINE_OFFSET_VH = 18;
const PREVIOUS_LINE_EXIT_OFFSET_VH = 16;
const PAST_LINE_EXIT_OFFSET_VH = 24;

function getGroupHeightWeight(group: LyricGroup) {
  // Contamos cuántas líneas de texto tiene este bloque (mínimo 1, máximo 3)
  const lineCount = group.lines.length;

  // Calculamos si la frase es muy larga y probablemente ha saltado de línea por el flex-wrap
  const mainLineLength = group.lines[0]?.text.length || 0;
  const isWrapping = mainLineLength > 28; // Si tiene más de 28 caracteres, asumimos que ocupa 2 líneas

  // Asignamos un peso base según la cantidad de información
  let weight = 1; // Solo original
  if (lineCount === 2) weight = 1.5; // Original + Traducción (o Romaji)
  if (lineCount >= 3) weight = 2.2; // Original + Romaji + Traducción

  // Si la línea es muy larga, le damos un extra de espacio para que no choque con la de abajo
  if (isWrapping) weight += 0.6;

  return weight;
}

function buildUpcomingLineOffsets(lyricGroups: LyricGroup[], currentLineIndex: number) {
  const offsets = lyricGroups.map(() => 0);
  const anchorIndex = currentLineIndex >= 0 ? currentLineIndex : -1;
  let accumulatedOffset = 0;

  for (let index = anchorIndex + 1; index < lyricGroups.length; index += 1) {
    if (index === 0) {
      accumulatedOffset += UPCOMING_LINE_OFFSET_VH;
      offsets[index] = accumulatedOffset;
      continue;
    }

    const previousWeight = getGroupHeightWeight(lyricGroups[index - 1]);
    const currentWeight = getGroupHeightWeight(lyricGroups[index]);
    const weightedGap = UPCOMING_LINE_OFFSET_VH * ((previousWeight + currentWeight) / 2);

    accumulatedOffset += weightedGap;
    offsets[index] = accumulatedOffset;
  }

  return offsets;
}

function getLyricsLineState(
  index: number,
  currentLineIndex: number,
  upcomingOffsetY: number,
): LyricsLineState {
  const anchorIndex = currentLineIndex >= 0 ? currentLineIndex : -1;
  const relativeIndex = index - anchorIndex;
  const isCurrentLine = currentLineIndex >= 0 && index === currentLineIndex;
  const isPreviousLine = currentLineIndex > 0 && index === currentLineIndex - 1;
  const isPastLine = currentLineIndex >= 0 && index < currentLineIndex;

  let offsetY = relativeIndex > 0 ? upcomingOffsetY : relativeIndex * UPCOMING_LINE_OFFSET_VH;
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
    textClass = 'text-white';
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
    blurPx = 4;
    zIndex = 25;
    textClass = 'text-neutral-100';
    groupClass = 'gap-[1vh]';
  } else if (relativeIndex === 2) {
    opacity = 0.2;
    scale = 0.985;
    blurPx = 4;
    zIndex = 20;
  } else if (relativeIndex > 2) {
    opacity = 0.06;
    scale = 0.97;
    blurPx = 4;
    zIndex = 5;
  }

  return {
    containerClass:
      'absolute inset-x-0 transition-[transform,opacity,filter] duration-500 ease-out will-change-transform',
    textClass,
    groupClass,
    isCurrentLine,
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

function renderEnhancedSegment(
  segment: LyricSegment,
  currentTime: number,
  lineSizeClass: string,
  isCurrentLine: boolean,
) {
  // Calculamos cuánto dura la sílaba en milisegundos exactos
  const durationMs = segment.endTime ? (segment.endTime - segment.startTime) * 1000 : 300; // Fallback por si es la última palabra y no tiene final

  // Determinamos en qué estado temporal se encuentra esta sílaba
  const isPast = segment.endTime && currentTime >= segment.endTime;
  const isUpcoming = currentTime < segment.startTime;
  const isActive = !isPast && !isUpcoming;

  // Lógica del truco de Apple Music:
  let width = '0%';
  let transition = 'none';

  if (isPast) {
    // Si ya pasó, la dejamos 100% llena al instante (útil si el usuario avanza el reproductor)
    width = '100%';
    transition = 'none';
  } else if (isActive) {
    // Si está sonando AHORA, le ordenamos que se llene al 100%
    // y le decimos al CSS que tarde exactamente lo que dura la sílaba.
    width = '100%';
    transition = `width ${durationMs}ms linear`;
  } else {
    // Si aún no ha llegado, se queda vacía
    width = '0%';
    transition = 'none';
  }

  return (
    <span
      key={`${segment.startTime}-${segment.text}`}
      // whitespace-pre es clave para mantener alineados los caracteres asiáticos
      className={`relative inline-block align-bottom ${lineSizeClass} whitespace-pre`}
    >
      {/* 1. Capa de Fondo (Atenuada) - SIN sombras */}
      <span className={isCurrentLine ? 'text-white/30!' : 'text-white/20'}>{segment.text}</span>

      {/* 2. Capa de Relleno (Blanco puro) - SIN sombras y con transición CSS */}
      <span
        className="absolute inset-y-0 left-0 overflow-hidden whitespace-pre text-white will-change-[width]"
        style={{
          width,
          transition,
        }}
      >
        {segment.text}
      </span>
    </span>
  );
}

function renderAlignedPronunciationPair(
  originalLine: LyricDisplayLine,
  pronunciationLine: LyricDisplayLine,
  currentTime: number,
  textClass: string,
  isCurrentLine: boolean,
) {
  // 1. Buscamos cuántos bloques sincronizados hay
  const maxIndex = Math.max(
    ...originalLine.segments.map((s) => s.alignmentTrackIndex ?? -1),
    ...pronunciationLine.segments.map((s) => s.alignmentTrackIndex ?? -1),
  );

  // 2. Emparejamos el original y su romaji correspondiente
  const pairedSegments = [];
  for (let i = 0; i <= maxIndex; i++) {
    pairedSegments.push({
      orig: originalLine.segments.find((s) => s.alignmentTrackIndex === i),
      pron: pronunciationLine.segments.find((s) => s.alignmentTrackIndex === i),
    });
  }

  const origSizeClass = getLineSizeClass(0);
  const pronSizeClass = getLineSizeClass(1);

  // 3. Flex-wrap se encarga de saltar de línea automáticamente si la pantalla es estrecha
  return (
    <div
      key={`paired-${originalLine.text}`}
      className="flex max-w-[56dvw] flex-wrap items-end gap-x-[1.2vh] gap-y-[1.5vh]"
    >
      {pairedSegments.map((pair, index) => {
        if (!pair.orig && !pair.pron) return null;

        return (
          // Columna vertical: Fuerza a que el original y el romaji NUNCA se separen
          <div key={index} className="flex flex-col items-center justify-end">
            {/* Arriba: Texto Original */}
            <div className="flex h-full items-end pb-[0.2vh]">
              {pair.orig ? (
                renderEnhancedSegment(pair.orig, currentTime, origSizeClass, isCurrentLine)
              ) : (
                <span className={origSizeClass}>&nbsp;</span>
              )}
            </div>

            {/* Abajo: Pronunciación (Romaji) */}
            <div className="flex items-start">
              {pair.pron ? (
                renderEnhancedSegment(pair.pron, currentTime, pronSizeClass, isCurrentLine)
              ) : (
                <span className={pronSizeClass}>&nbsp;</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Para líneas sin pronunciación o traducciones simples
function renderLyricLine(
  line: LyricDisplayLine,
  lineIndex: number,
  currentTime: number,
  textClass: string,
  isCurrentLine: boolean,
) {
  const lineSizeClass = getLineSizeClass(lineIndex);

  if (!line.isEnhanced || line.segments.length === 0) {
    return (
      <span
        key={`${line.text}-${lineIndex}`}
        className={`bg-transparent px-[1vh] leading-[1.2] whitespace-normal break-words transition-all duration-300 ease-out ${textClass} ${lineSizeClass}`}
      >
        {line.text}
      </span>
    );
  }

  return (
    <div
      key={`${line.text}-${lineIndex}`}
      className="flex max-w-[56dvw] flex-wrap items-end gap-x-[0.9vh] gap-y-[0.5vh]"
    >
      {line.segments.map((segment) =>
        renderEnhancedSegment(segment, currentTime, lineSizeClass, isCurrentLine),
      )}
    </div>
  );
}

function LRCVisualizer({
  lyrics,
  isLoading,
  showPronunciation,
  selectedTranslationLanguage,
}: LRCVisualizerProps) {
  const { t } = useTranslation();
  const { realAudioTime } = useMusicStore(
    (state) => ({
      realAudioTime: state.currentTime,
    }),
    shallow,
  );

  const WHISPER_OFFSET = 0.25;
  const currentTime = realAudioTime + WHISPER_OFFSET;

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

  const upcomingLineOffsets = useMemo(
    () => buildUpcomingLineOffsets(lyricGroups, currentLineIndex),
    [currentLineIndex, lyricGroups],
  );

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
            const { containerClass, textClass, groupClass, isCurrentLine, style } =
              getLyricsLineState(index, currentLineIndex, upcomingLineOffsets[index] ?? 0);

            return (
              <div
                key={`${group.time}-${group.lines.map((line) => line.text).join('-')}`}
                data-line-index={index}
                className={`pl-[2dvw] text-left transition-[max-height,opacity,transform,filter,margin] duration-500 ease-out ${containerClass}`}
                style={style}
              >
                <div className={`flex max-w-[56dvw] flex-col items-start ${groupClass}`}>
                  {group.lines[0]?.alignmentTrackWidths && group.lines[1]?.alignmentTrackWidths
                    ? [
                        renderAlignedPronunciationPair(
                          group.lines[0],
                          group.lines[1],
                          currentTime,
                          textClass,
                          isCurrentLine,
                        ),
                        ...group.lines
                          .slice(2)
                          .map((line, lineIndex) =>
                            renderLyricLine(
                              line,
                              lineIndex + 2,
                              currentTime,
                              textClass,
                              isCurrentLine,
                            ),
                          ),
                      ]
                    : group.lines.map((line, lineIndex) =>
                        renderLyricLine(line, lineIndex, currentTime, textClass, isCurrentLine),
                      )}
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
