import type { LyricsLine } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import type { CSSProperties, WheelEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
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
  lyrics: LyricsLine[];
  isLoading: boolean;
  showPronunciation: boolean;
  showTranslation: boolean;
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
  // Count how many text lines this block has (minimum 1, maximum 3)
  const lineCount = group.lines.length;

  // Check if the phrase is very long and likely wraps due to flex-wrap
  const mainLineLength = group.lines[0]?.text.length || 0;
  const isWrapping = mainLineLength > 28; // If more than 28 characters, assume it takes 2 lines

  // Assign a base weight based on the amount of information
  let weight = 1; // Original only
  if (lineCount === 2) weight = 1.5; // Original + Translation (or Romaji)
  if (lineCount >= 3) weight = 2.2; // Original + Romaji + Translation

  // If the line is very long, give it extra space so it doesn’t clash with the one below
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

interface EnhancedSegmentProps {
  segment: LyricSegment;
  lineSizeClass: string;
  isCurrentLine: boolean;
  isPastLine: boolean;
  // Audio time (seconds) at the moment this line became active
  lineActivationAudioTime: number | null;
  // Wall-clock time (ms) at the moment this line became active
  lineActivationWallTime: number | null;
}

// Wall-clock-based scheduler: fires CSS animations via setTimeout so they continue
// running even when audio is paused — matching Apple Music behaviour.
// Does NOT receive currentTime, so it never re-renders on audio ticks.
const EnhancedSegment = memo(function EnhancedSegment({
  segment,
  lineSizeClass,
  isCurrentLine,
  isPastLine,
  lineActivationAudioTime,
  lineActivationWallTime,
}: EnhancedSegmentProps) {
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;

    if (isPastLine) {
      el.style.transition = 'none';
      el.style.width = '100%';
      return;
    }

    if (!isCurrentLine || lineActivationAudioTime === null || lineActivationWallTime === null) {
      el.style.transition = 'none';
      el.style.width = '0%';
      return;
    }

    // Compute audio position right now using wall-clock elapsed since activation.
    // This works even during pause: the wall clock keeps ticking, which is exactly
    // what we want — animations complete regardless of playback state.
    const wallElapsedSec = (Date.now() - lineActivationWallTime) / 1000;
    const audioNow = lineActivationAudioTime + wallElapsedSec;

    const totalDurationSec = segment.endTime
      ? segment.endTime - segment.startTime
      : 0.3;
    const totalDurationMs = totalDurationSec * 1000;
    // Enforce a minimum visible duration so fast syllables never look like a snap
    const animationDurationMs = Math.max(totalDurationMs, 150);

    if (audioNow >= (segment.endTime ?? segment.startTime + totalDurationSec)) {
      // Already past — snap to full instantly
      el.style.transition = 'none';
      el.style.width = '100%';
      return;
    }

    if (audioNow >= segment.startTime) {
      // Already mid-syllable: snap to current progress, animate the rest
      const elapsed = audioNow - segment.startTime;
      const progress = Math.min(elapsed / totalDurationSec, 1);
      const remainingMs = Math.max((1 - progress) * animationDurationMs, 150);
      const startPct = `${Math.round(progress * 1000) / 10}%`;

      el.style.transition = 'none';
      el.style.width = startPct;
      requestAnimationFrame(() => {
        el.style.transition = `width ${remainingMs}ms linear`;
        el.style.width = '100%';
      });
      return;
    }

    // Syllable hasn't started yet: reset and schedule
    el.style.transition = 'none';
    el.style.width = '0%';

    const delayMs = Math.max((segment.startTime - audioNow) * 1000, 0);
    const timerId = setTimeout(() => {
      requestAnimationFrame(() => {
        el.style.transition = `width ${animationDurationMs}ms linear`;
        el.style.width = '100%';
      });
    }, delayMs);

    return () => clearTimeout(timerId);
  }, [isCurrentLine, isPastLine, lineActivationAudioTime, lineActivationWallTime, segment]);

  return (
    <span
      // whitespace-pre is key for keeping Asian characters properly aligned
      className={`relative inline-block align-bottom ${lineSizeClass} whitespace-pre`}
    >
      {/* 1. Background layer (dimmed) */}
      <span className={isCurrentLine ? 'text-white/30!' : 'text-white/20'}>{segment.text}</span>

      {/* 2. Fill layer — width driven imperatively via ref */}
      <span
        ref={fillRef}
        className="absolute inset-y-0 left-0 overflow-hidden whitespace-pre text-white will-change-[width]"
        style={{ width: '0%' }}
      >
        {segment.text}
      </span>
    </span>
  );
});

