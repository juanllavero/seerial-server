import type {
	EnhancedLyricsLine,
	LyricsLine,
	LyricWord,
	PlainLyricsLine,
} from "@seerial/domain";

// ─── Time Helpers ──────────────────────────────────────────────────────────────

/** Parses `MM:SS.ms` (LRC) to seconds. */
function parseLrcTime(t: string): number {
	const i = t.indexOf(":");
	return parseInt(t.slice(0, i), 10) * 60 + parseFloat(t.slice(i + 1));
}

/**
 * Parses TTML time offsets to seconds.
 * Supports: `SS.mmm`, `M:SS.mmm`, `H:MM:SS.mmm`.
 */
function parseTtmlTime(t: string): number {
	const parts = t.split(":");
	if (parts.length === 1) return parseFloat(parts[0]);
	if (parts.length === 2)
		return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
	return (
		parseInt(parts[0], 10) * 3600 +
		parseInt(parts[1], 10) * 60 +
		parseFloat(parts[2])
	);
}

// ─── LRC / ELRC Parsing ───────────────────────────────────────────────────────

interface RawLrcLine {
	startTime: number;
	isBlank: boolean;
	text?: string;
	words?: LyricWord[];
}

const LRC_LINE_RE = /^\[(\d+:\d+\.\d+)\](.*)/;
const ELRC_INLINE_RE = /<\d+:\d+\.\d+>/;
const ELRC_TOKEN_RE = /<(\d+:\d+\.\d+)>([^<]*)/g;

function parseElrcWords(rest: string): LyricWord[] {
	const tokens: { time: number; text: string }[] = [];

	for (const m of rest.matchAll(new RegExp(ELRC_TOKEN_RE.source, "g"))) {
		// trimStart only: preserve trailing space so the word boundary from
		// the original file is kept (e.g. "a" stays "a", not " a",
		// while "Revolved " keeps its trailing space).
		tokens.push({ time: parseLrcTime(m[1]), text: m[2].trimStart() });
	}

	const words: LyricWord[] = [];
	for (let i = 0; i < tokens.length; i++) {
		const { text, time } = tokens[i];
		if (!text) continue;
		words.push({
			text,
			startTime: time,
			endTime: tokens[i + 1]?.time ?? time + 0.5,
		});
	}
	return words;
}

function parseLrc(content: string): RawLrcLine[] {
	const result: RawLrcLine[] = [];
	for (const raw of content.split(/\r?\n/)) {
		const m = LRC_LINE_RE.exec(raw);
		if (!m) continue;
		const startTime = parseLrcTime(m[1]);
		const rest = m[2];
		if (!rest.trim()) {
			result.push({ startTime, isBlank: true });
		} else if (ELRC_INLINE_RE.test(rest)) {
			result.push({ startTime, isBlank: false, words: parseElrcWords(rest) });
		} else {
			result.push({ startTime, isBlank: false, text: rest.trim() });
		}
	}
	return result;
}

// ─── TTML Parsing ─────────────────────────────────────────────────────────────

interface TtmlBodyLine {
	startTime: number;
	endTime: number;
	lineId: string;
	agent: "v1" | "v2";
	words: LyricWord[];
	backgroundVocals: LyricWord[];
}

function xmlAttr(tag: string, attr: string): string | undefined {
	const m = new RegExp(`(?:^|\\s)${attr}="([^"]+)"`).exec(tag);
	return m?.[1];
}

/**
 * Extracts `LyricWord[]` from a flat sequence of simple `<span begin end>text</span>` elements.
 * Does NOT handle nested spans — call `parseSpans` for general TTML content.
 */
function extractSimpleSpanWords(content: string): LyricWord[] {
	const words: LyricWord[] = [];
	for (const m of content.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>([^<]*)/g)) {
		const inner = m[2].replace(/\s+/g, " ").trim();
		if (!inner) continue;
		const trailingSpace = /\s/.test(m[3]) ? " " : "";
		const text = inner + trailingSpace;
		const begin = xmlAttr(m[1], "begin");
		const end = xmlAttr(m[1], "end");
		if (!begin || !end) continue;
		words.push({
			text,
			startTime: parseTtmlTime(begin),
			endTime: parseTtmlTime(end),
		});
	}
	return words;
}

