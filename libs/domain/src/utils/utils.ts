import type { Video } from "@seerial/domain";

/**
 * Fetches data from a given URL and returns the parsed JSON response.
 *
 * @param url - The URL to fetch data from.
 * @returns A promise that resolves to the parsed JSON data.
 */
export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const iso1to3: Record<string, string> = {
    es: 'spa',
    en: 'eng',
    pt: 'por',
    fr: 'fre',
    de: 'ger',
    it: 'ita',
    ru: 'rus',
    ar: 'ara',
    ja: 'jpn',
    ko: 'kor',
    zh: 'zho',
    hi: 'hin',
    pl: 'pol',
    nl: 'dut',
    sv: 'swe',
    el: 'ell',
    cs: 'ces',
    ro: 'ron',
    fi: 'fin',
    tr: 'tur',
    th: 'tha',
    id: 'ind',
    ms: 'msa',
    ca: 'cat',
};

export const isAbsolutePath = (pathString: string): boolean => {
    const windowsPathRegex = /^[a-zA-Z]:[\\/]/;
    const unixPathRegex = /^\//;

    return windowsPathRegex.test(pathString) || unixPathRegex.test(pathString);
};

export const getImageUrl = (serverUrl: string, imageSrc: string) => {
    return imageSrc
        ? imageSrc.startsWith('http')
            ? imageSrc
            : imageSrc.startsWith('local')
                ? imageSrc.replace('local', '')
                : isAbsolutePath(imageSrc)
                    ? `${serverUrl}/image?path=${encodeURIComponent(imageSrc)}`
                    : `${serverUrl}/${imageSrc.replace('resources/img', 'img')}`
        : '';
};

/**
 * This method is used to delay the execution of a function by a certain amount of milliseconds.
 * @param ms - Number of milliseconds to delay
 * @returns
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//#region DATETIME
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    const monthOptions: Intl.DateTimeFormatOptions = { month: 'short' };

    const month = date.toLocaleString('en-US', monthOptions);
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
};

export const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const formatTimeForView = (time: number) => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);

    if (hours > 0) {
        if (minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${hours}h`;
        }
    } else {
        return `${minutes}m`;
    }
};

export const getOnlyYear = (date: string) => {
    const year = new Date(date).getFullYear();
    return year;
};
//#endregion

export const getAudioTrack = (prefAudioLan: string, video: Video) => {
    if (!video.audioTracks || video.audioTracks.length === 0) return null;

    if (
        video.selectedAudioTrack != null &&
        video.selectedAudioTrack >= 0 &&
        video.selectedAudioTrack < video.audioTracks.length
    ) {
        return video.audioTracks[video.selectedAudioTrack];
    }

    if (prefAudioLan !== '') {
        const track = video.audioTracks.find((track) => track.language === prefAudioLan);
        if (track) return track;
    }

    return video.audioTracks[0];
};

export const getSubtitleTrack = (prefSubsLan: string, subsMode: string, video: Video) => {
    if (!video.subtitleTracks || video.subtitleTracks.length === 0) return null;

    if (video.selectedSubtitleTrack != null) {
        // -1 means the user explicitly disabled subtitles
        if (video.selectedSubtitleTrack === -1) return null;

        if (
            video.selectedSubtitleTrack >= 0 &&
            video.selectedSubtitleTrack < video.subtitleTracks.length
        ) {
            return video.subtitleTracks[video.selectedSubtitleTrack];
        }
    }

    // Convert 2-letter code to 3-letter code
    const targetLang = iso1to3[prefSubsLan] ?? prefSubsLan;

    const defaultTrack =
        subsMode === 'alwaysSubs'
            ? video.subtitleTracks.length > 0
                ? video.subtitleTracks[0]
                : null
            : null;

    switch (subsMode) {
        case 'autoSubs':
        case 'alwaysSubs':
            return (
                video.subtitleTracks.findLast((track) => track.languageTag === targetLang) ?? defaultTrack
            );
        default:
            return null;
    }
};

/**
 * Sets a cookie with the given name, value, and expiration time in days.
 *
 * @param name - The name of the cookie.
 * @param value - The value of the cookie.
 * @param maxAgeDays - The maximum age of the cookie in days.
 */
export const setCookie = (name: string, value: string, maxAgeDays: number) => {
    const maxAge = maxAgeDays * 24 * 60 * 60;
    // biome-ignore lint/suspicious/noDocumentCookie: cookie utility
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=strict`;
}

/**
 * Clears a cookie by setting its max-age to 0, effectively deleting it from the browser.
 * @param name - The name of the cookie to clear.
 */
export const clearCookie = (name: string) => {
    // To delete a cookie, set its max-age to 0
    // biome-ignore lint/suspicious/noDocumentCookie: cookie utility
    document.cookie = `${name}=; path=/; max-age=0; samesite=strict`;
}