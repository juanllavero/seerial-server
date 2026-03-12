//#region IMPORTS
import { AddArtistToAlbumUseCase } from '@/api/v1/albums/application/usecases/AddArtistToAlbumUseCase';
import { CreateAlbumUseCase } from '@/api/v1/albums/application/usecases/CreateAlbumUseCase';
import { DeleteAlbumUseCase } from '@/api/v1/albums/application/usecases/DeleteAlbumUseCase';
import { FindAlbumByIdUseCase } from '@/api/v1/albums/application/usecases/FindAlbumByIdUseCase';
import { FindAllAlbumsUseCase } from '@/api/v1/albums/application/usecases/FindAllAlbumsUseCase';
import { UpdateAlbumUseCase } from '@/api/v1/albums/application/usecases/UpdateAlbumUseCase';
import { AlbumsRepositoryImpl } from '@/api/v1/albums/infrastructure/persistence/repositories/AlbumsRepositoryImpl';
import { AddArtistUseCase } from '@/api/v1/artists/application/usecases/AddArtistUseCase';
import { DeleteArtistUseCase } from '@/api/v1/artists/application/usecases/DeleteArtistUseCase';
import { GetArtistByIdUseCase } from '@/api/v1/artists/application/usecases/GetArtistByIdUseCase';
import { UpdateArtistUseCase } from '@/api/v1/artists/application/usecases/UpdateArtistUseCase';
import { ArtistsRepositoryImpl } from '@/api/v1/artists/infrastructure/persistence/repositories/ArtistsRepositoryImpl';
import { AddAlbumToCollectionUseCase } from '@/api/v1/collections/application/usecases/AddAlbumToCollectionUseCase';
import { AddLibraryToCollectionUseCase } from '@/api/v1/collections/application/usecases/AddLibraryUseCase';
import { CreateCollectionUseCase } from '@/api/v1/collections/application/usecases/CreateCollectionUseCase';
import { DeleteCollectionUseCase } from '@/api/v1/collections/application/usecases/DeleteCollectionUseCase';
import { FindCollectionByIdUseCase } from '@/api/v1/collections/application/usecases/FindCollectionByIdUseCase';
import { FindCollectionsInLibraryUseCase } from '@/api/v1/collections/application/usecases/FindCollectionsInLibraryUseCase';
import { GetMusicExtrasUseCase } from '@/api/v1/collections/application/usecases/GetMusicExtrasUseCase';
import { ReorderCollectionItemsUseCase } from '@/api/v1/collections/application/usecases/ReorderCollectionItemsUseCase';
import { UpdateCollectionUseCase } from '@/api/v1/collections/application/usecases/UpdateCollectionUseCase';
import { CollectionsRepositoryImpl } from '@/api/v1/collections/infrastructure/persistence/repositories/CollectionsRepositoryImpl';
import { AddVideoUseCase } from '@/api/v1/continue-watching/application/usecases/AddVideoUseCase';
import { DeleteAllUseCase } from '@/api/v1/continue-watching/application/usecases/DeleteAllUseCase';
import { DeleteUseCase } from '@/api/v1/continue-watching/application/usecases/DeleteUseCase';
import { GetCurrentEpisodeUseCase } from '@/api/v1/continue-watching/application/usecases/GetCurrentEpisodeUseCase';
import { GetVideosUseCase } from '@/api/v1/continue-watching/application/usecases/GetVideosUseCase';
import { ContinueWatchingRepositoryImpl } from '@/api/v1/continue-watching/infrastructure/persistence/repositories/ContinueWatchingRepositoryImpl';
import { CreateEpisodeUseCase } from '@/api/v1/episodes/application/usecases/CreateEpisodeUseCase';
import { DeleteEpisodeUseCase } from '@/api/v1/episodes/application/usecases/DeleteEpisodeUseCase';
import { FindEpisodeByIdUseCase } from '@/api/v1/episodes/application/usecases/FindEpisodeByIdUseCase';
import { FindEpisodeByPathUseCase } from '@/api/v1/episodes/application/usecases/FindEpisodeByPathUseCase';
import { FindEpisodesBySeasonIdUseCase } from '@/api/v1/episodes/application/usecases/FindEpisodesBySeasonIdUseCase';
import { SetEpisodeWatchStateUseCase } from '@/api/v1/episodes/application/usecases/SetEpisodeWatchStateUseCase';
import { UpdateEpisodeUseCase } from '@/api/v1/episodes/application/usecases/UpdateEpisodeUseCase';
import { EpisodeRepositoryImpl } from '@/api/v1/episodes/infrastructure/persistence/repositories/EpisodeRepositoryImpl';
import { DeleteLibraryUseCase } from '@/api/v1/libraries/application/usecases/DeleteLibraryUseCase';
import { AddAnalyzedFileUseCase } from '@/api/v1/libraries/application/usecases/files/AddAnalyzedFileUseCase';
import { RemoveAnalyzedFileUseCase } from '@/api/v1/libraries/application/usecases/files/RemoveAnalyzedFileUseCase';
import { AddAnalyzedFolderUseCase } from '@/api/v1/libraries/application/usecases/folders/AddAnalyzedFolderUseCase';
import { RemoveAnalyzedFolderUseCase } from '@/api/v1/libraries/application/usecases/folders/RemoveAnalyzedFolderUseCase';
import { GetLibrariesUseCase } from '@/api/v1/libraries/application/usecases/GetLibrariesUseCase';
import { GetLibraryByVideoIdUseCase } from '@/api/v1/libraries/application/usecases/GetLibraryByVideoIdUseCase';
import { GetLibraryContentUseCase } from '@/api/v1/libraries/application/usecases/GetLibraryContentUseCase';
import { GetLibraryUseCase } from '@/api/v1/libraries/application/usecases/GetLibraryUseCase';
import { ReorderLibrariesUseCase } from '@/api/v1/libraries/application/usecases/ReorderLibrariesUseCase';
import { ReorderLibraryItemsUseCase } from '@/api/v1/libraries/application/usecases/ReorderLibraryItemsUseCase';
import { ScanLibraryUseCase } from '@/api/v1/libraries/application/usecases/ScanLibraryUseCase';
import { UpdateLibraryUseCase } from '@/api/v1/libraries/application/usecases/UpdateLibraryUseCase';
import { LibrariesRepositoryImpl } from '@/api/v1/libraries/infrastructure/persistence/repositories/LibrariesRepositoryImpl';
import { DeleteMovieDataUseCase } from '@/api/v1/movies/application/usecases/DeleteMovieDataUseCase';
import { DeleteMovieUseCase } from '@/api/v1/movies/application/usecases/DeleteMovieUseCase';
import { FindMovieByIdUseCase } from '@/api/v1/movies/application/usecases/FindMovieByIdUseCase';
import { FindMovieByPathUseCase } from '@/api/v1/movies/application/usecases/FindMovieByPathUseCase';
import { RefreshMovieMetadataUseCase } from '@/api/v1/movies/application/usecases/RefreshMovieMetadataUseCase';
import { ScanMovieUseCase } from '@/api/v1/movies/application/usecases/ScanMovieUseCase';
import { SearchMovieMetadataUseCase } from '@/api/v1/movies/application/usecases/SearchMovieMetadataUseCase';
import { UpdateMovieIdUseCase } from '@/api/v1/movies/application/usecases/UpdateMovieIdUseCase';
import { UpdateMovieMetadataUseCase } from '@/api/v1/movies/application/usecases/UpdateMovieMetadataUseCase';
import { UpdateMovieUseCase } from '@/api/v1/movies/application/usecases/UpdateMoviesUseCase';
import { MoviesRepositoryImpl } from '@/api/v1/movies/infrastructure/persistence/repositories/MoviesRepositoryImpl';
import { AddMovieToMyListUseCase } from '@/api/v1/my-lists/application/usecases/AddMovieToMyListUseCase';
import { AddSeriesToMyListUseCase } from '@/api/v1/my-lists/application/usecases/AddSeriesToMyListUseCase';
import { GetMoviesFromMyListUseCase } from '@/api/v1/my-lists/application/usecases/GetMoviesFromMyListUseCase';
import { GetSeriesFromMyListUseCase } from '@/api/v1/my-lists/application/usecases/GetSeriesFromMyListUseCase';
import { IsMovieInMyListUseCase } from '@/api/v1/my-lists/application/usecases/IsMovieInMyListUseCase';
import { IsSeriesInMyListUseCase } from '@/api/v1/my-lists/application/usecases/IsSeriesInMyListUseCase';
import { RemoveMovieFromMyListUseCase } from '@/api/v1/my-lists/application/usecases/RemoveMovieFromMyListUseCase';
import { RemoveSeriesFromMyListUseCase } from '@/api/v1/my-lists/application/usecases/RemoveSeriesFromMyListUseCase';
import { MyListRepositoryImpl } from '@/api/v1/my-lists/infrastructure/persistence/repositories/MyListRepositoryImpl';
import { AddSongToPlayListUseCase } from '@/api/v1/playlists/application/usecases/AddSongToPlayListUseCase';
import { CreatePlayListUseCase } from '@/api/v1/playlists/application/usecases/CreatePlayListUseCase';
import { DeletePlayListUseCase } from '@/api/v1/playlists/application/usecases/DeletePlayListUseCase';
import { FindAllPlayListsUseCase } from '@/api/v1/playlists/application/usecases/FindAllPlayListsUseCase';
import { FindPlayListByIdUseCase } from '@/api/v1/playlists/application/usecases/FindPlayListByIdUseCase';
import { RemoveSongFromPlayListUseCase } from '@/api/v1/playlists/application/usecases/RemoveSongFromPlayListUseCase';
import { UpdatePlayListUseCase } from '@/api/v1/playlists/application/usecases/UpdatePlayListUseCase';
import { PlayListRepositoryImpl } from '@/api/v1/playlists/infrastructure/persistence/repositories/PlayListRepositoryImpl';
import { CreateSeasonUseCase } from '@/api/v1/seasons/application/usecases/CreateSeasonUseCase';
import { DeleteSeasonDataUseCase } from '@/api/v1/seasons/application/usecases/DeleteSeasonDataUseCase';
import { DeleteSeasonUseCase } from '@/api/v1/seasons/application/usecases/DeleteSeasonsUseCase';
import { FindAllSeasonsUseCase } from '@/api/v1/seasons/application/usecases/FindAllSeasonsUseCase';
import { FindSeasonByIdUseCase } from '@/api/v1/seasons/application/usecases/FindSeasonByIdUseCase';
import { FindSeasonsBySeriesIdUseCase } from '@/api/v1/seasons/application/usecases/FindSeasonsBySeriesIdUseCase';
import { UpdateSeasonUseCase } from '@/api/v1/seasons/application/usecases/UpdateSeasonsUseCase';
import { SeasonsRepositoryImpl } from '@/api/v1/seasons/infrastructure/persistence/repositories/SeasonsRepositoryImpl';
import { CreateSeriesUseCase } from '@/api/v1/series/application/usecases/CreateSeriesUseCase';
import { DeleteSeriesDataUseCase } from '@/api/v1/series/application/usecases/DeleteSeriesDataUseCase';
import { DeleteSeriesUseCase } from '@/api/v1/series/application/usecases/DeleteSeriesUseCase';
import { FindSeriesByIdUseCase } from '@/api/v1/series/application/usecases/FindSeriesByIdUseCase';
import { ProcessEpisodeUseCase } from '@/api/v1/series/application/usecases/ProcessEpisodeUseCase';
import { RefreshMetadataUseCase } from '@/api/v1/series/application/usecases/RefreshMetadataUseCase';
import { ScanSeriesUseCase } from '@/api/v1/series/application/usecases/ScanSeriesUseCase';
import { UpdateEpisodeGroupUseCase } from '@/api/v1/series/application/usecases/UpdateEpisodeGroupUseCase';
import { UpdateSeriesMetadataUseCase } from '@/api/v1/series/application/usecases/UpdateSeriesMetadataUseCase';
import { UpdateSeriesUseCase } from '@/api/v1/series/application/usecases/UpdateSeriesUseCase';
import { UpdateShowIdUseCase } from '@/api/v1/series/application/usecases/UpdateShowIdUseCase';
import { SeriesRepositoryImpl } from '@/api/v1/series/infrastructure/persistence/repositories/SeriesRepositoryImpl';
import { CreateServerUseCase } from '@/api/v1/servers/application/usecases/CreateServerUseCase';
import { GetServerUseCase } from '@/api/v1/servers/application/usecases/GetServerUseCase';
import { UpdateServerUseCase } from '@/api/v1/servers/application/usecases/UpdateServerUseCase';
import { ServersRepositoryImpl } from '@/api/v1/servers/infrastructure/persistence/repositories/ServersRepositoryImpl';
import { CreateSongUseCase } from '@/api/v1/songs/application/usecases/CreateSongUseCase';
import { DeleteSongUseCase } from '@/api/v1/songs/application/usecases/DeleteSongUseCase';
import { FindSongByIdUseCase } from '@/api/v1/songs/application/usecases/FindSongByIdUseCase';
import { FindSongByPathUseCase } from '@/api/v1/songs/application/usecases/FindSongByPathUseCase';
import { FindSongsByAlbumIdUseCase } from '@/api/v1/songs/application/usecases/FindSongsByAlbumIdUseCase';
import { ScanMusicUseCase } from '@/api/v1/songs/application/usecases/ScanSongsUseCase';
import { UpdateSongUseCase } from '@/api/v1/songs/application/usecases/UpdateSongUseCase';
import { SongsRepositoryImpl } from '@/api/v1/songs/infrastructure/persistence/repositories/SongsRepositoryImpl';
import { AuthenticateUserUseCase } from '@/api/v1/users/application/usecases/AuthenticateUserUseCase';
import { CreateUserUseCase } from '@/api/v1/users/application/usecases/CreateUserUseCase';
import { DeleteUserUseCase } from '@/api/v1/users/application/usecases/DeleteUserUseCase';
import { GetAllUsersUseCase } from '@/api/v1/users/application/usecases/GetAllUsersUseCase';
import { UpdateUserUseCase } from '@/api/v1/users/application/usecases/UpdateUserUseCase';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { CreateVideoAsEpisodeUseCase } from '@/api/v1/videos/application/usecases/CreateVideoAsEpisodeUseCase';
import { DeleteVideoDataUseCase } from '@/api/v1/videos/application/usecases/DeleteVideoDataUseCase';
import { DeleteVideoUseCase } from '@/api/v1/videos/application/usecases/DeleteVideoUseCase';
import { FindVideoByEpisodeIdUseCase } from '@/api/v1/videos/application/usecases/FindVideoByEpisodeIdUseCase';
import { FindVideoByIdUseCase } from '@/api/v1/videos/application/usecases/FindVideoByIdUseCase';
import { FindVideoByMovieIdUseCase } from '@/api/v1/videos/application/usecases/FindVideoByMovieIdUseCase';
import { FindVideoByPathUseCase } from '@/api/v1/videos/application/usecases/FindVideoByPathUseCase';
import { UpdateMediaInfoUseCase } from '@/api/v1/videos/application/usecases/UpdateMediaInfoUseCase';
import { UpdateVideoUseCase } from '@/api/v1/videos/application/usecases/UpdateVideosUseCase';
import { VideosRepositoryImpl } from '@/api/v1/videos/infrastructure/persistence/repositories/VideosRepositoryImpl';
import { VideoExtractionServiceImpl } from '@/api/v1/videos/infrastructure/services/VideoExtractionServiceImpl';
import { AddMovieToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddMovieToWatchListUseCase';
import { AddSeasonToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddSeasonToWatchListUseCase';
import { AddSeriesToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddSeriesToWatchListUseCase';
import { AddVideoToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddVideoToWatchListUseCase';
import { RemoveMovieFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveMovieFromWatchListUseCase';
import { RemoveSeasonFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveSeasonFromWatchListUseCase';
import { RemoveSeriesFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveSeriesFromWatchListUseCase';
import { RemoveVideoFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveVideoFromWatchListUseCase';
import { UpdateWatchStateUseCase } from '@/api/v1/watch-lists/application/usecases/UpdateWatchStateUseCase';
import { WatchListRepositoryImpl } from '@/api/v1/watch-lists/infrastructure/persistence/repositories/WatchListRepositoryImpl';
import { AudioProcessingServiceImpl } from '../../../../songs/infrastructure/services/AudioProcessingServiceImpl';
import { VideoProcessingServiceImpl } from '../../../../videos/infrastructure/services/VideoProcessingServiceImpl';
import { ExternalSearchService } from '../../services/ExternalSearchService';
import { DownloaderServiceImpl } from '../downloader/DownloaderServiceImpl';
import { FileSystemServiceImpl } from '../filesystem/FileSystemServiceImpl';
import { ImageProcessingServiceImpl } from '../image-processing/ImageProcessingServiceImpl';
import { IMDBScoreServiceImpl } from '../imdb-score/IMDBScoreServiceImpl';
import { MediaInfoServiceImpl } from '../media-info/MediaInfoServiceImpl';
import { MetadataProviderImpl } from '../metadata/MetadataProviderImpl';
import { TMDbApiClient } from '../metadata/TMDbApiClient';
import { NotificationServiceImpl } from '../notification/NotificationServiceImpl';

//#endregion

// Services
export const imdbScoreService = new IMDBScoreServiceImpl();
export const videoExtractionService = new VideoExtractionServiceImpl();
export const fileSystemService = new FileSystemServiceImpl();
export const mediaInfoService = new MediaInfoServiceImpl();
export const audioProcessingService = new AudioProcessingServiceImpl();
export const notificationService = new NotificationServiceImpl();
export const downloaderService = new DownloaderServiceImpl();
export const externalSearchService = new ExternalSearchService();
export const videoProcessingService = new VideoProcessingServiceImpl();
export const imageProcessingService = new ImageProcessingServiceImpl(fileSystemService);

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
export const playlistRepo = new PlayListRepositoryImpl();
export const serversRepo = new ServersRepositoryImpl();
export const usersRepo = new UsersRepositoryImpl();

// Use cases factories
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
  deleteLibrary: () => new DeleteLibraryUseCase(librariesRepo, seriesRepo, moviesRepo, albumsRepo),
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
  getAllCollectionsInLibrary: () => new FindCollectionsInLibraryUseCase(collectionsRepo),
  getCollectionById: () => new FindCollectionByIdUseCase(collectionsRepo),
  addCollection: () => new CreateCollectionUseCase(collectionsRepo),
  deleteCollection: () => new DeleteCollectionUseCase(collectionsRepo),
  updateCollection: () => new UpdateCollectionUseCase(collectionsRepo),
  getMusicExtras: () => new GetMusicExtrasUseCase(),
  reorderCollectionItems: () => new ReorderCollectionItemsUseCase(collectionsRepo),
  addLibraryToCollection: () => new AddLibraryToCollectionUseCase(collectionsRepo),
  addAlbumToCollection: () => new AddAlbumToCollectionUseCase(collectionsRepo),

  // Series
  getSeriesById: () => new FindSeriesByIdUseCase(seriesRepo),
  createSeries: () => new CreateSeriesUseCase(seriesRepo),
  updateSeries: () => new UpdateSeriesUseCase(seriesRepo),
  deleteSeries: () => new DeleteSeriesUseCase(seriesRepo),
  deleteSeriesData: () => new DeleteSeriesDataUseCase(),

  processEpisode: () => new ProcessEpisodeUseCase(mediaInfoService),
  refreshSeriesMetadata: () => new RefreshMetadataUseCase(metadataProvider),
  scanSeries: () =>
    new ScanSeriesUseCase(
      fileSystemService,
      librariesRepo,
      seriesRepo,
      seasonsRepo,
      videosRepo,
      episodesRepo,
      metadataProvider,
      notificationService,
    ),
  updateSeriesMetadata: () => new UpdateSeriesMetadataUseCase(seriesRepo),
  updateShowId: () => new UpdateShowIdUseCase(),
  updateEpisodeGroup: () => new UpdateEpisodeGroupUseCase(),

  // Seasons
  getSeasonsBySeriesId: () => new FindSeasonsBySeriesIdUseCase(seasonsRepo),
  createSeason: () => new CreateSeasonUseCase(seasonsRepo),
  getSeasonById: () => new FindSeasonByIdUseCase(seasonsRepo),
  getSeasons: () => new FindAllSeasonsUseCase(seasonsRepo),
  updateSeason: () => new UpdateSeasonUseCase(seasonsRepo),
  deleteSeason: () => new DeleteSeasonUseCase(seasonsRepo),
  deleteSeasonData: () => new DeleteSeasonDataUseCase(seasonsRepo),

  // Movies
  getMoviebyId: () => new FindMovieByIdUseCase(moviesRepo),
  getMovieByPath: () => new FindMovieByPathUseCase(moviesRepo),
  updateMovie: () => new UpdateMovieUseCase(moviesRepo),
  deleteMovie: () => new DeleteMovieUseCase(librariesRepo, moviesRepo),
  deleteMovieData: () => new DeleteMovieDataUseCase(),

  updateMovieMetadata: () =>
    new UpdateMovieMetadataUseCase(metadataProvider, moviesRepo, fileSystemService),
  searchMovieMetadata: () => new SearchMovieMetadataUseCase(),
  refreshMovieMetadata: () => new RefreshMovieMetadataUseCase(),
  scanMovie: () =>
    new ScanMovieUseCase(
      fileSystemService,
      librariesRepo,
      moviesRepo,
      videosRepo,
      collectionsRepo,
      metadataProvider,
      notificationService,
    ),
  updateMovieId: () => new UpdateMovieIdUseCase(),

  // Albums
  getAlbums: () => new FindAllAlbumsUseCase(albumsRepo),
  getAlbumById: () => new FindAlbumByIdUseCase(albumsRepo),
  createAlbum: () => new CreateAlbumUseCase(albumsRepo),
  deleteAlbum: () => new DeleteAlbumUseCase(albumsRepo),
  updateAlbum: () => new UpdateAlbumUseCase(albumsRepo),
  addArtistToAlbum: () => new AddArtistToAlbumUseCase(albumsRepo),

  // Artists
  addArtist: () => new AddArtistUseCase(artistsRepo),
  getArtistById: () => new GetArtistByIdUseCase(artistsRepo),
  deleteArtist: () => new DeleteArtistUseCase(artistsRepo),
  updateArtist: () => new UpdateArtistUseCase(artistsRepo),

  // Songs
  getSongById: () => new FindSongByIdUseCase(songsRepo),
  getSongsByAlbum: () => new FindSongsByAlbumIdUseCase(songsRepo),
  getSongByPath: () => new FindSongByPathUseCase(songsRepo),
  createSong: () => new CreateSongUseCase(songsRepo),
  deleteSong: () => new DeleteSongUseCase(songsRepo),
  updateSong: () => new UpdateSongUseCase(songsRepo),
  scanMusic: () =>
    new ScanMusicUseCase(
      fileSystemService,
      librariesRepo,
      albumsRepo,
      songsRepo,
      artistsRepo,
      collectionsRepo,
      notificationService,
    ),

  // Episodes
  getEpisodesBySeasonId: () => new FindEpisodesBySeasonIdUseCase(episodesRepo),
  createEpisode: () => new CreateEpisodeUseCase(episodesRepo),
  getEpisodeById: () => new FindEpisodeByIdUseCase(episodesRepo),
  getEpisodeByPath: () => new FindEpisodeByPathUseCase(episodesRepo),
  updateEpisode: () => new UpdateEpisodeUseCase(episodesRepo),
  deleteEpisode: () => new DeleteEpisodeUseCase(episodesRepo),

  setEpisodeWatchState: () =>
    new SetEpisodeWatchStateUseCase(
      episodesRepo,
      seasonsRepo,
      seriesRepo,
      videosRepo,
      watchListRepo,
      continueWatchingRepo,
    ),

  // Videos
  getVideoByPath: () => new FindVideoByPathUseCase(videosRepo),
  getVideoById: () => new FindVideoByIdUseCase(videosRepo),
  getVideoByEpisodeId: () => new FindVideoByEpisodeIdUseCase(videosRepo),
  getVideoByMovieId: () => new FindVideoByMovieIdUseCase(videosRepo),
  updateVideo: () => new UpdateVideoUseCase(videosRepo),
  updateMediaInfo: () => new UpdateMediaInfoUseCase(videosRepo),
  addVideoAsEpisode: () => new CreateVideoAsEpisodeUseCase(videosRepo),
  deleteVideo: () => new DeleteVideoUseCase(videosRepo, librariesRepo),
  deleteVideoData: () => new DeleteVideoDataUseCase(fileSystemService),

  // Playlists
  getPlayLists: () => new FindAllPlayListsUseCase(playlistRepo),
  getPlayListById: () => new FindPlayListByIdUseCase(playlistRepo),
  createPlayList: () => new CreatePlayListUseCase(playlistRepo),
  updatePlayList: () => new UpdatePlayListUseCase(playlistRepo),
  deletePlayList: () => new DeletePlayListUseCase(playlistRepo),
  addSongToPlayList: () => new AddSongToPlayListUseCase(playlistRepo),
  removeSongFromPlayList: () => new RemoveSongFromPlayListUseCase(playlistRepo),

  // ContinueWatching
  addVideoToContinueWatching: () => new AddVideoUseCase(continueWatchingRepo),
  removeVideoFromContinueWatching: () => new DeleteUseCase(continueWatchingRepo),
  removeAllFromContinueWatching: () => new DeleteAllUseCase(continueWatchingRepo),
  getCurrentContinueWatchingEpisode: () => new GetCurrentEpisodeUseCase(continueWatchingRepo),
  getContinueWatchingVideos: () => new GetVideosUseCase(continueWatchingRepo),

  // MyLists
  addMovieToMyList: () => new AddMovieToMyListUseCase(myListRepo),
  removeMovieFromMyList: () => new RemoveMovieFromMyListUseCase(myListRepo),
  getMoviesFromMyList: () => new GetMoviesFromMyListUseCase(myListRepo),

  addSeriesToMyList: () => new AddSeriesToMyListUseCase(myListRepo),
  removeSeriesFromMyList: () => new RemoveSeriesFromMyListUseCase(myListRepo),
  getSeriesFromMyList: () => new GetSeriesFromMyListUseCase(myListRepo),

  isMovieInMyList: () => new IsMovieInMyListUseCase(myListRepo),
  isSeriesInMyList: () => new IsSeriesInMyListUseCase(myListRepo),

  // WatchLists
  addVideoToWatchList: () => new AddVideoToWatchListUseCase(watchListRepo),
  removeVideoFromWatchList: () => new RemoveVideoFromWatchListUseCase(watchListRepo),
  addMovieToWatchList: () => new AddMovieToWatchListUseCase(watchListRepo),
  removeMovieFromWatchList: () => new RemoveMovieFromWatchListUseCase(watchListRepo),
  addSeasonToWatchList: () => new AddSeasonToWatchListUseCase(watchListRepo),
  removeSeasonFromWatchList: () => new RemoveSeasonFromWatchListUseCase(watchListRepo),
  addSeriesToWatchList: () => new AddSeriesToWatchListUseCase(watchListRepo),
  removeSeriesFromWatchList: () => new RemoveSeriesFromWatchListUseCase(watchListRepo),
  updateWatchStateUseCase: () => new UpdateWatchStateUseCase(watchListRepo),
};
