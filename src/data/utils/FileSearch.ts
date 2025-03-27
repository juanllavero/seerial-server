import ffmetadata from "ffmetadata";
import ffmpegPath from "ffmpeg-static";
import { existsSync } from "fs";
import fs from "fs-extra";
import {
  Episode,
  EpisodeGroupResponse,
  MovieResponse,
  ShowResponse,
  TvSeasonResponse,
} from "moviedb-promise";
import os from "os";
import pLimit from "p-limit";
import * as path from "path";
import { parse } from "path";
import { EpisodeData } from "../interfaces/EpisodeData";
import { Cast } from "../objects/Cast";
import { Episode as EpisodeLocal } from "../objects/Episode";
import { Library } from "../objects/Library";
import { Season } from "../objects/Season";
import { Series } from "../objects/Series";
import { DataManager } from "./DataManager";
import { IMDBScores } from "./IMDBScores";
import { MovieDBWrapper } from "./MovieDB";
import { Utils } from "./Utils";
import { WebSocketManager } from "./WebSocketManager";

export class FileSearch {
  static BASE_URL: string = "https://image.tmdb.org/t/p/original";

  // Number of threads (1 is already being used by this app)
  static availableThreads = Math.max(os.cpus().length - 1, 1);

  //#region METADATA DOWNLOAD
  public static async scanFiles(
    newLibrary: Library,
    wsManager: WebSocketManager,
    addLibrary: boolean
  ): Promise<Library | undefined> {
    if (!newLibrary) return undefined;

    DataManager.library = newLibrary;

    if (addLibrary) {
      DataManager.addLibrary(newLibrary);
      Utils.addLibrary(wsManager, newLibrary);
    }

    // Get available threads
    let availableThreads = Math.max(os.cpus().length - 2, 1);

    if (DataManager.library.type === "Music") {
      availableThreads = Math.min(availableThreads, 4);
    }
    const limit = pLimit(availableThreads);

    const tasks: Promise<void>[] = [];

    for (const rootFolder of DataManager.library.folders) {
      const filesInFolder = await Utils.getFilesInFolder(rootFolder);

      for (const file of filesInFolder) {
        const filePath = path.join(file.parentPath, file.name);

        const task = limit(async () => {
          if (DataManager.library.type === "Shows") {
            await this.scanTVShow(filePath, wsManager);
          } else if (DataManager.library.type === "Movies") {
            await this.scanMovie(filePath, wsManager);
          } else {
            await this.scanMusic(filePath, wsManager);
          }

          // Save data
          DataManager.saveData(
            DataManager.libraries.map((library) => library.toJSON())
          );
        });
        tasks.push(task);
      }
    }

    Promise.all(tasks);

    Utils.updateLibrary(wsManager, newLibrary);

    // Save data
    DataManager.saveData(
      DataManager.libraries.map((library) => library.toJSON())
    );

    return newLibrary;
  }

  public static async scanTVShow(folder: string, wsManager: WebSocketManager) {
    if (!(await Utils.isFolder(folder))) return undefined;

    const videoFiles = await Utils.getValidVideoFiles(folder);

    if (videoFiles.length === 0) return undefined;

    let showData;
    let show: Series | null;

    let exists: boolean = false;

    if (DataManager.library.getAnalyzedFolders().get(folder)) {
      show = DataManager.library.getSeriesById(
        DataManager.library.getAnalyzedFolders().get(folder) ?? ""
      );

      if (show === null) return undefined;

      console.log("EXISTING SHOW ", folder);

      exists = true;
    } else {
      console.log("NEW SHOW ", folder);
      show = new Series();
      show.setFolder(folder);
      DataManager.library.getAnalyzedFolders().set(folder, show.getId());
    }

    let themdbID = show.getThemdbID();

    if (themdbID === -1) {
      //#region EXTRACT NAME AND YEAR
      let finalName: string = folder.split(/[/\\]/).pop() ?? "";

      // Remove parenthesis
      const nameWithoutParenthesis: string = finalName.replace(/[()]/g, "");

      // Regular expression to extract name and year
      const pattern = /^(.*?)(?:\s(\d{4}))?$/;

      let year: string | undefined = undefined;

      const matcher = nameWithoutParenthesis.match(pattern);

      if (matcher) {
        finalName = matcher[1];
        year = matcher[2];
      }

      if (!year) year = "1";
      //#endregion

      // Search for the show
      const showsSearch = await MovieDBWrapper.searchTVShows(
        finalName,
        year,
        1
      );

      if (!showsSearch || showsSearch.length === 0) return undefined;

      themdbID = showsSearch[0].id ?? -1;
      show.themdbID = showsSearch[0].id ?? -1;
    }

    showData = await MovieDBWrapper.getTVShow(show.themdbID);

    if (!showData) return undefined;

    await this.setSeriesMetadataAndImages(show, showData);

    show.setAnalyzingFiles(true);

    if (!exists) {
      console.log("Adding Show...");
      // Add show to view
      Utils.addSeries(wsManager, DataManager.library.id, show);
    }

    // Descargar metadatos de cada temporada
    let seasonsMetadata: TvSeasonResponse[] = [];
    if (showData.seasons) {
      const seasonPromises = showData.seasons.map(async (seasonBasic) => {
        if (showData.id && seasonBasic.season_number) {
          return await MovieDBWrapper.getSeason(
            showData.id,
            seasonBasic.season_number
          ); // Devolver el resultado para añadirlo a seasonsMetadata
        }
      });

      // Esperar a que todas las promesas se resuelvan
      seasonsMetadata = (await Promise.all(seasonPromises)).filter(
        Boolean
      ) as TvSeasonResponse[];
    }

    if (seasonsMetadata?.length === 0) return;

    // Download Episodes Group Metadata
    let episodesGroup =
      show.episodeGroupID !== ""
        ? await MovieDBWrapper.getEpisodeGroup(show.episodeGroupID)
        : undefined;

    await this.processEpisodes(
      videoFiles,
      show,
      seasonsMetadata,
      episodesGroup,
      wsManager
    );

    if (show.getSeasons().length === 0) {
      DataManager.library.getAnalyzedFolders().delete(show.getFolder());
      return undefined;
    }

    show.setAnalyzingFiles(false);

    if (!exists) {
      DataManager.library.series.push(show);
    }

    // Update show in view
    Utils.updateSeries(wsManager, DataManager.library.id, show);
  }