/**
 * Parses the span content of a `<p>` element.
 *
 * - Regular `<span begin end>text</span>` → `words`.
 * - `<span ttm:role="x-bg">` containers (background/chorus phrases) → `backgroundVocals`.
 *   Their inner timed spans are extracted with original timings so animations work.
 */
function parseSpans(content: string): {
	words: LyricWord[];
	backgroundVocals: LyricWord[];
} {
	const backgroundVocals: LyricWord[] = [];

	// Match containers whose body consists exclusively of child <span> elements
	// (i.e. no direct text), which is the shape of ttm:role="x-bg" blocks.
	// [^<]* on child content prevents matching further-nested containers.
	const BG_RE =
		/<span\b([^>]*ttm:role="x-bg"[^>]*)>((?:\s*<span\b[^>]*>[^<]*<\/span>)*\s*)<\/span>/g;

	const cleanedContent = content.replace(BG_RE, (_full, _attrs, inner: string) => {
		backgroundVocals.push(...extractSimpleSpanWords(inner));
		return "";
	});

	return { words: extractSimpleSpanWords(cleanedContent), backgroundVocals };
}

function parseTtmlBody(content: string): TtmlBodyLine[] {
	const bodyM = /<body\b[^>]*>([\s\S]*?)<\/body>/.exec(content);
	if (!bodyM) return [];

	const lines: TtmlBodyLine[] = [];

	for (const m of bodyM[1].matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
		const begin = xmlAttr(m[1], "begin");
		const end = xmlAttr(m[1], "end");
		const lineId = xmlAttr(m[1], "itunes:key");
		if (!begin || !end || !lineId) continue;
		const { words, backgroundVocals } = parseSpans(m[2]);
		lines.push({
			startTime: parseTtmlTime(begin),
			endTime: parseTtmlTime(end),
			lineId,
			agent: xmlAttr(m[1], "ttm:agent") === "v2" ? "v2" : "v1",
			words,
			backgroundVocals,
		});
	}
	return lines;
}

/**
 * Extracts the first transliteration block and returns a map of
 * `lineId → pronunciation words`.
 */
function parseTtmlPronunciation(content: string): Map<string, LyricWord[]> {
	const map = new Map<string, LyricWord[]>();
	const transM = /<transliterations>([\s\S]*?)<\/transliterations>/.exec(
		content,
	);
	if (!transM) return map;

	const firstM = /<transliteration\b[^>]*>([\s\S]*?)<\/transliteration>/.exec(
		transM[1],
	);
	if (!firstM) return map;

	for (const m of firstM[1].matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
		const lineRef = xmlAttr(m[1], "for");
		if (!lineRef) continue;
		const { words } = parseSpans(m[2]);
		if (words.length > 0) map.set(lineRef, words);
	}
	return map;
}

// ─── Merge Helpers ────────────────────────────────────────────────────────────

const BLANK_GAP_THRESHOLD_S = 5;

/**
 * Maps pronunciation words onto original word slots using original timings.
 * Matches by index; unmatched slots are omitted.
 */
function mapByOrigTiming(
	origWords: LyricWord[],
	pronWords: LyricWord[],
): LyricWord[] {
	return origWords.flatMap((ow, i) => {
		const text = pronWords[i]?.text;
		if (!text) return [];
		return [{ text, startTime: ow.startTime, endTime: ow.endTime }];
	});
}

function buildEnhancedLine(
	orig: RawLrcLine & { words: LyricWord[] },
	pron: RawLrcLine | undefined,
	trans: string | undefined,
): LyricsLine {
	const pronWords = pron?.words?.length
		? mapByOrigTiming(orig.words, pron.words)
		: undefined;
	const words: EnhancedLyricsLine = {
		original: orig.words,
		...(pronWords?.length ? { pronunciation: pronWords } : {}),
	};
	return {
		agent: "v1",
		startTime: orig.startTime,
		words,
		...(trans ? { translation: trans } : {}),
	};
}

