import type { LRCFile, LRCLine } from '@seerial/domain';
import { useLanguageName as getTrackLanguageName } from '@/localization/TrackLanguages';

const PRONUNCIATION_LANGUAGE = 'pronunciation';
const INLINE_TIME_TAG_PATTERN = /<(\d{1,2}:\d{2}(?:\.\d{1,3})?)>/g;
const LINE_TIME_TAG_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

type LyricLineKind = 'original' | 'pronunciation' | 'translation' | 'primary';

export interface ClassifiedLyrics {
    original: LRCFile | null;
    pronunciation: LRCFile | null;
    translations: LRCFile[];
}

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
    lines: LyricDisplayLine[];
}

interface ParsedLyricLine {
    time: number;
    text: string;
    isEnhanced: boolean;
    segments: LyricSegment[];
}

interface LyricGroupEntry {
    kind: LyricLineKind;
    line: ParsedLyricLine;
}

function normalizeLanguage(language: string) {
    return language.trim().toLowerCase();
}

function toTimeKey(time: number) {
    return Math.round(time * 1000);
}

function parseTimestamp(value: string) {
    const [minutesPart, secondsPart = '0'] = value.split(':');
    const [secondsValue, millisecondsValue = '0'] = secondsPart.split('.');

    return (
        Number.parseInt(minutesPart, 10) * 60 +
        Number.parseInt(secondsValue, 10) +
        Number.parseInt(millisecondsValue.padEnd(3, '0'), 10) / 1000
    );
}

function normalizeLyricText(text: string) {
    return text.trim().replace(/\s+/g, ' ');
}