  private static async processEpisodes(
    videoFiles: string[],
    show: Series,
    seasonsMetadata: TvSeasonResponse[],
    episodesGroup: EpisodeGroupResponse | undefined,
    wsManager: WebSocketManager
  ) {
    // Construir el índice y el arreglo acumulado para búsquedas optimizadas.
    const seasonsIndex = Utils.indexSeasons(seasonsMetadata);
    const cumulativeEpisodes = Utils.buildCumulativeEpisodes(seasonsMetadata);

    // Procesar cada episodio en paralelo.
    const processPromises = videoFiles.map(async (video) => {
      if (!DataManager.library.getAnalyzedFiles().has(video)) {
        await this.processEpisode(
          show,
          video,
          seasonsMetadata,
          seasonsIndex,
          cumulativeEpisodes,
          episodesGroup,
          wsManager
        );
      }
    });
    await Promise.all(processPromises);

    // Change the name of every season to match the Episodes Group
    if (show.getEpisodeGroupID() !== "" && episodesGroup) {
      show.seasons.forEach((season) => {
        if (episodesGroup.groups) {
          episodesGroup.groups.forEach((group) => {
            if (group.order == season.getSeasonNumber()) {
              season.setName(group.name ?? season.name);
            }
          });
        }
      });
    } else if (show.getSeasons().length > 1) {
      //If two seasons have the same name
      if (show.getSeasons()[0].getName() === show.getSeasons()[1].getName()) {
        show.seasons.forEach((season) => {
          if (season.getSeasonNumber() !== 0)
            season.setName("Season " + season.getSeasonNumber());
        });
      }
    }
  }

  private static async processEpisode(
    show: Series,
    video: string,
    seasonsMetadata: TvSeasonResponse[],
    seasonsIndex: Map<
      number,
      { season: TvSeasonResponse; episodesMap: Map<number, Episode> }
    >,
    cumulativeEpisodes: number[],
    episodesGroup: EpisodeGroupResponse | undefined,
    wsManager: WebSocketManager
  ) {
    //SeasonMetadataBasic and episode metadata to find for the current file
    let seasonMetadata: TvSeasonResponse | null = null;
    let episodeMetadata: Episode | null = null;

    let realSeason: number | undefined = 0;
    let realEpisode: number | undefined = -1;

    //Name of the file without the extension
    let fullName = path.parse(video).name;
    let seasonEpisode: [number, number?] = Utils.extractEpisodeSeason(fullName);

    if (Number.isNaN(seasonEpisode)) return;

    //If there is no season and episode numbers
    if (!seasonEpisode[1]) {
      const absoluteNumber = seasonEpisode[0];
      const result = Utils.getSeasonEpisodeByAbsoluteNumber(
        absoluteNumber,
        seasonsMetadata,
        cumulativeEpisodes
      );

      if (!result) return;

      seasonMetadata = result.season;
      episodeMetadata = result.episode;
    } else {
      const [episodeNumber, seasonNumber] = seasonEpisode;

      realSeason = seasonNumber;
      realEpisode = episodeNumber;

      let toFindMetadata = true;
      for (const season of seasonsMetadata) {
        if (season.season_number === seasonNumber) {
          toFindMetadata = false;
          break;
        }
      }

      if (toFindMetadata && show.getEpisodeGroupID() !== "") {
        if (!episodesGroup) {
          episodesGroup = await MovieDBWrapper.getEpisodeGroup(
            show.getEpisodeGroupID()
          );
        }

        if (episodesGroup && episodesGroup.groups) {
          let found = false;
          for (const episodeGroup of episodesGroup.groups) {
            if (episodeGroup.order !== seasonNumber || !episodeGroup.episodes)
              continue;

            for (const episode of episodeGroup.episodes) {
              if (episode.order && episode.order + 1 === episodeNumber) {
                realSeason = episode.season_number;
                realEpisode = episode.episode_number;
                found = true;
                break;
              }
            }

            if (found) break;
          }

          for (const seasonMeta of seasonsMetadata) {
            if (
              seasonMeta.season_number === realSeason &&
              seasonMeta.episodes
            ) {
              seasonMetadata = seasonMeta;

              for (const episodeMeta of seasonMeta.episodes) {
                if (episodeMeta.episode_number === realEpisode) {
                  episodeMetadata = episodeMeta;
                  break;
                }
              }

              break;
            }
          }
        } else return;
      } else {
        const seasonData = seasonsIndex.get(seasonNumber);
        if (seasonData && seasonData.episodesMap.has(episodeNumber)) {
          seasonMetadata = seasonData.season;
          episodeMetadata = seasonData.episodesMap.get(episodeNumber)!;
        } else {
          return;
        }
      }
    }

    if (!seasonMetadata || !episodeMetadata) return;

    let season: Season | undefined;
    if (realEpisode !== -1 && realSeason) {
      season = show.getSeason(realSeason);
    } else if (seasonMetadata.season_number) {
      season = show.getSeason(seasonMetadata.season_number);
    }

    if (!season) {
      season = new Season();
      show.addSeason(season);

      season.setSeriesID(show.id);
      season.setName(seasonMetadata.name ?? "");
      season.setOverview(seasonMetadata.overview ?? show.getOverview());
      season.setYear(
        seasonMetadata.episodes &&
          seasonMetadata.episodes[0] &&
          seasonMetadata.episodes[0].air_date
          ? seasonMetadata.episodes[0].air_date
          : ""
      );
      season.setSeasonNumber(
        realEpisode !== -1 ? realSeason ?? 0 : seasonMetadata.season_number ?? 0
      );

      if (show.seasons.length > 1) {
        season.backgroundSrc = show.getSeasons()[0].backgroundSrc;
        season.backgroundsUrls = show.getSeasons()[0].backgroundsUrls;
      } else {
        this.setSeasonBackgrounds(show, season);
      }

      if (season.getSeasonNumber() === 0) season.setOrder(100);

      // Add season to view
      Utils.addSeason(wsManager, DataManager.library.id, season);
    }

    let episode: EpisodeLocal | undefined;
    if (realEpisode && realEpisode !== -1) {
      episode = season.getEpisode(realEpisode);
    } else if (episodeMetadata.episode_number) {
      episode = season.getEpisode(episodeMetadata.episode_number);
    }

    if (episode) {
      episode.setVideoSrc(video);
    } else {
      episode = new EpisodeLocal();
      season.addEpisode(episode);
      episode.setSeasonID(season.getId());
      episode.setVideoSrc(video);
      episode.setSeasonNumber(season.seasonNumber);

      DataManager.library.getAnalyzedFiles().set(video, episode.id);

      // Set Metadata
      episode.setName(episodeMetadata?.name ?? "");
      episode.setOverview(episodeMetadata?.overview ?? "");
      episode.setYear(episodeMetadata?.air_date ?? "");
      episode.setScore(
        episodeMetadata?.vote_average
          ? (episodeMetadata.vote_average * 10.0) / 10.0
          : 0
      );
      episode.setRuntime(episodeMetadata?.runtime ?? 0);

      if (realEpisode && realEpisode != -1)
        episode.setEpisodeNumber(realEpisode);
      else episode.setEpisodeNumber(episodeMetadata.episode_number ?? 0);

      if (episodeMetadata.crew) {
        if (!episode.directedLock && episode.directedBy) {
          episode.directedBy.splice(0, episode.directedBy.length);
          episodeMetadata.crew.forEach((person) => {
            if (person.name && person.job === "Director" && episode?.directedBy)
              episode.directedBy.push(person.name);
          });
        }

        if (!episode.writtenLock && episode.writtenBy) {
          episode.writtenBy.splice(0, episode.writtenBy.length);
          episodeMetadata.crew.forEach((person) => {
            if (person.name && person.job === "Writer" && episode?.writtenBy)
              episode?.writtenBy.push(person.name);
          });
        }
      }

      await this.processMediaInfo(episode);

      // Create images folder if not exists
      const outputDir = Utils.getExternalPath(
        "resources/img/thumbnails/video/" + episode.id + "/"
      );

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      episode.imgSrc = `${this.BASE_URL}${episodeMetadata.still_path}`;

      // Add episode to view
      Utils.addEpisode(
        wsManager,
        DataManager.library.id,
        season.seriesID,
        episode
      );
    }
  }