function buildPlainLine(
	orig: RawLrcLine & { text: string },
	pron: RawLrcLine | undefined,
	trans: string | undefined,
): LyricsLine {
	const pronText =
		pron?.text ??
		(pron?.words?.length ? pron.words.map((w) => w.text).join("") : undefined);
	const plainText: PlainLyricsLine = {
		original: orig.text,
		...(pronText ? { pronunciation: pronText } : {}),
	};
	return {
		agent: "v1",
		startTime: orig.startTime,
		plainText,
		...(trans ? { translation: trans } : {}),
	};
}

// ─── Public Build Functions ───────────────────────────────────────────────────

/**
 * Parses a TTML lyric file and an optional plain-LRC translation into
 * a flat array of `LyricsLine` objects ready to be sent to clients.
 *
 * - Word-level timing comes from the TTML `<body>` spans.
 * - Pronunciation comes from the first `<transliteration>` block in `<head>`.
 * - Instrumental gaps greater than 5 s between consecutive lines produce a
 *   blank `LyricsLine` (`isBlank: true`).
 */
export function buildLyricsFromTtml(
	ttmlContent: string,
	translationContent?: string,
): LyricsLine[] {
	const bodyLines = parseTtmlBody(ttmlContent);
	const pronMap = parseTtmlPronunciation(ttmlContent);

	const transTextLines: string[] = [];
	if (translationContent) {
		for (const line of parseLrc(translationContent)) {
			if (!line.isBlank && line.text) transTextLines.push(line.text);
		}
	}

	const result: LyricsLine[] = [];
	let transIdx = 0;

	for (let i = 0; i < bodyLines.length; i++) {
		const bl = bodyLines[i];
		const pronWords = pronMap.get(bl.lineId);
		const pronunciation = pronWords?.length
			? mapByOrigTiming(bl.words, pronWords)
			: undefined;

		const words: EnhancedLyricsLine = {
			original: bl.words,
			...(pronunciation?.length ? { pronunciation } : {}),
			...(bl.backgroundVocals.length ? { backgroundVocals: bl.backgroundVocals } : {}),
		};

		result.push({
			agent: bl.agent,
			startTime: bl.startTime,
			words,
			...(transTextLines[transIdx]
				? { translation: transTextLines[transIdx] }
				: {}),
		});
		transIdx++;

		const nextStart = bodyLines[i + 1]?.startTime;
		if (
			nextStart !== undefined &&
			nextStart - bl.endTime > BLANK_GAP_THRESHOLD_S
		) {
			result.push({ agent: "v1", startTime: bl.endTime, isBlank: true });
		}
	}

	return result;
}

/**
 * Parses an LRC (or ELRC) original lyric file together with optional
 * pronunciation and translation LRC files into a flat array of `LyricsLine`
 * objects ready to be sent to clients.
 *
 * - If the original contains word-level timing (ELRC), `words` is populated.
 * - Otherwise `plainText` is populated.
 * - Pronunciation and translation non-blank lines are matched to original
 *   non-blank lines by index (same-line-count assumption).
 * - Blank LRC lines (`[MM:SS.ms]` with no text) are preserved as
 *   `{ isBlank: true }` entries.
 */
export function buildLyricsFromLrc(
	originalContent: string,
	pronunciationContent?: string,
	translationContent?: string,
): LyricsLine[] {
	const origLines = parseLrc(originalContent);
	const pronLines = pronunciationContent
		? parseLrc(pronunciationContent).filter((l) => !l.isBlank)
		: [];
	const transLines = translationContent
		? parseLrc(translationContent).filter((l) => !l.isBlank)
		: [];

	const result: LyricsLine[] = [];
	let idx = 0;

	for (const orig of origLines) {
		if (orig.isBlank) {
			result.push({ agent: "v1", startTime: orig.startTime, isBlank: true });
			continue;
		}

		const pron = pronLines[idx];
		const trans = transLines[idx]?.text?.trim() || undefined;
		idx++;

		if (orig.words?.length) {
			result.push(
				buildEnhancedLine(
					orig as RawLrcLine & { words: LyricWord[] },
					pron,
					trans,
				),
			);
		} else {
			result.push(
				buildPlainLine(orig as RawLrcLine & { text: string }, pron, trans),
			);
		}
	}

	return result;
}
