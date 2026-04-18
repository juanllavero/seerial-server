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
    /** Main content lines: original text and optional pronunciation. No translation. */
    lines: LyricDisplayLine[];
    /** Synced background/chorus vocal segments (from TTML x-bg spans). */
    backgroundVocals?: LyricSegment[];
    /** Translation text with parenthesized background-vocal content removed. */
    translationText?: string;
    /** Parenthesized content extracted from the translation line (no sync). */
    translationBackgroundVocals?: string;
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

/**
 * Splits a translation string into the main text and the parenthesized background-vocal
 * excerpt, if present. E.g. "Pero sin mí (Solo eres tú)" →
 * { text: "Pero sin mí", backgroundVocals: "(Solo eres tú)" }
 */
function splitTranslation(raw: string): { text: string; backgroundVocals?: string } {
    const match = /\(([^)]+)\)/.exec(raw);
    if (!match) return { text: raw.trim() };
    const backgroundVocals = raw.slice(match.index, match.index + match[0].length).trim();
    const text = (raw.slice(0, match.index) + raw.slice(match.index + match[0].length)).trim();
    return { text: text || '', backgroundVocals };
}

function buildDisplayLines(
    line: LyricsLine,
    showPronunciation: boolean,
): LyricDisplayLine[] {
    const out: LyricDisplayLine[] = [];

    if (line.words) {
        buildEnhancedWordLines(line.words, showPronunciation, out);
    } else if (line.plainText) {
        buildPlainTextLines(line.plainText, showPronunciation, out);
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

        const displayLines = buildDisplayLines(line, showPronunciation);
        const backgroundVocals =
            line.words?.backgroundVocals?.length
                ? wordsToSegments(line.words.backgroundVocals)
                : undefined;

        let translationText: string | undefined;
        let translationBackgroundVocals: string | undefined;
        if (showTranslation && line.translation) {
            const split = splitTranslation(line.translation);
            translationText = split.text || undefined;
            translationBackgroundVocals = split.backgroundVocals;
        }

        if (displayLines.length > 0) {
            groups.push({
                time: line.startTime,
                agent: line.agent,
                lines: displayLines,
                backgroundVocals,
                translationText,
                translationBackgroundVocals,
            });
        }
    }

    return groups;
}