  private static async setSeriesMetadataAndImages(
    show: Series,
    showData: ShowResponse
  ) {
    show.name = !show.nameLock ? showData.name ?? "" : "";
    show.year = !show.yearLock ? showData.first_air_date ?? "" : "";
    show.overview = !show.overviewLock ? showData.overview ?? "" : "";
    show.score = showData.vote_average
      ? (showData.vote_average * 10.0) / 10.0
      : 0;
    show.numberOfSeasons = showData.number_of_seasons ?? 0;
    show.numberOfEpisodes = showData.number_of_episodes ?? 0;
    show.productionStudios = show.studioLock
      ? show.productionStudios
      : showData.production_companies
      ? showData.production_companies.map((company) => company.name ?? "")
      : [];
    show.genres = show.genresLock
      ? show.genres
      : showData.genres
      ? showData.genres.map((genre) => genre.name ?? "")
      : [];
    show.tagline = !show.taglineLock ? showData.tagline ?? "" : "";
    show.playSameMusic = true;

    const credits = await MovieDBWrapper.getTVCredits(show.themdbID);

    if (credits && credits.cast) {
      if (show.cast && show.cast.length > 0)
        show.cast.splice(0, show.cast.length);

      credits.cast.forEach((person) => {
        show.cast?.push(
          new Cast(
            person.name,
            person.character,
            person.profile_path ? `${this.BASE_URL}${person.profile_path}` : ""
          )
        );
      });
    }

    if (credits && credits.crew) {
      if (show.creator && show.creator.length > 0)
        show.creator.splice(0, show.creator.length);

      if (show.musicComposer && show.musicComposer.length > 0)
        show.musicComposer.splice(0, show.musicComposer.length);

      credits.crew.forEach((person) => {
        if (
          person.job &&
          (person.job === "Author" ||
            person.job === "Novel" ||
            person.job === "Original Series Creator" ||
            person.job === "Comic Book" ||
            person.job === "Idea" ||
            person.job === "Original Story" ||
            person.job === "Story" ||
            person.job === "Story by" ||
            person.job === "Book" ||
            person.job === "Original Concept")
        )
          if (person.name && !show.creatorLock && show.creator)
            show.creator.push(person.name);

        if (person.job && person.job === "Original Music Composer")
          if (person.name && !show.musicLock && show.musicComposer)
            show.musicComposer.push(person.name);
      });
    }

    if (show.creator && show.creator.length === 0) {
      show.creator = showData.created_by
        ? showData.created_by.map((person) => person.name ?? "")
        : [];
    }

    await this.downloadLogosAndPosters(show.themdbID, show);

    // Mandar library y show a React
  }

