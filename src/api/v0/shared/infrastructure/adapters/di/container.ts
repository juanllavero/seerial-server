//#region IMPORTS
import { AddArtistToAlbumUseCase } from "@/api/v0/albums/application/usecases/AddArtistToAlbumUseCase";
import { CreateAlbumUseCase } from "@/api/v0/albums/application/usecases/CreateAlbumUseCase";
import { DeleteAlbumUseCase } from "@/api/v0/albums/application/usecases/DeleteAlbumUseCase";
import { FindAlbumByIdUseCase } from "@/api/v0/albums/application/usecases/FindAlbumByIdUseCase";
import { FindAllAlbumsUseCase } from "@/api/v0/albums/application/usecases/FindAllAlbumsUseCase";
import { UpdateAlbumUseCase } from "@/api/v0/albums/application/usecases/UpdateAlbumUseCase";
import { AlbumsRepositoryImpl } from "@/api/v0/albums/infrastructure/persistence/repositories/AlbumsRepositoryImpl";
import { DeleteArtistUseCase } from "@/api/v0/artists/application/usecases/DeleteArtistUseCase";
import { UpdateArtistUseCase } from "@/api/v0/artists/application/usecases/UpdateArtistUseCase";
import { ArtistsRepositoryImpl } from "@/api/v0/artists/infrastructure/persistence/repositories/ArtistsRepositoryImpl";
import { AddAlbumToCollectionUseCase } from "@/api/v0/collections/application/usecases/AddAlbumToCollectionUseCase";
import { AddLibraryToCollectionUseCase } from "@/api/v0/collections/application/usecases/AddLibraryUseCase";
import { CreateCollectionUseCase } from "@/api/v0/collections/application/usecases/CreateCollectionUseCase";
import { DeleteCollectionUseCase } from "@/api/v0/collections/application/usecases/DeleteCollectionUseCase";
import { GetMusicExtrasUseCase } from "@/api/v0/collections/application/usecases/GetMusicExtrasUseCase";
import { ReorderCollectionItemsUseCase } from "@/api/v0/collections/application/usecases/ReorderCollectionItemsUseCase";
import { UpdateCollectionUseCase } from "@/api/v0/collections/application/usecases/UpdateCollectionUseCase";
import { CollectionsRepositoryImpl } from "@/api/v0/collections/infrastructure/persistence/repositories/CollectionsRepositoryImpl";
import { AddVideoUseCase } from "@/api/v0/continue-watching/application/usecases/AddVideoUseCase";
import { DeleteAllUseCase } from "@/api/v0/continue-watching/application/usecases/DeleteAllUseCase";
import { DeleteUseCase } from "@/api/v0/continue-watching/application/usecases/DeleteUseCase";
import { GetCurrentEpisodeUseCase } from "@/api/v0/continue-watching/application/usecases/GetCurrentEpisodeUseCase";
import { GetVideosUseCase } from "@/api/v0/continue-watching/application/usecases/GetVideosUseCase";
import { ContinueWatchingRepositoryImpl } from "@/api/v0/continue-watching/infrastructure/persistence/repositories/ContinueWatchingRepositoryImpl";
import { DeleteEpisodeUseCase } from "@/api/v0/episodes/application/usecases/DeleteEpisodeUseCase";
import { FindEpisodeByPathUseCase } from "@/api/v0/episodes/application/usecases/FindEpisodeByPathUseCase";
import { SetEpisodeWatchStateUseCase } from "@/api/v0/episodes/application/usecases/SetEpisodeWatchStateUseCase";
import { UpdateEpisodeUseCase } from "@/api/v0/episodes/application/usecases/UpdateEpisodeUseCase";
import { EpisodeRepositoryImpl } from "@/api/v0/episodes/infrastructure/persistence/repositories/EpisodeRepositoryImpl";
import { CreateLibraryUseCase } from "@/api/v0/libraries/application/usecases/CreateLibraryUseCase";
import { DeleteLibraryUseCase } from "@/api/v0/libraries/application/usecases/DeleteLibraryUseCase";
import { AddAnalyzedFileUseCase } from "@/api/v0/libraries/application/usecases/files/AddAnalyzedFileUseCase";
import { RemoveAnalyzedFileUseCase } from "@/api/v0/libraries/application/usecases/files/RemoveAnalyzedFileUseCase";
import { AddAnalyzedFolderUseCase } from "@/api/v0/libraries/application/usecases/folders/AddAnalyzedFolderUseCase";
import { RemoveAnalyzedFolderUseCase } from "@/api/v0/libraries/application/usecases/folders/RemoveAnalyzedFolderUseCase";
import { GetLibrariesUseCase } from "@/api/v0/libraries/application/usecases/GetLibrariesUseCase";
import { GetLibraryByVideoIdUseCase } from "@/api/v0/libraries/application/usecases/GetLibraryByVideoIdUseCase";
import { GetLibraryContentUseCase } from "@/api/v0/libraries/application/usecases/GetLibraryContentUseCase";
import { GetLibraryUseCase } from "@/api/v0/libraries/application/usecases/GetLibraryUseCase";
import { ReorderLibrariesUseCase } from "@/api/v0/libraries/application/usecases/ReorderLibrariesUseCase";
import { ReorderLibraryItemsUseCase } from "@/api/v0/libraries/application/usecases/ReorderLibraryItemsUseCase";
import { ScanLibraryUseCase } from "@/api/v0/libraries/application/usecases/ScanLibraryUseCase";
import { UpdateLibraryUseCase } from "@/api/v0/libraries/application/usecases/UpdateLibraryUseCase";
import { LibrariesRepositoryImpl } from "@/api/v0/libraries/infrastructure/persistence/repositories/LibraryRepositoryImpl";
import { DeleteMovieUseCase } from "@/api/v0/movies/application/usecases/DeleteMoviesUseCase";
import { ProcessMovieFolderUseCase } from "@/api/v0/movies/application/usecases/ProcessMovieFolderUseCase";
import { ScanMovieUseCase } from "@/api/v0/movies/application/usecases/ScanMovieUseCase";
import { SearchMovieMetadataUseCase } from "@/api/v0/movies/application/usecases/SearchMovieMetadataUseCase";
import { UpdateMovieMetadataUseCase } from "@/api/v0/movies/application/usecases/UpdateMovieMetadataUseCase";
import { UpdateMovieUseCase } from "@/api/v0/movies/application/usecases/UpdateMoviesUseCase";
import { MoviesRepositoryImpl } from "@/api/v0/movies/infrastructure/persistence/repositories/MoviesRepositoryImpl";
import { MyListRepositoryImpl } from "@/api/v0/my-lists/infrastructure/persistence/repositories/MyListRepositoryImpl";
import { DeleteSeasonUseCase } from "@/api/v0/seasons/application/usecases/DeleteSeasonsUseCase";
import { FindAllSeasonsUseCase } from "@/api/v0/seasons/application/usecases/FindAllSeasonsUseCase";
import { UpdateSeasonUseCase } from "@/api/v0/seasons/application/usecases/UpdateSeasonsUseCase";
import { SeasonsRepositoryImpl } from "@/api/v0/seasons/infrastructure/persistence/repositories/SeasonsRepositoryImpl";
import { CreateSeriesUseCase } from "@/api/v0/series/application/usecases/CreateSeriesUseCase";
import { DeleteSeriesUseCase } from "@/api/v0/series/application/usecases/DeleteSeriesUseCase";
import { FindSeriesByIdUseCase } from "@/api/v0/series/application/usecases/FindSeriesByIdUseCase";
import { ProcessEpisodeUseCase } from "@/api/v0/series/application/usecases/ProcessEpisodeUseCase";
import { RefreshMetadataUseCase } from "@/api/v0/series/application/usecases/RefreshMetadataUseCase";
import { ScanSeriesUseCase } from "@/api/v0/series/application/usecases/ScanSeriesUseCase";
import { UpdateSeriesMetadataUseCase } from "@/api/v0/series/application/usecases/UpdateSeriesMetadataUseCase";
import { UpdateSeriesUseCase } from "@/api/v0/series/application/usecases/UpdateSeriesUseCase";
import { UpdateShowIdUseCase } from "@/api/v0/series/application/usecases/UpdateShowIdUseCase";
import { SeriesRepositoryImpl } from "@/api/v0/series/infrastructure/persistence/repositories/SeriesRepositoryImpl";
import { CreateServerUseCase } from "@/api/v0/servers/application/usecases/CreateServerUseCase";
import { GetServerUseCase } from "@/api/v0/servers/application/usecases/GetServerUseCase";
import { UpdateServerUseCase } from "@/api/v0/servers/application/usecases/UpdateServerUseCase";
import { ServersRepositoryImpl } from "@/api/v0/servers/infrastructure/persistence/repositories/ServersRepositoryImpl";
import { CreateSongUseCase } from "@/api/v0/songs/application/usecases/CreateSongUseCase";
import { DeleteSongUseCase } from "@/api/v0/songs/application/usecases/DeleteSongUseCase";
import { ProcessSongFileUseCase } from "@/api/v0/songs/application/usecases/ProcessSongFileUseCase";
import { ScanSongsUseCase } from "@/api/v0/songs/application/usecases/ScanSongsUseCase";
import { UpdateSongUseCase } from "@/api/v0/songs/application/usecases/UpdateSongUseCase";
import { SongsRepositoryImpl } from "@/api/v0/songs/infrastructure/persistence/repositories/SongsRepositoryImpl";
import { AuthenticateUserUseCase } from "@/api/v0/users/application/usecases/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@/api/v0/users/application/usecases/CreateUserUseCase";
import { DeleteUserUseCase } from "@/api/v0/users/application/usecases/DeleteUserUseCase";
import { GetAllUsersUseCase } from "@/api/v0/users/application/usecases/GetAllUsersUseCase";
import { UpdateUserUseCase } from "@/api/v0/users/application/usecases/UpdateUserUseCase";
import { UsersRepositoryImpl } from "@/api/v0/users/infrastructure/persistence/repositories/UsersRepositoryImpl";
import { CreateVideoAsEpisodeUseCase } from "@/api/v0/videos/application/usecases/CreateVideoAsEpisodeUseCase";
import { FindVideoByEpisodeIdUseCase } from "@/api/v0/videos/application/usecases/FindVideoByEpisodeIdUseCase";
import { FindVideoByIdUseCase } from "@/api/v0/videos/application/usecases/FindVideoByIdUseCase";
import { UpdateVideoUseCase } from "@/api/v0/videos/application/usecases/UpdateVideosUseCase";
import { VideosRepositoryImpl } from "@/api/v0/videos/infrastructure/persistence/repositories/VideosRepositoryImpl";
import { WatchListRepositoryImpl } from "@/api/v0/watch-lists/infrastructure/persistence/repositories/WatchListRepositoryImpl";
import { AudioProcessingServiceImpl } from "../audio-processing/AudioProcessingServiceImpl";
import { DownloaderServiceImpl } from "../downloader/DownloaderServiceImpl";
import { FileSystemServiceImpl } from "../filesystem/FileSystemServiceImpl";
import { MediaInfoServiceImpl } from "../media-info/MediaInfoServiceImpl";
import { MetadataProviderImpl } from "../metadata/MetadataProviderImpl";
import { TMDbApiClient } from "../metadata/TMDbApiClient";
import { NotificationServiceImpl } from "../notification/NotificationServiceImpl";

