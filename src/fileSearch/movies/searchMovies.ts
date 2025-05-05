import fs from 'fs-extra';
import { MovieResponse } from 'moviedb-promise';
import { Collection } from '../../data/models/Collections/Collection.model';
import { Movie } from '../../data/models/Media/Movie.model';
import { Series } from '../../data/models/Media/Series.model';
import { Video } from '../../data/models/Media/Video.model';
import { getVideoById } from '../../db/get/getData';
import { addVideoAsMovie } from '../../db/post/postData';
import { MovieDBWrapper } from '../../theMovieDB/MovieDB';
import { FilesManager } from '../../utils/FilesManager';
import { IMDBScores } from '../../utils/IMDBScores';
import { Utils } from '../../utils/Utils';
import { WebSocketManager } from '../../WebSockets/WebSocketManager';
import { FileSearch } from '../FileSearch';

export async function scanMovie(root: string, wsManager: WebSocketManager) {
  if (!FileSearch.library) return;

  if (!(await Utils.isFolder(root))) {
    //#region MOVIE FILE ONLY
    if (!Utils.isVideoFile(root)) return;

    const fileFullName = Utils.getFileName(root);
    const nameAndYear = Utils.extractNameAndYear(fileFullName);

    let name = nameAndYear[0];
    let year = nameAndYear[1];

    const movieMetadata = await searchMovie(name, year);

    let show = new Series();
    show.name = name;
    show.folder = root;
    show.analyzingFiles = true;
    FileSearch.library.analyzedFolders.set(root, show.id);

    // Add show to view
    Utils.addSeries(wsManager, FileSearch.library.id, show);

    let movie = new movie();
    FileSearch.library.analyzedFolders.set(root, movie.id);
    movie.setSeriesID(show.id);
    movie.setFolder(root);
    show.addSeason(movie);

    if (movieMetadata) {
      await setSeasonMetadata(show, movie, movieMetadata, name, year);
    } else {
      //Save movie without metadata
      movie.setName(name);
      movie.setYear(year !== '1' ? year : '');
      movie.setSeasonNumber(show.seasons.length);

      // Add movie to view
      Utils.addSeason(wsManager, FileSearch.library.id, movie);

      saveMovieWithoutMetadata(movie, root, wsManager);
      FileSearch.library.getSeries().push(show);
      return;
    }

    // Add movie to view
    Utils.addSeason(wsManager, FileSearch.library.id, movie);

    await processMovie(movie, root, wsManager);

    show.analyzingFiles = false;
    FileSearch.library.series.push(show);
    //#endregion

    // Update show in view
    Utils.updateSeries(wsManager, FileSearch.library.id, show);
  } else {
    let show: Series | null;

    //let exists: boolean = false;
    if (FileSearch.library.analyzedFolders.get(root)) {
      show = FileSearch.library.getSeriesById(
        FileSearch.library.analyzedFolders.get(root) ?? ''
      );

      if (show === null) return;

      //exists = true;
    } else {
      show = new Series();
      show.setFolder(root);
      FileSearch.library.analyzedFolders.set(root, show.id);
    }

    show.analyzingFiles = true;

    // Add show to view
    Utils.addSeries(wsManager, FileSearch.library.id, show);

    const filesInDir = await Utils.getFilesInFolder(root);
    const folders: string[] = [];
    const filesInRoot: string[] = [];

    for (const file of filesInDir) {
      const filePath = `${root}/${file.name}`;
      if (await Utils.isFolder(filePath)) {
        folders.push(filePath);
      } else {
        if (Utils.isVideoFile(filePath)) filesInRoot.push(filePath);
      }
    }

    if (folders.length > 0) {
      //#region FOLDERS CORRESPONDING DIFFERENT MOVIES FROM A COLLECTION
      show.isCollection = true;

      const fileFullName = Utils.getFileName(root);

      show.setName(fileFullName);
      show.setFolder(root);
      FileSearch.library.analyzedFolders.set(root, show.id);

      const processPromises = folders.map(async (folder) => {
        const fileFullName = Utils.getFileName(folder);
        const nameAndYear = Utils.extractNameAndYear(fileFullName);

        let name = nameAndYear[0];
        let year = nameAndYear[1];

        const movieMetadata = await searchMovie(name, year);

        let movie = new movie();
        FileSearch.library.analyzedFolders.set(folder, movie.id);
        movie.setSeriesID(show.id);
        movie.setFolder(folder);
        show.addSeason(movie);

        const files = await Utils.getValidVideoFiles(folder);

        if (movieMetadata) {
          await setSeasonMetadata(show, movie, movieMetadata, name, year);
        } else {
          //Save videos without metadata
          movie.setName(name);
          movie.setYear(year !== '1' ? year : '');
          movie.setSeasonNumber(show.seasons.length);

          // Add movie to view
          Utils.addSeason(wsManager, FileSearch.library.id, movie);

          const processPromises = files.map(async (file) => {
            await saveMovieWithoutMetadata(movie, file, wsManager);
          });

          await Promise.all(processPromises);

          show.analyzingFiles = false;
          FileSearch.library.getSeries().push(show);

          // Update show in view
          Utils.updateSeries(wsManager, FileSearch.library.id, show);

          return;
        }

        // Add movie to view
        Utils.addSeason(wsManager, FileSearch.library.id, movie);

        const processPromises = files.map(async (file) => {
          await processMovie(movie, file, wsManager);
        });

        await Promise.all(processPromises);
      });

      await Promise.all(processPromises);
      FileSearch.library.series.push(show);
      //#endregion
    } else {
      //#region MOVIE FILE/CONCERT FILES INSIDE FOLDER
      const fileFullName = Utils.getFileName(root);
      const nameAndYear = Utils.extractNameAndYear(fileFullName);

      let name = nameAndYear[0];
      let year = nameAndYear[1];

      const movieMetadata = await searchMovie(name, year);

      show.setName(name);
      show.setFolder(root);
      FileSearch.library.analyzedFolders.set(root, show.id);

      let movie = new movie();
      FileSearch.library.analyzedFolders.set(root, movie.id);
      movie.setSeriesID(show.id);
      movie.setFolder(root);
      show.addSeason(movie);

      if (movieMetadata) {
        await setMovieMetadata(show, movie, movieMetadata, name, year);
      } else {
        //Save videos without metadata
        movie.setName(name);
        movie.setYear(year !== '1' ? year : '');
        movie.setSeasonNumber(show.seasons.length);

        // Add movie to view
        Utils.addSeason(wsManager, FileSearch.library.id, movie);

        const processPromises = filesInRoot.map(async (file) => {
          await saveMovieWithoutMetadata(movie, file, wsManager);
        });

        await Promise.all(processPromises);

        show.analyzingFiles = false;
        show.libraryId = FileSearch.library.id;

        // Update show in view
        Utils.updateSeries(wsManager, FileSearch.library.id, show);
        return;
      }

      // Add movie to view
      Utils.addSeason(wsManager, FileSearch.library.id, movie);

      const processPromises = filesInRoot.map(async (file) => {
        await processMovie(movie, file, wsManager);
      });

      await Promise.all(processPromises);
      show.libraryId = FileSearch.library.id;
      //#endregion
    }

    show.analyzingFiles = false;

    // Update show in view
    Utils.updateSeries(wsManager, FileSearch.library.id, show);
  }
}

