import type { EnhancedLyricsLine, LyricsLine, PlainLyricsLine } from '@seerial/domain';

export interface LyricSegment {
    text: string;
    startTime: number;
    endTime: number | null;
    alignmentTrackIndex?: number;
}

export interface LyricDisplayLine {
    text: string;
    isEnhanced: boolean;
    segments: LyricSegment[];
    alignmentTrackWidths?: number[];
}

export interface LyricGroup {
    time: number;
    agent: 'v1' | 'v2';
    lines: LyricDisplayLine[];
    backgroundVocals?: LyricSegment[];
}

function toTimeKey(time: number) {
    return Math.round(time * 1000);
}

function buildAlignmentTrackWidths(trackTimeKeys: number[]) {
    return trackTimeKeys.map((timeKey, index) => {
        const nextTimeKey = trackTimeKeys[index + 1];
        const previousTimeKey = trackTimeKeys[index - 1];
        const durationMs = nextTimeKey
            ? nextTimeKey - timeKey
            : previousTimeKey
                ? timeKey - previousTimeKey
                : 420;

        return Math.max(1, Number((durationMs / 260).toFixed(2)));
    });
}

function buildAlignedLine(
    text: string,
    isEnhanced: boolean,
    segments: LyricSegment[],
    trackIndexByTimeKey: Map<number, number>,
    alignmentTrackWidths: number[],
): LyricDisplayLine {
    return {
        text,
        isEnhanced,
        alignmentTrackWidths,
        segments: segments.map((segment) => ({
            ...segment,
            alignmentTrackIndex: trackIndexByTimeKey.get(toTimeKey(segment.startTime)),
        })),
    };
}

function wordsToSegments(words: EnhancedLyricsLine['original']): LyricSegment[] {
    return words.map((w) => ({ text: w.text, startTime: w.startTime, endTime: w.endTime }));
}

function buildEnhancedWordLines(
    words: EnhancedLyricsLine,
    showPronunciation: boolean,
    out: LyricDisplayLine[],
) {
    const origSegments = wordsToSegments(words.original);
    const origText = origSegments.map((s) => s.text).join('').trim() || '♪';

    if (showPronunciation && words.pronunciation?.length) {
        const pronSegments = wordsToSegments(words.pronunciation);
        const pronText = pronSegments.map((s) => s.text).join('').trim();

        const alignedTimeKeys = Array.from(
            new Set([
                ...origSegments.map((s) => toTimeKey(s.startTime)),
                ...pronSegments.map((s) => toTimeKey(s.startTime)),
            ]),
        ).sort((a, b) => a - b);

        const trackIndexByTimeKey = new Map(alignedTimeKeys.map((k, i) => [k, i]));
        const alignmentTrackWidths = buildAlignmentTrackWidths(alignedTimeKeys);

        out.push(buildAlignedLine(origText, true, origSegments, trackIndexByTimeKey, alignmentTrackWidths));
        out.push(buildAlignedLine(pronText, true, pronSegments, trackIndexByTimeKey, alignmentTrackWidths));
    } else {
        out.push({ text: origText, isEnhanced: true, segments: origSegments });
    }
}

function buildPlainTextLines(
    plainText: PlainLyricsLine,
    showPronunciation: boolean,
    out: LyricDisplayLine[],
) {
    if (plainText.original) {
        out.push({ text: plainText.original, isEnhanced: false, segments: [] });
    }

    if (showPronunciation && plainText.pronunciation) {
        out.push({ text: plainText.pronunciation, isEnhanced: false, segments: [] });
    }
}

function buildDisplayLines(
    line: LyricsLine,
    showPronunciation: boolean,
    showTranslation: boolean,
): LyricDisplayLine[] {
    const out: LyricDisplayLine[] = [];

    if (line.words) {
        buildEnhancedWordLines(line.words, showPronunciation, out);
    } else if (line.plainText) {
        buildPlainTextLines(line.plainText, showPronunciation, out);
    }

    if (showTranslation && line.translation) {
        out.push({ text: line.translation, isEnhanced: false, segments: [] });
    }

    return out;
}

export function buildLyricGroups(
    lyrics: LyricsLine[],
    {
        showPronunciation,
        showTranslation,
    }: {
        showPronunciation: boolean;
        showTranslation: boolean;
    },
): LyricGroup[] {
    const groups: LyricGroup[] = [];

    for (const line of lyrics) {
        if (line.isBlank) {
            groups.push({ time: line.startTime, agent: line.agent, lines: [{ text: '♪', isEnhanced: false, segments: [] }] });
            continue;
        }

        const displayLines = buildDisplayLines(line, showPronunciation, showTranslation);
        const backgroundVocals =
            line.words?.backgroundVocals?.length
                ? wordsToSegments(line.words.backgroundVocals)
                : undefined;

        if (displayLines.length > 0) {
            groups.push({ time: line.startTime, agent: line.agent, lines: displayLines, backgroundVocals });
        }
    }

    return groups;
}
