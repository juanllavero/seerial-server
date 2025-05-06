import express from 'express';
import { Video } from '../../../data/models/Media/Video.model';
import {
  getAlbums,
  getCollections,
  getEpisodes,
  getLibraries,
  getLibraryById,
  getMovies,
  getSeasons,
  getSeries,
  getVideoByEpisodeId,
  getVideoById,
  getVideoByMovieId,
} from '../../../db/get/getData';
import { SequelizeManager } from '../../../db/SequelizeManager';
import { Downloader } from '../../../downloaders/Downloader';
import { FileSearch } from '../../../fileSearch/fileSearch';
import { clearLibrary } from '../../../fileSearch/utils';
import { MovieDBWrapper } from '../../../theMovieDB/MovieDB';
import { IMDBScores } from '../../../utils/IMDBScores';
import { Utils } from '../../../utils/Utils';
import { WebSocketManager } from '../../../WebSockets/WebSocketManager';
const router = express.Router();

// Get libraries
router.get('/libraries', async (_req, res) => {
  await SequelizeManager.initializeDB();

  res.json(await getLibraries());
});

router.get('/collections', async (req, res) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getCollections(libraryId as string));
});

router.get('/series', async (req, res) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getSeries(libraryId as string));
});

router.get('/movies', async (req, res) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getMovies(libraryId as string));
});

router.get('/seasons', async (req, res) => {
  const { seriesId } = req.query;

  if (!seriesId || seriesId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getSeasons(seriesId as string));
});

router.get('/episodes', async (req, res) => {
  const { seasonId } = req.query;

  if (!seasonId || seasonId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getEpisodes(seasonId as string));
});

router.get('/episode-video', async (req, res) => {
  const { episodeId } = req.query;

  if (!episodeId || episodeId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getVideoByEpisodeId(episodeId as string));
});

router.get('/movie-video', async (req, res) => {
  const { movieId } = req.query;

  if (!movieId || movieId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getVideoByMovieId(movieId as string));
});

router.get('/video', async (req, res) => {
  const { id } = req.query;

  if (!id || id === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getVideoById(id as string));
});

router.get('/albums', async (req, res) => {
  const { libraryId } = req.query;

  if (!libraryId || libraryId === '') return;

  await SequelizeManager.initializeDB();

  res.json(await getAlbums(libraryId as string));
});

// Search files in library
router.get('/library/search', async (req: any, res: any) => {
  const { libraryId } = req.query;

  const library = await getLibraryById(libraryId);

  if (!library) return;

  await clearLibrary(libraryId, WebSocketManager.getInstance());

  FileSearch.scanFiles(library, WebSocketManager.getInstance(), false);

  res.json({});
});

// Search movies in TheMovieDB
router.get('/movies/search', (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Param name not found' });
  }

  MovieDBWrapper.searchMovies(name, year, 1).then((data) => res.json(data));
});

// Search episode groups in TheMovieDB
router.get('/episodeGroups/search', (req: any, res: any) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: 'Param id not found' });
  }

  MovieDBWrapper.searchEpisodeGroups(id).then((data) => res.json(data));
});

// Test endpoint to get the IMDB score given a IMDB ID
router.get('/imdbScore', (req: any, res: any) => {
  const id = req.query.id;

  IMDBScores.getIMDBScore(id).then((data) => res.json(data));
});

// Test endpoint to get chapters
router.get('/chapters', async (req: any, res: any) => {
  const path = req.query.path;

  const video = new Video({
    fileSrc: path,
  });

  res.json(await Utils.getChapters(video));
});

// Test endpoint to get media info
router.get('/mediaInfo', async (req: any, res: any) => {
  const path = req.query.path;

  const video = new Video({
    fileSrc: path,
  });

  await Utils.getMediaInfo(video);

  res.json(video);
});

// Get search videos results
router.get('/media/search', async (req: any, res: any) => {
  const { query } = req.query;

  if (typeof query !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const data = await Downloader.searchVideos(query, 20);
  res.json(data);
});

// Search shows in TheMovieDB
router.get('/shows/search', (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Param name not found' });
  }

  MovieDBWrapper.searchTVShows(name, year, 1).then((data) => res.json(data));
});

export default router;