//#endregion

// Services
export const fileSystemService = new FileSystemServiceImpl();
export const mediaInfoService = new MediaInfoServiceImpl();
export const audioProcessingService = new AudioProcessingServiceImpl(
  fileSystemService
);
export const notificationService = new NotificationServiceImpl();
export const downloaderService = new DownloaderServiceImpl(
  fileSystemService,
  notificationService
);

// Providers
export const tmdbApiClient = new TMDbApiClient();
export const metadataProvider = new MetadataProviderImpl(tmdbApiClient);

// Repositories
export const librariesRepo = new LibrariesRepositoryImpl();
export const moviesRepo = new MoviesRepositoryImpl();
export const seriesRepo = new SeriesRepositoryImpl();
export const albumsRepo = new AlbumsRepositoryImpl();
export const seasonsRepo = new SeasonsRepositoryImpl();
export const episodesRepo = new EpisodeRepositoryImpl();
export const videosRepo = new VideosRepositoryImpl();
export const songsRepo = new SongsRepositoryImpl();
export const artistsRepo = new ArtistsRepositoryImpl();
export const collectionsRepo = new CollectionsRepositoryImpl();
export const continueWatchingRepo = new ContinueWatchingRepositoryImpl();
export const watchListRepo = new WatchListRepositoryImpl();
export const myListRepo = new MyListRepositoryImpl();
export const serversRepo = new ServersRepositoryImpl();
export const usersRepo = new UsersRepositoryImpl();

