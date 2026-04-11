import type { LRCFile, LRCLine } from '@seerial/domain';
import { useLanguageName as getTrackLanguageName } from '@/localization/TrackLanguages';

const PRONUNCIATION_LANGUAGE = 'pronunciation';

export interface ClassifiedLyrics {
    original: LRCFile | null;
    pronunciation: LRCFile | null;
    translations: LRCFile[];
}

export interface LyricGroup {
    time: number;
    lines: string[];
}

function normalizeLanguage(language: string) {
    return language.trim().toLowerCase();
}

function toTimeKey(time: number) {
    return Math.round(time * 1000);
}

function normalizeLyricText(text: string) {
    return text.trim().replace(/\s+/g, ' ');
}

function dedupeOrderedLyricLines(lines: Array<string | undefined>) {
    const seen = new Set<string>();

    return lines.filter((line): line is string => {
        if (!line) {
            return false;
        }

        const normalizedLine = normalizeLyricText(line);
        if (!normalizedLine || seen.has(normalizedLine)) {
            return false;
        }

        seen.add(normalizedLine);
        return true;
    });
}

function buildLyricLineMap(track: LRCFile | null) {
    const lineMap = new Map<number, string>();

    if (!track) {
        return lineMap;
    }

    for (const line of parseLrcContent(track.content)) {
        lineMap.set(toTimeKey(line.time), line.text);
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

    const primaryLines = parseLrcContent(primaryTrack.content);
    const originalLines = buildLyricLineMap(classifiedLyrics.original);
    const pronunciationLines = buildLyricLineMap(
        showPronunciation ? classifiedLyrics.pronunciation : null,
    );
    const translationLines = buildLyricLineMap(selectedTranslation);

    return primaryLines
        .map((line) => {
            const timeKey = toTimeKey(line.time);
            const orderedLines = dedupeOrderedLyricLines([
                originalLines.get(timeKey),
                pronunciationLines.get(timeKey),
                translationLines.get(timeKey),
            ]);

            if (orderedLines.length === 0) {
                orderedLines.push(line.text);
            }

            return {
                time: line.time,
                lines: orderedLines.slice(0, 3),
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