export async function searchMovie(name: string, year: string) {
  const moviesSearch = await MovieDBWrapper.searchMovies(name, year, 1);

  return moviesSearch && moviesSearch.length > 0
    ? await MovieDBWrapper.getMovie(moviesSearch[0].id ?? 0)
    : undefined;
}

export async function setMovieMetadata(
  movie: Movie,
  movieMetadata: MovieResponse,
  name: string,
  year: string,
  collection?: Collection
) {
  movie.name = !movie.nameLock ? movieMetadata.title ?? name : name;
  movie.year = !movie.yearLock ? movieMetadata.release_date ?? year : year;
  movie.overview = !movie.overviewLock ? movieMetadata.overview ?? '' : '';
  movie.tagline = !movie.taglineLock ? movieMetadata.tagline ?? '' : '';
  movie.themdbId = movieMetadata.id ?? -1;
  movie.imdbId = movieMetadata.imdb_id ?? '-1';
  movie.score = movieMetadata.vote_average
    ? (movieMetadata.vote_average * 10) / 10
    : 0;
  movie.genres =
    movie.genresLock && movie.genres
      ? movie.genres
      : movieMetadata.genres
      ? movieMetadata.genres.map((genre) => genre.name ?? '')
      : [];
  movie.productionStudios = movie.productionStudiosLock
    ? movie.productionStudios
    : movieMetadata.production_companies
    ? movieMetadata.production_companies.map((company) => company.name ?? '')
    : [];

  // Get IMDB Score for Movie
  movie.imdbScore = await IMDBScores.getIMDBScore(movie.imdbId);

  //#region GET TAGS
  const credits = await MovieDBWrapper.getMovieCredits(movie.imdbId);

  if (credits) {
    if (credits.crew) {
      if (!movie.directedByLock && movie.directedBy) {
        movie.directedBy.splice(0, movie.directedBy.length);
        for (const person of credits.crew) {
          if (person.name && person.job === 'Director' && movie.directedBy)
            movie?.directedBy.push(person.name);
        }
      }

      if (!movie.writtenByLock && movie.writtenBy) {
        movie.writtenBy.splice(0, movie.writtenBy.length);
        for (const person of credits.crew) {
          if (person.name && person.job === 'Writer' && movie.writtenBy)
            movie?.writtenBy.push(person.name);
        }
      }

      if (!movie.creatorLock && movie.creator && movie.creator.length > 0)
        movie.creator.splice(0, movie.creator.length);

      if (
        !movie.musicComposerLock &&
        movie.musicComposer &&
        movie.musicComposer.length > 0
      )
        movie.musicComposer.splice(0, movie.musicComposer.length);

      for (const person of credits.crew) {
        if (
          !movie.creatorLock &&
          person.job &&
          (person.job === 'Author' ||
            person.job === 'Novel' ||
            person.job === 'Original Series Creator' ||
            person.job === 'Comic Book' ||
            person.job === 'Idea' ||
            person.job === 'Original Story' ||
            person.job === 'Story' ||
            person.job === 'Story by' ||
            person.job === 'Book' ||
            person.job === 'Original Concept')
        )
          if (person.name && !movie.creatorLock && movie.creator)
            movie.creator.push(person.name);

        if (
          !movie.musicComposerLock &&
          person.job &&
          person.job === 'Original Music Composer'
        )
          if (person.name && !movie.musicComposerLock && movie.musicComposer)
            movie.musicComposer.push(person.name);
      }
    }

    if (credits.cast) {
      if (movie.cast && movie.cast.length > 0)
        movie.cast.splice(0, movie.cast.length);

      for (const person of credits.cast) {
        movie.cast?.push({
          name: person.name ?? '',
          character: person.character ?? '',
          profileImage: person.profile_path
            ? `${FileSearch.BASE_URL}${person.profile_path}`
            : '',
        });
      }
    }
  }
  //#endregion

  //#region IMAGES DOWNLOAD
  const images = await MovieDBWrapper.getMovieImages(movie.themdbId);

  if (images) {
    const logos = images.logos || [];
    const posters = images.posters || [];
    const backdrops = images.backdrops || [];

    // Create folders if they do not exist
    const outputLogosDir = FilesManager.getExternalPath(
      'resources/img/logos/' + movie.id
    );
    if (!fs.existsSync(outputLogosDir)) {
      fs.mkdirSync(outputLogosDir);
    }

    const outputPostersDir = FilesManager.getExternalPath(
      'resources/img/posters/' + movie.id
    );
    if (!fs.existsSync(outputPostersDir)) {
      fs.mkdirSync(outputPostersDir);
    }

    const outputPostersCollectionDir = FilesManager.getExternalPath(
      'resources/img/posters/' + collection?.id
    );

    if (collection) {
      if (!fs.existsSync(outputPostersCollectionDir)) {
        fs.mkdirSync(outputPostersCollectionDir);
      }
    }

    const outputImageDir = FilesManager.getExternalPath(
      'resources/img/backgrounds/' + movie.id
    );
    if (!fs.existsSync(outputImageDir)) {
      fs.mkdirSync(outputImageDir);
    }

    // Download backgrounds
    for (const backdrop of backdrops) {
      if (backdrop.file_path) {
        const backgroundUrl = `${FileSearch.BASE_URL}${backdrop.file_path}`;
        movie.backgroundsUrls = [...movie.backgroundsUrls, backgroundUrl];

        if (movie.backgroundSrc === '') {
          movie.backgroundSrc = backgroundUrl;
        }
      }
    }

    // Download logos
    for (const logo of logos) {
      if (logo.file_path) {
        const logoUrl = `${FileSearch.BASE_URL}${logo.file_path}`;
        movie.logosUrls = [...movie.logosUrls, logoUrl];

        if (movie.logoSrc === '') {
          movie.logoSrc = logoUrl;
        }
      }
    }

    // Download posters
    for (const poster of posters) {
      if (poster.file_path) {
        const posterUrl = `${FileSearch.BASE_URL}${poster.file_path}`;
        movie.coversUrls = [...movie.coversUrls, posterUrl];

        if (movie.coverSrc === '') {
          movie.coverSrc = posterUrl;
        }

        if (collection) {
          collection.coversUrls = [...collection.coversUrls, posterUrl];
          if (collection.coverSrc === '') {
            collection.coverSrc = posterUrl;
          }
        }
      }
    }
  }
  //#endregion
}

