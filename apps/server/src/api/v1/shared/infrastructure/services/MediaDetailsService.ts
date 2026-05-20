import * as fs from 'node:fs/promises';
import path from 'node:path';
import type { LyricsLine } from '@seerial/domain';
import { fileSystemService, useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { messages } from '@/config/messages';
import { extraTypes, videoExtensions } from '@/utils/constants';
import logger from '@/utils/logger';
import { buildLyricsFromLrc, buildLyricsFromTtml } from '@/utils/lyricsParser';
import { BadRequestException, NotFoundException } from '../web/exceptions/HTTPExceptions';

const mediaDetailsLogger = logger.child({ category: 'Media Details' });

/** Normalizes typographic quotes/apostrophes to ASCII equivalents for cross-source filename matching. */
function normalizeForComparison(value: string) {
  return value
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\uFF07]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u02BA\uFF02]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .trim()
    .replace(/\s+/g, ' ');
}

function stripTrackPrefix(value: string) {
  return value.replace(/^\d+[\s._-]+/, '').trim();
}

function buildLyricLookupCandidates(songBaseName: string, songTitle: string, trackNumber: number) {
  const candidates = new Set<string>();

  const addCandidate = (value: string) => {
    const normalized = normalizeForComparison(value);
    if (normalized) {
      candidates.add(normalized);
    }
  };

  addCandidate(songBaseName);
  const strippedOnce = stripTrackPrefix(songBaseName);
  addCandidate(strippedOnce);
  addCandidate(stripTrackPrefix(strippedOnce));
  addCandidate(songTitle);

  if (trackNumber > 0 && songTitle) {
    const compactTrack = String(trackNumber);
    const paddedTrack = compactTrack.padStart(2, '0');

    for (const trackValue of [compactTrack, paddedTrack]) {
      addCandidate(`${trackValue} ${songTitle}`);
      addCandidate(`${trackValue}. ${songTitle}`);
      addCandidate(`${trackValue} - ${songTitle}`);
    }
  }

  return Array.from(candidates);
}

function resolveLyricCandidateMatch(fileName: string, lyricCandidates: string[]) {
  const lyricBaseName = normalizeForComparison(path.basename(fileName, path.extname(fileName)));
  const lowerLyricBaseName = lyricBaseName.toLowerCase();

  for (const candidate of lyricCandidates) {
    const lowerCandidate = candidate.toLowerCase();

    if (lowerLyricBaseName === lowerCandidate) {
      return { language: 'original', matchedCandidate: candidate };
    }

    if (lowerLyricBaseName.startsWith(`${lowerCandidate}.`)) {
      return {
        language: lyricBaseName.slice(candidate.length + 1),
        matchedCandidate: candidate,
      };
    }
  }

  return null;
}

/**
 * Fetches details for a single media item by type and ID.
 */
export async function getDetails(type: string, id: string) {
  let result: unknown;
  switch (type) {
    case 'collection':
      result = await useCases.getCollectionById().execute(id);
      // Sorting logic from the original endpoint can be applied here
      break;
    case 'series':
      result = await useCases.getSeriesById().execute(id);
      break;
    case 'season':
      result = await useCases.getSeasonById().execute(id);
      break;
    case 'episode':
      result = await useCases.getEpisodeById().execute(id);
      break;
    case 'video':
      result = await useCases.getVideoById().execute(id);
      break;
    case 'movie':
      result = await useCases.getMoviebyId().execute(id);
      break;
    case 'album':
      result = await useCases.getAlbumById().execute(id);
      break;
    case 'seriesBySeasonId':
      result = await useCases.getSeasonById().execute(id);
      break;
    case 'episode-video':
      result = await useCases.getVideoByEpisodeId().execute(id);
      break;
    case 'movie-video':
      result = await useCases.getVideoByMovieId().execute(id);
      break;
    default:
      throw new BadRequestException(messages.errors.validation.invalidData);
  }
  if (!result) throw new NotFoundException();
  return result;
}

/**
 * Finds a background media file (video or music) for a given media item.
 */
export async function findMediaBackground(
  mediaType: 'video' | 'music',
  itemType: 'movie' | 'series' | 'season',
  id: string,
) {
  let item: { id: string; libraryId: string } | null;

  if (itemType === 'season') {
    const season = await useCases.getSeasonById().execute(id);
    if (!season) throw new NotFoundException(messages.errors.notFound.season);
    item = await useCases.getSeriesById().execute(season.seriesId);
    if (!item) throw new NotFoundException(messages.errors.notFound.series);
  } else {
    item =
      itemType === 'movie'
        ? await useCases.getMoviebyId().execute(id)
        : await useCases.getSeriesById().execute(id);
  }

  if (!item) throw new NotFoundException(messages.errors.notFound[itemType]);
  const libraryId = item.libraryId;

  const folder = fileSystemService.getExternalPath(`resources/${mediaType}/${libraryId}/`);
  const filename = await fileSystemService.getFileInFolder(folder, item.id);
  if (!filename) throw new NotFoundException(messages.errors.notFound.file);

  return {
    url: `/media/${mediaType}/${libraryId}/${path.basename(filename)}`,
  };
}

/**
 * Finds, parses, and merges lyric files (.lrc, .ttml) for a given song.
 *
 * Priority:
 * 1. TTML original → parse words + pronunciation from TTML, attach .lrc translations.
 * 2. LRC original  → parse (E)LRC, attach .pronunciation.lrc and first .lrc translation.
 *
 * @param songId - The ID of the song.
 * @returns A promise resolving to a flat array of `LyricsLine` objects.
 */