  private static async setSeasonBackgrounds(show: Series, season: Season) {
    let backgroundFound = false;
    if (show.getSeasons().length > 1) {
      for (let i = 0; i < show.getSeasons().length; i++) {
        const s = show.getSeasons()[i];
        if (s.backgroundSrc.length > 0) {
          season.setBackgroundSrc(s.backgroundSrc);
          season.backgroundsUrls = s.backgroundsUrls;
          backgroundFound = true;
          break;
        }
      }
    }

    if (backgroundFound) return;

    try {
      // Get images
      const images = await MovieDBWrapper.getTVShowImages(show.themdbID);
      const backdrops = images?.backdrops ?? [];

      // Create folders if they do not exist
      const outputImageDir = Utils.getExternalPath(
        "resources/img/backgrounds/" + season.id
      );
      if (!fs.existsSync(outputImageDir)) {
        fs.mkdirSync(outputImageDir);
      }

      // Download backgrounds
      for (const backdrop of backdrops) {
        if (backdrop.file_path) {
          const backgroundUrl = `${this.BASE_URL}${backdrop.file_path}`;
          season.backgroundsUrls = [...season.backgroundsUrls, backgroundUrl];

          if (season.backgroundSrc === "") {
            season.backgroundSrc = backgroundUrl;
          }
        }
      }
    } catch (error) {
      console.error("Error downloading images:", error);
    }
  }

  private static async downloadLogosAndPosters(
    themoviedbID: number,
    show: Series
  ) {
    try {
      // Get images
      const images = await MovieDBWrapper.getTVShowImages(themoviedbID);

      const logos = images?.logos ?? [];
      const posters = images?.posters ?? [];

      // Create folders if they do not exist
      const outputLogosDir = Utils.getExternalPath(
        "resources/img/logos/" + show.id
      );
      if (!fs.existsSync(outputLogosDir)) {
        fs.mkdirSync(outputLogosDir);
      }

      const outputPostersDir = Utils.getExternalPath(
        "resources/img/posters/" + show.id
      );
      if (!fs.existsSync(outputPostersDir)) {
        fs.mkdirSync(outputPostersDir);
      }

      // Download logos
      for (const logo of logos) {
        if (logo.file_path && show.logosUrls) {
          const logoUrl = `${this.BASE_URL}${logo.file_path}`;
          show.logosUrls = [...show.logosUrls, logoUrl];

          if (show.logoSrc === "") {
            show.logoSrc = logoUrl;
          }
        }
      }

      // Download posters
      for (const poster of posters) {
        if (poster.file_path) {
          const posterUrl = `${this.BASE_URL}${poster.file_path}`;
          show.coversUrls = [...show.coversUrls, posterUrl];

          if (show.coverSrc === "") {
            show.coverSrc = posterUrl;
          }
        }
      }
    } catch (error) {
      console.error("Error al descargar imágenes:", error);
    }
  }