// Fábricas de casos de uso
export const useCases = {
  // Servers
  createServer: () => new CreateServerUseCase(serversRepo),
  getServer: () => new GetServerUseCase(serversRepo),
  updateServer: () => new UpdateServerUseCase(serversRepo),

  // Users
  authenticateUser: () => new AuthenticateUserUseCase(usersRepo),
  createUser: () => new CreateUserUseCase(usersRepo),
  deleteUser: () => new DeleteUserUseCase(usersRepo),
  updateUser: () => new UpdateUserUseCase(usersRepo),
  getAllUsers: () => new GetAllUsersUseCase(usersRepo),

  // Libraries
  createLibrary: () => new CreateLibraryUseCase(),
  deleteLibrary: () =>
    new DeleteLibraryUseCase(librariesRepo, seriesRepo, moviesRepo, albumsRepo),
  updateLibrary: () => new UpdateLibraryUseCase(librariesRepo),

  reorderLibraries: () => new ReorderLibrariesUseCase(librariesRepo),
  reorderLibraryItems: () => new ReorderLibraryItemsUseCase(librariesRepo),

  getLibraries: () => new GetLibrariesUseCase(librariesRepo),
  getLibrary: () => new GetLibraryUseCase(librariesRepo),
  getLibraryByVideoId: () => new GetLibraryByVideoIdUseCase(librariesRepo),
  getLibraryContent: () => new GetLibraryContentUseCase(librariesRepo),

  scanLibrary: () => new ScanLibraryUseCase(fileSystemService, librariesRepo),

  addAnalyzedFile: () => new AddAnalyzedFileUseCase(librariesRepo),
  removeAnalyzedFile: () => new RemoveAnalyzedFileUseCase(librariesRepo),

  addAnalyzedFolder: () => new AddAnalyzedFolderUseCase(librariesRepo),
  removeAnalyzedFolder: () => new RemoveAnalyzedFolderUseCase(librariesRepo),

  // Collections
  addCollection: () => new CreateCollectionUseCase(collectionsRepo),
  deleteCollection: () => new DeleteCollectionUseCase(collectionsRepo),
  updateCollection: () => new UpdateCollectionUseCase(collectionsRepo),
  getMusicExtras: () => new GetMusicExtrasUseCase(collectionsRepo),
  reorderCollectionItems: () =>
    new ReorderCollectionItemsUseCase(collectionsRepo),
  addLibraryToCollection: () =>
    new AddLibraryToCollectionUseCase(collectionsRepo),
  addAlbumToCollection: () => new AddAlbumToCollectionUseCase(collectionsRepo),

  // Series
  getSeriesById: () => new FindSeriesByIdUseCase(seriesRepo),
  createSeries: () => new CreateSeriesUseCase(seriesRepo),
  deleteSeries: () => new DeleteSeriesUseCase(seriesRepo),
  updateSeries: () => new UpdateSeriesUseCase(seriesRepo),

  processEpisode: () => new ProcessEpisodeUseCase(mediaInfoService),
  refreshMetadata: () => new RefreshMetadataUseCase(),
  scanSeries: () => new ScanSeriesUseCase(fileSystemService, metadataProvider),

  updateSeriesMetadata: () => new UpdateSeriesMetadataUseCase(seriesRepo),
  updateShowId: () => new UpdateShowIdUseCase(),

  // Seasons
  getSeasons: () => new FindAllSeasonsUseCase(seasonsRepo),
  deleteSeason: () => new DeleteSeasonUseCase(seasonsRepo, episodesRepo),
  updateSeason: () => new UpdateSeasonUseCase(seasonsRepo),

  // Movies
  deleteMovie: () =>
    new DeleteMovieUseCase(librariesRepo, moviesRepo, videosRepo),
  updateMovie: () => new UpdateMovieUseCase(moviesRepo),

  updateMovieMetadata: () =>
    new UpdateMovieMetadataUseCase(
      metadataProvider,
      moviesRepo,
      collectionsRepo,
      fileSystemService
    ),
  searchMovieMetadata: () => new SearchMovieMetadataUseCase(tmdbApiClient),
  processMovieFolder: () => new ProcessMovieFolderUseCase(fileSystemService),
  scanMovie: () =>
    new ScanMovieUseCase(
      fileSystemService,
      librariesRepo,
      moviesRepo,
      videosRepo,
      collectionsRepo,
      metadataProvider
    ),

  // Albums
  getAlbums: () => new FindAllAlbumsUseCase(albumsRepo),
  getAlbumById: () => new FindAlbumByIdUseCase(albumsRepo),
  createAlbum: () => new CreateAlbumUseCase(albumsRepo),
  deleteAlbum: () => new DeleteAlbumUseCase(albumsRepo),
  updateAlbum: () => new UpdateAlbumUseCase(albumsRepo),
  addArtistToAlbum: () => new AddArtistToAlbumUseCase(albumsRepo),

  // Artists
  deleteArtist: () => new DeleteArtistUseCase(artistsRepo),
  updateArtist: () => new UpdateArtistUseCase(artistsRepo),

  // Songs
  createSong: () => new CreateSongUseCase(songsRepo),
  deleteSong: () => new DeleteSongUseCase(songsRepo),
  updateSong: () => new UpdateSongUseCase(songsRepo),
  processSongFile: () =>
    new ProcessSongFileUseCase(fileSystemService, songsRepo),
  scanSongs: () => new ScanSongsUseCase(fileSystemService),

  // Episodes
  getEpisodeByPath: () => new FindEpisodeByPathUseCase(episodesRepo),
  deleteEpisode: () => new DeleteEpisodeUseCase(episodesRepo),
  updateEpisode: () => new UpdateEpisodeUseCase(episodesRepo),
  setEpisodeWatchState: () =>
    new SetEpisodeWatchStateUseCase(
      episodesRepo,
      seasonsRepo,
      seriesRepo,
      videosRepo,
      watchListRepo,
      continueWatchingRepo
    ),

  // Videos
  getVideoById: () => new FindVideoByIdUseCase(videosRepo),
  getVideoByEpisodeId: () => new FindVideoByEpisodeIdUseCase(videosRepo),
  updateVideo: () => new UpdateVideoUseCase(videosRepo),
  addVideoAsEpisode: () => new CreateVideoAsEpisodeUseCase(videosRepo),

  // Playlists

  // ContinueWatching
  addVideoToContinueWatching: () => new AddVideoUseCase(continueWatchingRepo),
  removeVideoFromContinueWatching: () =>
    new DeleteUseCase(continueWatchingRepo),
  removeAllFromContinueWatching: () =>
    new DeleteAllUseCase(continueWatchingRepo),
  getCurrentContinueWatchingEpisode: () =>
    new GetCurrentEpisodeUseCase(continueWatchingRepo),
  getContinueWatchingVideos: () => new GetVideosUseCase(continueWatchingRepo),

  // MyLists

  // WatchLists
};