function dedupeOrderedLyricEntries(entries: LyricGroupEntry[]) {
    const seen = new Set<string>();

    return entries.filter((entry) => {
        const normalizedLine = normalizeLyricText(entry.line.text);

        if (!normalizedLine || seen.has(normalizedLine)) {
            return false;
        }

        seen.add(normalizedLine);
        return true;
    });
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

function applyAlignedSegments(
    line: ParsedLyricLine,
    trackIndexByTimeKey: Map<number, number>,
    alignmentTrackWidths: number[],
): LyricDisplayLine {
    return {
        text: line.text,
        isEnhanced: line.isEnhanced,
        alignmentTrackWidths,
        segments: line.segments.map((segment) => ({
            ...segment,
            alignmentTrackIndex: trackIndexByTimeKey.get(toTimeKey(segment.startTime)),
        })),
    };
}

function buildLyricDisplayLine(line: ParsedLyricLine): LyricDisplayLine {
    return {
        text: line.text,
        isEnhanced: line.isEnhanced,
        segments: line.segments,
    };
}

function parseEnhancedLyricBody(body: string) {
    const matches = [...body.matchAll(INLINE_TIME_TAG_PATTERN)];

    if (matches.length === 0) {
        return null;
    }

    const segments: LyricSegment[] = [];

    for (let index = 0; index < matches.length; index += 1) {
        const currentMatch = matches[index];
        const nextMatch = matches[index + 1];
        const currentIndex = currentMatch.index ?? 0;
        const rawText = body.slice(currentIndex + currentMatch[0].length, nextMatch?.index ?? body.length);
        const text = normalizeLyricText(rawText);

        if (!text) {
            continue;
        }

        segments.push({
            text,
            startTime: parseTimestamp(currentMatch[1]),
            endTime: null,
        });
    }

    if (segments.length === 0) {
        return null;
    }

    const finalizedSegments = segments.map((segment, index) => ({
        ...segment,
        endTime: segments[index + 1]?.startTime ?? null,
    }));

    return {
        isEnhanced: true,
        segments: finalizedSegments,
        text: finalizedSegments.map((segment) => segment.text).join(' ').trim() || '♪',
    };
}

// Detects compact format
// Example normal:   [01:00.00][02:00.00]Same text ← two timestamps, same text
// Example compact: [01:00.00]<...>text1 -[02:00.00]<...>text2
function splitCompactLyricLine(line: string): string[] {
    // Extract the initial block of [mm:ss] tags (format "duplicate timestamps")
    const leadingMatch = line.match(/^(\[\d{1,2}:\d{2}(?:\.\d{1,3})?\])+/);
    const leadingPart = leadingMatch?.[0] ?? '';
    const bodyPart = line.slice(leadingPart.length);

    // If there are no more [mm:ss] in the body, it's a normal line
    if (!/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/.test(bodyPart)) {
        return [line];
    }

    // Compact format: split the body at each [mm:ss] that appears mid-line
    const bodyParts = bodyPart.split(/(?=\[\d{1,2}:\d{2}(?:\.\d{1,3})?\])/);
    return [leadingPart + bodyParts[0], ...bodyParts.slice(1)].filter((s) => s.trim());
}

function parseLyricTrack(content: string): ParsedLyricLine[] {
    const parsedLines: ParsedLyricLine[] = [];

    for (const rawLine of content.split(/\r\n?|\n/)) {
        const trimmedLine = rawLine.trim();
        if (!trimmedLine || /^\[[a-zA-Z]+:.*\]$/.test(trimmedLine)) {
            continue;
        }

        for (const entry of splitCompactLyricLine(trimmedLine)) {
            const trimmedEntry = entry.trim();
            if (!trimmedEntry) continue;

            const matches = [...trimmedEntry.matchAll(LINE_TIME_TAG_PATTERN)];
            if (matches.length === 0) continue;

            const body = trimmedEntry.replace(LINE_TIME_TAG_PATTERN, '').trim();
            const enhancedLyric = parseEnhancedLyricBody(body);
            const text =
                enhancedLyric?.text ??
                (normalizeLyricText(body.replace(INLINE_TIME_TAG_PATTERN, ' ')) || '♪');
            const segments = enhancedLyric?.segments ?? [];

            for (const match of matches) {
                const minutes = Number.parseInt(match[1], 10);
                const seconds = Number.parseInt(match[2], 10);
                const milliseconds = Number.parseInt((match[3] ?? '0').padEnd(3, '0'), 10);

                parsedLines.push({
                    time: minutes * 60 + seconds + milliseconds / 1000,
                    text,
                    isEnhanced: Boolean(enhancedLyric),
                    segments,
                });
            }
        }
    }

    return parsedLines.sort((left, right) => left.time - right.time);
}

function buildParsedLyricLineMap(track: LRCFile | null) {
    const lineMap = new Map<number, ParsedLyricLine>();

    if (!track) {
        return lineMap;
    }

    for (const line of parseLyricTrack(track.content)) {
        lineMap.set(toTimeKey(line.time), line);
    }

    return lineMap;
}

export function parseLrcContent(content: string): LRCLine[] {
    const parsedLines: LRCLine[] = [];

    for (const rawLine of content.split(/\r\n?|\n/)) {
        const trimmedLine = rawLine.trim();
        if (!trimmedLine || /^\[[a-zA-Z]+:.*\]$/.test(trimmedLine)) {
            continue;
        }

        const matches = [...trimmedLine.matchAll(LINE_TIME_TAG_PATTERN)];
        if (matches.length === 0) {
            continue;
        }

        const text = normalizeLyricText(
            trimmedLine.replace(LINE_TIME_TAG_PATTERN, '').replace(INLINE_TIME_TAG_PATTERN, ' '),
        ) || '♪';

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

export function classifyLyricsFiles(lyrics: LRCFile[]): ClassifiedLyrics {
    if (lyrics.length === 0) {
        return {
            original: null,
            pronunciation: null,
            translations: [],
        };
    }

    if (lyrics.length === 1) {
        return {
            original: lyrics[0],
            pronunciation: null,
            translations: [],
        };
    }

    const original = lyrics.find((lyric) => normalizeLanguage(lyric.language) === 'original') ?? null;
    const pronunciation =
        lyrics.find((lyric) => normalizeLanguage(lyric.language) === PRONUNCIATION_LANGUAGE) ?? null;

    const translations = lyrics.filter(
        (lyric) => lyric !== original && lyric !== pronunciation,
    );

    return {
        original,
        pronunciation,
        translations,
    };
}

export function buildLyricGroups(
    lyrics: LRCFile[],
    {
        showPronunciation,
        selectedTranslationLanguage,
    }: {
        showPronunciation: boolean;
        selectedTranslationLanguage: string | null;
    },
): LyricGroup[] {
    const classifiedLyrics = classifyLyricsFiles(lyrics);
    const selectedTranslation =
        classifiedLyrics.translations.find((lyric) => lyric.language === selectedTranslationLanguage) ?? null;
    const primaryTrack =
        classifiedLyrics.original ??
        (showPronunciation ? classifiedLyrics.pronunciation : null) ??
        selectedTranslation ??
        classifiedLyrics.pronunciation ??
        classifiedLyrics.translations[0] ??
        null;

    if (!primaryTrack) {
        return [];
    }

    const primaryLines = parseLyricTrack(primaryTrack.content);
    const originalLines = buildParsedLyricLineMap(classifiedLyrics.original);
    const pronunciationLines = buildParsedLyricLineMap(
        showPronunciation ? classifiedLyrics.pronunciation : null,
    );
    const translationLines = buildParsedLyricLineMap(selectedTranslation);

    return primaryLines
        .map((line) => {
            const timeKey = toTimeKey(line.time);
            const orderedEntries = dedupeOrderedLyricEntries([
                { kind: 'original' as const, line: originalLines.get(timeKey) },
                { kind: 'pronunciation' as const, line: pronunciationLines.get(timeKey) },
                { kind: 'translation' as const, line: translationLines.get(timeKey) },
            ].reduce<LyricGroupEntry[]>((entries, entry) => {
                if (entry.line) {
                    entries.push({ kind: entry.kind, line: entry.line });
                }

                return entries;
            }, []));

            if (orderedEntries.length === 0) {
                orderedEntries.push({ kind: 'primary', line });
            }

            const shouldAlignOriginalAndPronunciation =
                orderedEntries[0]?.kind === 'original' &&
                orderedEntries[1]?.kind === 'pronunciation' &&
                orderedEntries[0].line.isEnhanced &&
                orderedEntries[1].line.isEnhanced;

            if (shouldAlignOriginalAndPronunciation) {
                const alignedTrackTimeKeys = Array.from(
                    new Set([
                        ...orderedEntries[0].line.segments.map((segment) => toTimeKey(segment.startTime)),
                        ...orderedEntries[1].line.segments.map((segment) => toTimeKey(segment.startTime)),
                    ]),
                ).sort((left, right) => left - right);
                const trackIndexByTimeKey = new Map(
                    alignedTrackTimeKeys.map((trackTimeKey, index) => [trackTimeKey, index]),
                );
                const alignmentTrackWidths = buildAlignmentTrackWidths(alignedTrackTimeKeys);

                return {
                    time: line.time,
                    lines: orderedEntries.map((entry, index) => {
                        if (index < 2) {
                            return applyAlignedSegments(
                                entry.line,
                                trackIndexByTimeKey,
                                alignmentTrackWidths,
                            );
                        }

                        return buildLyricDisplayLine(entry.line);
                    }),
                };
            }

            return {
                time: line.time,
                lines: orderedEntries.slice(0, 3).map((entry) => buildLyricDisplayLine(entry.line)),
            };
        })
        .filter((group) => group.lines.length > 0);
}

export function formatLanguageLabel(
    language: string,
    userLanguage: string,
    originalLabel: string,
    pronunciationLabel: string,
) {
    const normalizedLanguage = normalizeLanguage(language);

    if (normalizedLanguage === 'original') {
        return originalLabel;
    }

    if (normalizedLanguage === PRONUNCIATION_LANGUAGE) {
        return pronunciationLabel;
    }

    try {
        const displayNames = new Intl.DisplayNames([userLanguage], { type: 'language' });
        const translated = displayNames.of(normalizedLanguage);
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