  public static async scanMovie(root: string, wsManager: WebSocketManager) {
    if (!(await Utils.isFolder(root))) {
      //#region MOVIE FILE ONLY
      if (!Utils.isVideoFile(root)) return;

      const fileFullName = await Utils.getFileName(root);
      const nameAndYear = Utils.extractNameAndYear(fileFullName);

      let name = nameAndYear[0];
      let year = nameAndYear[1];

      const movieMetadata = await this.searchMovie(name, year);

      let show = new Series();
      show.setName(name);
      show.setFolder(root);
      show.setAnalyzingFiles(true);
      DataManager.library.getAnalyzedFolders().set(root, show.getId());

      // Add show to view
      Utils.addSeries(wsManager, DataManager.library.id, show);

      let season = new Season();
      DataManager.library.getAnalyzedFolders().set(root, season.getId());
      season.setSeriesID(show.getId());
      season.setFolder(root);
      show.addSeason(season);

      if (movieMetadata) {
        await this.setSeasonMetadata(show, season, movieMetadata, name, year);
      } else {
        //Save movie without metadata
        season.setName(name);
        season.setYear(year !== "1" ? year : "");
        season.setSeasonNumber(show.getSeasons().length);

        // Add season to view
        Utils.addSeason(wsManager, DataManager.library.id, season);

        this.saveDiscWithoutMetadata(season, root, wsManager);
        DataManager.library.getSeries().push(show);
        return;
      }

      // Add season to view
      Utils.addSeason(wsManager, DataManager.library.id, season);

      await this.processMovie(season, root, wsManager);

      show.setAnalyzingFiles(false);
      DataManager.library.series.push(show);
      //#endregion

      // Update show in view
      Utils.updateSeries(wsManager, DataManager.library.id, show);
    } else {
      let show: Series | null;

      //let exists: boolean = false;
      if (DataManager.library.getAnalyzedFolders().get(root)) {
        show = DataManager.library.getSeriesById(
          DataManager.library.getAnalyzedFolders().get(root) ?? ""
        );

        if (show === null) return;

        //exists = true;
      } else {
        show = new Series();
        show.setFolder(root);
        DataManager.library.getAnalyzedFolders().set(root, show.getId());
      }

      show.setAnalyzingFiles(true);

      // Add show to view
      Utils.addSeries(wsManager, DataManager.library.id, show);

      const filesInDir = await Utils.getFilesInFolder(root);
      const folders: string[] = [];
      const filesInRoot: string[] = [];

      for (const file of filesInDir) {
        const filePath = `${root}/${file.name}`;
        if (await Utils.isFolder(filePath)) {
          folders.push(filePath);
        } else {
          if (await Utils.isVideoFile(filePath)) filesInRoot.push(filePath);
        }
      }

      if (folders.length > 0) {
        //#region FOLDERS CORRESPONDING DIFFERENT MOVIES FROM A COLLECTION
        show.isCollection = true;

        const fileFullName = Utils.getFileName(root);

        show.setName(fileFullName);
        show.setFolder(root);
        DataManager.library.getAnalyzedFolders().set(root, show.getId());

        const processPromises = folders.map(async (folder) => {
          const fileFullName = Utils.getFileName(folder);
          const nameAndYear = Utils.extractNameAndYear(fileFullName);

          let name = nameAndYear[0];
          let year = nameAndYear[1];

          const movieMetadata = await this.searchMovie(name, year);

          let season = new Season();
          DataManager.library.getAnalyzedFolders().set(folder, season.getId());
          season.setSeriesID(show.getId());
          season.setFolder(folder);
          show.addSeason(season);

          const files = await Utils.getValidVideoFiles(folder);

          if (movieMetadata) {
            await this.setSeasonMetadata(
              show,
              season,
              movieMetadata,
              name,
              year
            );
          } else {
            //Save videos without metadata
            season.setName(name);
            season.setYear(year !== "1" ? year : "");
            season.setSeasonNumber(show.getSeasons().length);

            // Add season to view
            Utils.addSeason(wsManager, DataManager.library.id, season);

            const processPromises = files.map(async (file) => {
              await this.saveDiscWithoutMetadata(season, file, wsManager);
            });

            await Promise.all(processPromises);
            DataManager.library.getSeries().push(show);
            return;
          }

          // Add season to view
          Utils.addSeason(wsManager, DataManager.library.id, season);

          const processPromises = files.map(async (file) => {
            await this.processMovie(season, file, wsManager);
          });

          await Promise.all(processPromises);
        });

        await Promise.all(processPromises);
        DataManager.library.series.push(show);
        //#endregion
      } else {
        //#region MOVIE FILE/CONCERT FILES INSIDE FOLDER
        const fileFullName = Utils.getFileName(root);
        const nameAndYear = Utils.extractNameAndYear(fileFullName);

        let name = nameAndYear[0];
        let year = nameAndYear[1];

        const movieMetadata = await this.searchMovie(name, year);

        show.setName(name);
        show.setFolder(root);
        DataManager.library.getAnalyzedFolders().set(root, show.getId());

        let season = new Season();
        DataManager.library.getAnalyzedFolders().set(root, season.getId());
        season.setSeriesID(show.getId());
        season.setFolder(root);
        show.addSeason(season);

        if (movieMetadata) {
          await this.setSeasonMetadata(show, season, movieMetadata, name, year);
        } else {
          //Save videos without metadata
          season.setName(name);
          season.setYear(year !== "1" ? year : "");
          season.setSeasonNumber(show.getSeasons().length);

          // Add season to view
          Utils.addSeason(wsManager, DataManager.library.id, season);

          const processPromises = filesInRoot.map(async (file) => {
            await this.saveDiscWithoutMetadata(season, file, wsManager);
          });

          await Promise.all(processPromises);
          DataManager.library.getSeries().push(show);

          // Update show in view
          Utils.updateSeries(wsManager, DataManager.library.id, show);
          return;
        }

        // Add season to view
        Utils.addSeason(wsManager, DataManager.library.id, season);

        const processPromises = filesInRoot.map(async (file) => {
          await this.processMovie(season, file, wsManager);
        });

        await Promise.all(processPromises);
        DataManager.library.series.push(show);
        //#endregion
      }

      show.setAnalyzingFiles(false);

      // Update show in view
      Utils.updateSeries(wsManager, DataManager.library.id, show);
    }
  }

  private static async searchMovie(name: string, year: string) {
    const moviesSearch = await MovieDBWrapper.searchMovies(name, year, 1);

    return moviesSearch && moviesSearch.length > 0
      ? await MovieDBWrapper.getMovie(moviesSearch[0].id ?? 0)
      : undefined;
  }