export async function findLyricsForSong(songId: string): Promise<LyricsLine[]> {
  const song = await useCases.getSongById().execute(songId);
  if (!song) {
    throw new NotFoundException(messages.errors.notFound.song);
  }

  try {
    const songDirectory = path.dirname(song.fileSrc);
    const songBaseName = path.basename(song.fileSrc, path.extname(song.fileSrc));
    const filesInDir = await fs.readdir(songDirectory);
    const lyricCandidates = buildLyricLookupCandidates(songBaseName, song.title, song.trackNumber);

    const isLrc = (f: string) => path.extname(f).toLowerCase() === '.lrc';
    const isTtml = (f: string) => path.extname(f).toLowerCase() === '.ttml';
    const matchLang = (f: string) => resolveLyricCandidateMatch(f, lyricCandidates)?.language;
    const isTranslation = (lang: string | undefined) =>
      lang !== undefined && lang !== 'original' && lang !== 'pronunciation';

    const ttmlOriginal = filesInDir.filter(isTtml).find((f) => matchLang(f) === 'original');
    const lrcFiles = filesInDir.filter(isLrc);
    const firstTranslation = lrcFiles.find((f) => isTranslation(matchLang(f)));

    let lines: LyricsLine[];

    if (ttmlOriginal) {
      const [ttmlContent, translationContent] = await Promise.all([
        fs.readFile(path.join(songDirectory, ttmlOriginal), 'utf-8'),
        firstTranslation
          ? fs.readFile(path.join(songDirectory, firstTranslation), 'utf-8')
          : Promise.resolve(undefined),
      ]);
      lines = buildLyricsFromTtml(ttmlContent, translationContent);
    } else {
      const lrcOriginal = lrcFiles.find((f) => matchLang(f) === 'original');
      if (!lrcOriginal) {
        mediaDetailsLogger.warn(
          { songId, songFileSrc: song.fileSrc, lyricCandidates },
          'No lyric files matched the song basename',
        );
        return [];
      }

      const pronunciationFile = lrcFiles.find((f) => matchLang(f) === 'pronunciation');
      const [originalContent, pronunciationContent, translationContent] = await Promise.all([
        fs.readFile(path.join(songDirectory, lrcOriginal), 'utf-8'),
        pronunciationFile
          ? fs.readFile(path.join(songDirectory, pronunciationFile), 'utf-8')
          : Promise.resolve(undefined),
        firstTranslation
          ? fs.readFile(path.join(songDirectory, firstTranslation), 'utf-8')
          : Promise.resolve(undefined),
      ]);
      lines = buildLyricsFromLrc(originalContent, pronunciationContent, translationContent);
    }

    if (lines.length === 0) {
      mediaDetailsLogger.warn(
        { songId, songFileSrc: song.fileSrc, lyricCandidates },
        'No lyric lines could be parsed from the matched files',
      );
      return [];
    }

    mediaDetailsLogger.debug(
      { songId, lineCount: lines.length },
      'Resolved and parsed lyrics for song',
    );

    return lines;
  } catch (error) {
    mediaDetailsLogger.error(error, 'Error processing lyrics');
    throw new Error('An internal error occurred while processing lyrics.');
  }
}

/**
 * Finds extra files in a folder and extracts metadata based on filename patterns.
 */
async function findExtrasInFolder(
  folder: string,
): Promise<{ title: string; src: string; type: string }[]> {
  const foundExtras: { title: string; src: string; type: string }[] = [];

  // Check for the existence of 'extras' or 'Extras'
  const extrasPathCandidates = [path.join(folder, 'extras'), path.join(folder, 'Extras')];
  let extrasPath: string | undefined;

  for (const candidate of extrasPathCandidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        extrasPath = candidate;
        break;
      }
    } catch (_error) {
      // Ignore error and continue
    }
  }

  if (!extrasPath) {
    return [];
  }

  const files = await fs.readdir(extrasPath);

  for (const file of files) {
    const fileExt = path.extname(file).toLowerCase();

    if (!videoExtensions.includes(fileExt)) {
      continue;
    }

    const baseName = path.basename(file, fileExt);

    for (const type of extraTypes) {
      const suffix = `-${type}`;
      if (baseName.endsWith(suffix)) {
        const nameWithoutSuffix = baseName.substring(0, baseName.length - suffix.length);
        const titleParts = nameWithoutSuffix.split(' - ');
        const title =
          titleParts.length > 1 ? titleParts.slice(1).join(' - ').trim() : nameWithoutSuffix.trim();

        foundExtras.push({
          title,
          src: path.join(extrasPath, file),
          type,
        });

        break;
      }
    }
  }

  return foundExtras;
}

/**
 * Finds extra video files (concerts, interviews, etc.) in the folders
 * of albums belonging to a specific collection.
 * @param collectionId - The ID of the music collection.
 * @returns A promise that resolves to a flat array of all found extra media.
 */
export async function findMusicExtras(collectionId: string) {
  const collection = await useCases.getCollectionById().execute(collectionId);
  if (!collection) {
    throw new NotFoundException(messages.errors.notFound.collection);
  }

  const rootFolders = new Set<string>();
  for (const album of collection.albums) {
    if (album.folder) {
      rootFolders.add(path.dirname(album.folder));
    }
  }

  const promises = Array.from(rootFolders).map((folder) => findExtrasInFolder(folder));

  const results = await Promise.all(promises);
  return results.flat();
}