export async function saveMovieWithoutMetadata(
  movie: Movie,
  filePath: string,
  wsManager: WebSocketManager
) {
  let video = addVideoAsMovie(movie.id);

  if (!video || !FileSearch.library) return;

  video.movieId = movie.id;

  if (
    FileSearch.library.analyzedFiles.get(filePath) &&
    FileSearch.library.analyzedFiles.get(filePath) !== null
  ) {
    video = await getVideoById(
      FileSearch.library.analyzedFiles.get(filePath) ?? ''
    );
  }

  if (!video) return;

  video.fileSrc = filePath;
  video.imgSrc = 'resources/img/Default_video_thumbnail.jpg';

  // Add episode to view
  //Utils.addEpisode(wsManager, FileSearch.library.id, movie.seriesID, episode);
}

export async function processMovie(
  movie: Movie,
  filePath: string,
  wsManager: WebSocketManager
) {
  if (!FileSearch.library) return;

  let video: Video | null;

  if (
    FileSearch.library.analyzedFiles.get(filePath) &&
    FileSearch.library.analyzedFiles.get(filePath) !== null
  ) {
    video = await getVideoById(
      FileSearch.library.analyzedFiles.get(filePath) ?? ''
    );
  } else {
    video = new Video();
    video.movieId = movie.id;
    FileSearch.library.analyzedFiles.set(filePath, video.id);
    video.fileSrc = filePath;
  }

  if (!video) return;

  const images = await MovieDBWrapper.getMovieImages(movie.themdbId);

  let thumbnails = images?.backdrops || [];

  const outputDir = FilesManager.getExternalPath(
    'resources/img/thumbnails/video/' + video.id + '/'
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Download thumbnails
  for (const [index, thumbnail] of thumbnails.entries()) {
    if (thumbnail.file_path) {
      const url = `${FileSearch.BASE_URL}${thumbnail.file_path}`;
      video.imgUrls = [...video.imgUrls, url];

      if (index === 0) {
        video.imgSrc = url;
      }
    }
  }

  // Add episode to view
  //Utils.addEpisode(wsManager, FileSearch.library.id, movie.id, video);
}