  private static async setSeasonMetadata(
    show: Series,
    season: Season,
    movieMetadata: MovieResponse,
    name: string,
    year: string
  ) {
    season.setName(!season.nameLock ? movieMetadata.title ?? name : name);
    season.setYear(
      !season.yearLock ? movieMetadata.release_date ?? year : year
    );
    season.setOverview(
      !season.overviewLock ? movieMetadata.overview ?? "" : ""
    );
    season.tagline = !season.taglineLock ? movieMetadata.tagline ?? "" : "";
    season.setThemdbID(movieMetadata.id ?? -1);
    season.setImdbID(movieMetadata.imdb_id ?? "-1");
    season.setScore(
      movieMetadata.vote_average ? (movieMetadata.vote_average * 10) / 10 : 0
    );
    season.setGenres(
      season.genresLock && season.genres
        ? season.genres
        : movieMetadata.genres
        ? movieMetadata.genres.map((genre) => genre.name ?? "")
        : []
    );
    season.productionStudios = season.studioLock
      ? season.productionStudios
      : movieMetadata.production_companies
      ? movieMetadata.production_companies.map((company) => company.name ?? "")
      : [];

    // Get IMDB Score for Movie
    season.setIMDBScore(await IMDBScores.getIMDBScore(season.imdbID));

    //#region GET TAGS
    const credits = await MovieDBWrapper.getMovieCredits(season.getThemdbID());

    if (credits) {
      if (credits.crew) {
        if (!season.directedLock && season.directedBy) {
          season.directedBy.splice(0, season.directedBy.length);
          credits.crew.forEach((person) => {
            if (person.name && person.job === "Director" && season.directedBy)
              season?.directedBy.push(person.name);
          });
        }

        if (!season.writtenLock && season.writtenBy) {
          season.writtenBy.splice(0, season.writtenBy.length);
          credits.crew.forEach((person) => {
            if (person.name && person.job === "Writer" && season.writtenBy)
              season?.writtenBy.push(person.name);
          });
        }

        if (!season.creatorLock && season.creator && season.creator.length > 0)
          season.creator.splice(0, season.creator.length);

        if (
          !season.musicLock &&
          season.musicComposer &&
          season.musicComposer.length > 0
        )
          season.musicComposer.splice(0, season.musicComposer.length);

        credits.crew.forEach((person) => {
          if (
            !season.creatorLock &&
            person.job &&
            (person.job === "Author" ||
              person.job === "Novel" ||
              person.job === "Original Series Creator" ||
              person.job === "Comic Book" ||
              person.job === "Idea" ||
              person.job === "Original Story" ||
              person.job === "Story" ||
              person.job === "Story by" ||
              person.job === "Book" ||
              person.job === "Original Concept")
          )
            if (person.name && !season.creatorLock && season.creator)
              season.creator.push(person.name);

          if (
            !season.musicLock &&
            person.job &&
            person.job === "Original Music Composer"
          )
            if (person.name && !season.musicLock && season.musicComposer)
              season.musicComposer.push(person.name);
        });
      }

      if (credits.cast) {
        if (season.cast && season.cast.length > 0)
          season.cast.splice(0, season.cast.length);

        credits.cast.forEach((person) => {
          season.cast?.push(
            new Cast(
              person.name,
              person.character,
              person.profile_path
                ? `${this.BASE_URL}${person.profile_path}`
                : ""
            )
          );
        });
      }
    }
    //#endregion

    //#region IMAGES DOWNLOAD
    const images = await MovieDBWrapper.getMovieImages(season.getThemdbID());

    if (images) {
      const logos = images.logos || [];
      const posters = images.posters || [];
      const backdrops = images.backdrops || [];

      // Create folders if they do not exist
      const outputLogosDir = Utils.getExternalPath(
        "resources/img/logos/" + season.id
      );
      if (!fs.existsSync(outputLogosDir)) {
        fs.mkdirSync(outputLogosDir);
      }

      const outputPostersDir = Utils.getExternalPath(
        "resources/img/posters/" + season.id
      );
      if (!fs.existsSync(outputPostersDir)) {
        fs.mkdirSync(outputPostersDir);
      }

      const outputPostersCollectionDir = Utils.getExternalPath(
        "resources/img/posters/" + show.id
      );
      if (show.isCollection) {
        if (!fs.existsSync(outputPostersCollectionDir)) {
          fs.mkdirSync(outputPostersCollectionDir);
        }
      }

      const outputImageDir = Utils.getExternalPath(
        "resources/img/backgrounds/" + season.id
      );
      if (!fs.existsSync(outputImageDir)) {
        fs.mkdirSync(outputImageDir);
      }

      // Download backgrounds
      for (const backdrop of backdrops) {
        if (backdrop.file_path) {
          const backgroundUrl = `${this.BASE_URL}${backdrop.file_path}`;
          season.backgroundsUrls = [...season.backgroundsUrls, backgroundUrl];

          if (season.backgroundSrc === "") {
            season.backgroundSrc = backgroundUrl;
          }
        }
      }

      // Download logos
      for (const logo of logos) {
        if (logo.file_path) {
          const logoUrl = `${this.BASE_URL}${logo.file_path}`;
          season.logosUrls = [...season.logosUrls, logoUrl];

          if (season.logoSrc === "") {
            season.logoSrc = logoUrl;
          }
        }
      }

      // Download posters
      for (const poster of posters) {
        if (poster.file_path) {
          const posterUrl = `${this.BASE_URL}${poster.file_path}`;
          season.coversUrls = [...season.coversUrls, posterUrl];

          if (season.coverSrc === "") {
            season.coverSrc = posterUrl;
          }

          if (show.isCollection) {
            show.coversUrls = [...show.coversUrls, posterUrl];
            if (show.coverSrc === "") {
              show.coverSrc = posterUrl;
            }
          }
        }
      }
    }
    //#endregion
  }

  private static async saveDiscWithoutMetadata(
    season: Season,
    filePath: string,
    wsManager: WebSocketManager
  ) {
    let episode: EpisodeLocal | undefined = new EpisodeLocal();

    if (
      DataManager.library.getAnalyzedFiles().get(filePath) &&
      DataManager.library.getAnalyzedFiles().get(filePath) !== null
    ) {
      episode = season.getEpisodeById(
        DataManager.library.getAnalyzedFiles().get(filePath) ?? ""
      );
    }

    if (!episode) {
      episode = new EpisodeLocal();
      season.addEpisode(episode);
      episode.setSeasonID(season.getId());
      DataManager.library.getAnalyzedFiles().set(filePath, episode.getId());

      episode.setName(season.getName());
      episode.setVideoSrc(filePath);
      episode.setSeasonNumber(season.getSeasonNumber());
      episode.setImgSrc("resources/img/Default_video_thumbnail.jpg");
    }

    await this.processMediaInfo(episode);

    // Add episode to view
    Utils.addEpisode(
      wsManager,
      DataManager.library.id,
      season.seriesID,
      episode
    );
  }