function renderEnhancedSegment(
  segment: LyricSegment,
  lineSizeClass: string,
  isCurrentLine: boolean,
  isPastLine: boolean,
  lineActivationAudioTime: number | null,
  lineActivationWallTime: number | null,
) {
  return (
    <EnhancedSegment
      key={`${segment.startTime}-${segment.text}`}
      segment={segment}
      lineSizeClass={lineSizeClass}
      isCurrentLine={isCurrentLine}
      isPastLine={isPastLine}
      lineActivationAudioTime={lineActivationAudioTime}
      lineActivationWallTime={lineActivationWallTime}
    />
  );
}

function renderAlignedPronunciationPair(
  originalLine: LyricDisplayLine,
  pronunciationLine: LyricDisplayLine,
  isCurrentLine: boolean,
  isPastLine: boolean,
  lineActivationAudioTime: number | null,
  lineActivationWallTime: number | null,
  isV2 = false,
) {
  // 1. Count how many synchronized blocks there are
  const maxIndex = Math.max(
    ...originalLine.segments.map((s) => s.alignmentTrackIndex ?? -1),
    ...pronunciationLine.segments.map((s) => s.alignmentTrackIndex ?? -1),
  );

  // 2. Pair each original segment with its corresponding romaji
  const pairedSegments = [];
  for (let i = 0; i <= maxIndex; i++) {
    pairedSegments.push({
      orig: originalLine.segments.find((s) => s.alignmentTrackIndex === i),
      pron: pronunciationLine.segments.find((s) => s.alignmentTrackIndex === i),
    });
  }

  const origSizeClass = getLineSizeClass(0);
  const pronSizeClass = getLineSizeClass(1);

  // 3. flex-wrap handles line breaks automatically when the screen is narrow
  return (
    <div
      key={`paired-${originalLine.text}`}
      className={`flex max-w-[56dvw] flex-wrap items-end gap-x-[1.2vh] gap-y-[1.5vh] ${isV2 ? 'justify-end' : 'justify-start'}`}
    >
      {pairedSegments.map((pair, index) => {
        if (!pair.orig && !pair.pron) return null;

        return (
          // Vertical column: forces original and romaji to NEVER be separated
          <div
            key={pair.orig?.startTime ?? pair.pron?.startTime ?? index}
            className="flex flex-col items-center justify-end"
          >
            {/* Top: Original text */}
            <div className="flex h-full items-end pb-[0.2vh]">
              {pair.orig ? (
                renderEnhancedSegment(pair.orig, origSizeClass, isCurrentLine, isPastLine, lineActivationAudioTime, lineActivationWallTime)
              ) : (
                <span className={origSizeClass}>&nbsp;</span>
              )}
            </div>

            {/* Bottom: Pronunciation (Romaji) */}
            <div className="flex items-start">
              {pair.pron ? (
                renderEnhancedSegment(pair.pron, pronSizeClass, isCurrentLine, isPastLine, lineActivationAudioTime, lineActivationWallTime)
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

// For lines without pronunciation or simple translations
function renderLyricLine(
  line: LyricDisplayLine,
  lineIndex: number,
  textClass: string,
  isCurrentLine: boolean,
  isPastLine: boolean,
  lineActivationAudioTime: number | null,
  lineActivationWallTime: number | null,
  isV2 = false,
) {
  const lineSizeClass = getLineSizeClass(lineIndex);

  if (!line.isEnhanced || line.segments.length === 0) {
    return (
      <span
        key={`${line.text}-${lineIndex}`}
        className={`bg-transparent px-[1vh] leading-[1.2] whitespace-normal wrap-break-word transition-all duration-300 ease-out ${textClass} ${lineSizeClass}`}
      >
        {line.text}
      </span>
    );
  }

  return (
    <div
      key={`${line.text}-${lineIndex}`}
      className={`flex max-w-[56dvw] flex-wrap items-end gap-y-[0.5vh] ${isV2 ? 'justify-end' : 'justify-start'}`}
    >
      {line.segments.map((segment) =>
        renderEnhancedSegment(segment, lineSizeClass, isCurrentLine, isPastLine, lineActivationAudioTime, lineActivationWallTime),
      )}
    </div>
  );
}

function LRCVisualizer({
  lyrics,
  isLoading,
  showPronunciation,
  showTranslation,
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
        showTranslation,
      }),
    [lyrics, showTranslation, showPronunciation],
  );

  const currentLineIndex = useMemo(() => {
    for (let index = lyricGroups.length - 1; index >= 0; index -= 1) {
      if (currentTime >= lyricGroups[index].time) {
        return index;
      }
    }

    return -1;
  }, [currentTime, lyricGroups]);

  // Capture the audio time and wall-clock time the moment a new line becomes active.
  // This snapshot is passed to segments so they can schedule animations via setTimeout,
  // making them independent of React renders and playback state (pausing included).
  const prevLineIndexRef = useRef(-2);
  const prevAudioTimeRef = useRef(currentTime);
  const lineActivationRef = useRef<{ audioTime: number; wallTime: number } | null>(null);

  // Detect seek: if audio time jumped by more than 0.5s in a single render tick
  const isSeeked = Math.abs(currentTime - prevAudioTimeRef.current) > 0.5;
  prevAudioTimeRef.current = currentTime;

  if (prevLineIndexRef.current !== currentLineIndex || isSeeked) {
    prevLineIndexRef.current = currentLineIndex;
    lineActivationRef.current =
      currentLineIndex >= 0 ? { audioTime: currentTime, wallTime: Date.now() } : null;
  }

  const lineActivationAudioTime = lineActivationRef.current?.audioTime ?? null;
  const lineActivationWallTime = lineActivationRef.current?.wallTime ?? null;

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
            const isPastLine = currentLineIndex >= 0 && index < currentLineIndex;
            const isV2 = group.agent === 'v2';
            const alignClass = isV2 ? 'pr-[2dvw] text-right' : 'pl-[2dvw] text-left';
            const itemsClass = isV2 ? 'items-end' : 'items-start';
            // Only the active line gets the activation snapshot; all others get null
            // so their segments stay at 0% (upcoming) or 100% (past).
            const segActivationAudioTime = isCurrentLine ? lineActivationAudioTime : null;
            const segActivationWallTime = isCurrentLine ? lineActivationWallTime : null;

            return (
              <div
                key={`${group.time}-${group.lines.map((line) => line.text).join('-')}`}
                data-line-index={index}
                className={`${alignClass} transition-[max-height,opacity,transform,filter,margin] duration-500 ease-out ${containerClass}`}
                style={style}
              >
                <div className={`flex max-w-[56dvw] flex-col ${itemsClass} ${groupClass} ${isV2 ? 'ml-auto' : ''}`}>
                  {group.lines[0]?.alignmentTrackWidths && group.lines[1]?.alignmentTrackWidths
                    ? [
                        renderAlignedPronunciationPair(
                          group.lines[0],
                          group.lines[1],
                          isCurrentLine,
                          isPastLine,
                          segActivationAudioTime,
                          segActivationWallTime,
                          isV2,
                        ),
                        ...group.lines
                          .slice(2)
                          .map((line, lineIndex) =>
                            renderLyricLine(
                              line,
                              lineIndex + 2,
                              textClass,
                              isCurrentLine,
                              isPastLine,
                              segActivationAudioTime,
                              segActivationWallTime,
                              isV2,
                            ),
                          ),
                      ]
                    : group.lines.map((line, lineIndex) =>
                        renderLyricLine(
                          line,
                          lineIndex,
                          textClass,
                          isCurrentLine,
                          isPastLine,
                          segActivationAudioTime,
                          segActivationWallTime,
                          isV2,
                        ),
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