  private static async processMovie(
    season: Season,
    filePath: string,
    wsManager: WebSocketManager
  ) {
    let episode: EpisodeLocal | undefined = new EpisodeLocal();

    if (
      DataManager.library.getAnalyzedFiles().get(filePath) &&
      DataManager.library.getAnalyzedFiles().get(filePath) !== null
    ) {
      episode = season.getEpisodeById(
        DataManager.library.getAnalyzedFiles().get(filePath) ?? ""
      );
    } else {
      episode = new EpisodeLocal();
      season.addEpisode(episode);
      episode.setSeasonID(season.getId());
      DataManager.library.getAnalyzedFiles().set(filePath, episode.getId());

      episode.setName(Utils.getFileName(filePath));
      episode.setYear(season.getYear());
      episode.setOverview(season.getOverview());
      episode.setVideoSrc(filePath);
      episode.setSeasonNumber(season.getSeasonNumber());
    }

    if (!episode) return;

    await this.processMediaInfo(episode);

    const images = await MovieDBWrapper.getMovieImages(season.themdbID);

    let thumbnails = images?.backdrops || [];

    const outputDir = Utils.getExternalPath(
      "resources/img/thumbnails/video/" + episode.id + "/"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Download thumbnails
    for (const [index, thumbnail] of thumbnails.entries()) {
      if (thumbnail.file_path) {
        const url = `${this.BASE_URL}${thumbnail.file_path}`;
        episode.imgUrls = [...episode.imgUrls, url];

        if (index === 0) {
          episode.imgSrc = url;
        }
      }
    }

    // Add episode to view
    Utils.addEpisode(
      wsManager,
      DataManager.library.id,
      season.seriesID,
      episode
    );
  }

  private static async processMediaInfo(episode: EpisodeLocal) {
    let episodeData: EpisodeData | undefined = await Utils.getMediaInfo(
      episode
    );

    episode.runtime = episodeData ? episodeData.runtime : episode.runtime;

    if (episodeData) {
      if (episodeData.mediaInfo) episode.mediaInfo = episodeData.mediaInfo;

      if (episodeData.videoTracks)
        episode.videoTracks = episodeData.videoTracks;

      if (episodeData.audioTracks)
        episode.audioTracks = episodeData.audioTracks;

      if (episodeData.subtitleTracks)
        episode.subtitleTracks = episodeData.subtitleTracks;

      if (episodeData.chapters) episode.chapters = episodeData.chapters;
    }
  }

  //#endregion

  //#region MUSIC METADATA EXTRACTION
  public static async scanMusic(folder: string, wsManager: WebSocketManager) {
    if (!(await Utils.isFolder(folder))) return;

    ffmetadata.setFfmpegPath(ffmpegPath || "");

    let collection: Series | null;

    if (!DataManager.library.getAnalyzedFolders().get(folder)) {
      collection = new Series();
      collection.setName(Utils.getFileName(folder));
      collection.setAnalyzingFiles(true);
      DataManager.library.series.push(collection);
      DataManager.library.analyzedFolders.set(folder, collection.id);

      // Add show to view
      Utils.addSeries(wsManager, DataManager.library.id, collection);
    } else {
      collection = DataManager.library.getSeriesById(
        DataManager.library.getAnalyzedFolders().get(folder) || ""
      );
    }

    if (collection === null || !collection) return;

    collection.setAnalyzingFiles(true);

    // Get music files inside folder (4 folders of depth)
    const musicFiles = await Utils.getMusicFiles(folder);

    // Process each file
    for (const file of musicFiles) {
      if (!DataManager.library.getAnalyzedFiles().get(file)) {
        await this.processMusicFile(file, collection, wsManager);
      }
    }

    collection.isCollection = collection.seasons.length > 1;
    collection.setAnalyzingFiles(false);

    // Update show in view
    Utils.updateSeries(wsManager, DataManager.library.id, collection);
  }

  private static async processMusicFile(
    musicFile: string,
    collection: Series,
    wsManager: WebSocketManager
  ) {
    try {
      const data = await new Promise<any>((resolve, reject) => {
        ffmetadata.read(musicFile, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      const artistName = data["album_artist"] ? data["album_artist"] : "";
      const albumName = data.album ?? "Unknown";

      let album: Season | null = null;

      for (const season of collection.seasons) {
        if (season.name === albumName) {
          album = season;
          break;
        }
      }

      if (album === null) {
        album = new Season();
        album.setName(albumName ?? "Unknown");
        album.setSeriesID(collection.id);
        album.setYear(
          data.date
            ? new Date(data.date).getFullYear().toString()
            : data["TYER"]
            ? new Date(data["TYER"]).getFullYear().toString()
            : ""
        );
        album.setGenres(
          data.genre
            ? data.genre.split(",").map((genre: string) => genre.trim())
            : []
        );
        collection.seasons.push(album);

        // Add season to view
        Utils.addSeason(wsManager, DataManager.library.id, album);
      }

      let song = new EpisodeLocal();
      song.setName(data.title ?? Utils.getFileName(musicFile));
      song.setYear(
        data.date
          ? new Date(data.date).getFullYear().toString()
          : data["TYER"]
          ? new Date(data["TYER"]).getFullYear().toString()
          : ""
      );
      song.setSeasonNumber(data["disc"] ? Number.parseInt(data["disc"]) : 0);
      song.setEpisodeNumber(data.track ? Number.parseInt(data.track) : 0);
      song.album = albumName ?? "Unknown";
      song.albumArtist = artistName ?? "Unknown";
      song.setDirectedBy(
        data.artist
          ? data.artist.split(",").map((artist: string) => artist.trim())
          : []
      );
      song.setWrittenBy(
        data.composer
          ? data.composer.split(",").map((composer: string) => composer.trim())
          : []
      );

      if (album.coverSrc === "") {
        // Search for image in the same folder
        let imageSrc = await Utils.findImageInFolder(path.dirname(musicFile));

        // If no image is found in the same folder, search in the parent folder
        if (!imageSrc) {
          const parentFolder = path.resolve(path.dirname(musicFile), "..");
          imageSrc = await Utils.findImageInFolder(parentFolder);
        }

        if (imageSrc) {
          await Utils.createFolder("resources/img/posters/" + album.id);
          let destPath = Utils.getExternalPath(
            "resources/img/posters/" +
              album.id +
              "/" +
              imageSrc.split("\\").pop()
          );
          fs.copyFile(imageSrc, destPath, (err) => {
            if (err) {
              console.error("Error copying image:", err);
              return;
            }
          });

          album.setCoverSrc(
            "resources/img/posters/" +
              album.id +
              "/" +
              imageSrc.split("\\").pop()
          );

          if (collection.coverSrc === "") {
            await Utils.createFolder("resources/img/posters/" + collection.id);
            let destPath = Utils.getExternalPath(
              "resources/img/posters/" +
                collection.id +
                "/" +
                imageSrc.split("\\").pop()
            );
            fs.copyFile(imageSrc, destPath, (err) => {
              if (err) {
                console.error("Error copying image:", err);
                return;
              }
            });

            collection.setCoverSrc(
              "resources/img/posters/" +
                collection.id +
                "/" +
                imageSrc.split("\\").pop()
            );
          }
        }
      }

      // Get runtime
      await Utils.getOnlyRuntime(song, musicFile);

      song.setVideoSrc(musicFile);
      album.addEpisode(song);
      DataManager.library.analyzedFiles.set(musicFile, song.id);

      // Add episode to view
      Utils.addEpisode(wsManager, DataManager.library.id, collection.id, song);
    } catch (error) {
      console.error("Error processing music file", error);
    }
  }
  //#endregion

  //#region SEARCH LIBRARY

  //#endregion

  //#region UPDATE METADATA
  public static updateShowMetadata = async (
    libraryId: string,
    showId: string,
    newTheMovieDBID: number,
    wsManager: WebSocketManager,
    newEpisodeGroupId?: string
  ) => {
    const library = DataManager.libraries.find(
      (library) => library.id === libraryId
    );

    if (!library) return;

    DataManager.library = library;

    const show = library.getSeriesById(showId);

    if (!show) return;

    // Delete previous data
    await DataManager.deleteSeriesData(library, show);

    // Restore folder stored in library
    library.getAnalyzedFolders().set(show.folder, show.id);

    // Clear season list
    show.seasons = [];

    // Update TheMovieDB ID
    show.setThemdbID(newTheMovieDBID);

    // Update EpisodeGroup ID if param is passed
    if (newEpisodeGroupId) {
      show.setEpisodeGroupID(newEpisodeGroupId);
    }

    // Set element loading to show in client
    show.analyzingFiles = true;

    Utils.updateSeries(wsManager, library.id, show);

    // Get new data
    await this.scanTVShow(show.folder, wsManager);
  };

  public static updateMovieMetadata = async (
    libraryId: string,
    seriesId: string,
    seasonId: string,
    newTheMovieDBID: number,
    wsManager: WebSocketManager
  ) => {
    const library = DataManager.libraries.find(
      (library) => library.id === libraryId
    );

    if (!library) return;

    DataManager.library = library;

    const collection = library.getSeriesById(seriesId);

    if (!collection) return;

    const movie = collection.getSeasonById(seasonId);

    if (!movie) return;

    // Delete previous data
    await DataManager.deleteSeasonData(library, movie);

    // Restore folder in library
    library.getSeasonFolders().set(movie.folder, movie.id);

    // Clear episode list
    movie.episodes = [];

    // Update TheMovieDB ID
    movie.setThemdbID(newTheMovieDBID);

    // Set element loading to show in client
    collection.analyzingFiles = true;

    Utils.updateSeries(wsManager, library.id, collection);

    // Get new data
    await this.scanMovie(movie.folder, wsManager);
  };
  //#endregion

  //#region CLEAR LIBRARY
  /**
   * Delete removed files from library
   * @param libraryId Library ID
   * @param wsManager Websocket manager to send updates to client
   * @returns
   */
  public static async clearLibrary(
    libraryId: string,
    wsManager: WebSocketManager
  ) {
    const library = DataManager.libraries.find(
      (library) => library.id === libraryId
    );

    if (
      !library ||
      library.analyzedFiles.size === 0 ||
      !library.folders ||
      library.folders.length === 0
    )
      return;

    // Map to associate each file with its closest root folder
    const fileToRootFolder = new Map<string, string>();

    // Group files by their root folder
    for (const filePath of library.analyzedFiles.keys()) {
      const matchingRootFolder = library.folders
        .filter((folder) => filePath.startsWith(folder))
        .sort((a, b) => b.length - a.length)[0]; // Sort by length in descending order to get the most specific one

      if (matchingRootFolder) {
        fileToRootFolder.set(filePath, matchingRootFolder);
      } else {
        // If there is no matching root folder, use the file's root
        const { root } = parse(filePath);
        fileToRootFolder.set(filePath, root);
      }
    }

    // Check each root folder and its associated files
    const checkedRoots = new Set<string>(); // To avoid checking the same root multiple times

    for (const [filePath, rootFolder] of fileToRootFolder) {
      const resolvedRoot = path.resolve(rootFolder);

      if (!checkedRoots.has(resolvedRoot)) {
        if (!existsSync(resolvedRoot)) {
          console.log(
            `Root folder ${resolvedRoot} is not connected. Its files will be skipped.`
          );
          checkedRoots.add(resolvedRoot);
          continue;
        }
        checkedRoots.add(resolvedRoot);
      }

      // If the root is connected, check the file
      const fileExists = existsSync(filePath);

      if (!fileExists) {
        const episode = DataManager.getEpisodeByPath(library.id, filePath);

        if (episode) {
          const season = DataManager.getSeasonById(
            library.id,
            episode.seasonID
          );

          if (!season) continue;

          const series = DataManager.getSeries(library.id, season.seriesID);

          if (!series) continue;

          await DataManager.deleteEpisode(
            library.id,
            season.seriesID,
            episode.seasonID,
            episode.id
          );

          if (season.episodes.length === 0) {
            await DataManager.deleteSeason(
              library.id,
              season.seriesID,
              season.id
            );

            // Update library in client
            Utils.deleteSeason(wsManager, library.id, series.id, season.id);
          }

          if (series.seasons.length === 0) {
            await DataManager.deleteShow(library.id, series.id);

            // Update library in client
            Utils.deleteSeries(wsManager, library.id, series.id);
          }
        }
      }
    }

    // Update library in client
    Utils.updateLibrary(wsManager, library);
  }
  //#endregion
}
