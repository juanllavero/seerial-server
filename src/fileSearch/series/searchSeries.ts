import fs from "fs-extra";
import {
  Episode,
  EpisodeGroupResponse,
  ShowResponse,
  TvSeasonResponse,
} from "moviedb-promise";
import path from "path";
import { Episode as EpisodeLocal } from "../../data/models/Media/Episode.model";
import { Library } from "../../data/models/Media/Library.model";
import { Season } from "../../data/models/Media/Season.model";
import { Series } from "../../data/models/Media/Series.model";
import { Video } from "../../data/models/Media/Video.model";
import { deleteSeries } from "../../db/delete/deleteData";
import { getEpisodes, getSeasons, getSeriesById } from "../../db/get/getData";
import {
  addEpisode,
  addSeason,
  addSeries,
  addVideoAsEpisode,
} from "../../db/post/postData";
import { MovieDBWrapper } from "../../theMovieDB/MovieDB";
import { FilesManager } from "../../utils/FilesManager";
import { Utils } from "../../utils/Utils";
import { WebSocketManager } from "../../WebSockets/WebSocketManager";
import { FileSearch } from "../fileSearch";

export async function scanTVShow(
  library: Library,
  folder: string,
  wsManager: WebSocketManager
) {
  if (!(await Utils.isFolder(folder))) return undefined;

  const videoFiles = await Utils.getValidVideoFiles(folder);

  if (videoFiles.length === 0) return undefined;

  let showData;
  let show: Series | null;

  let exists: boolean = false;

  // Get existing data or create a new Series
  if (folder in library.analyzedFolders) {
    show = await getSeriesById(library.analyzedFolders[folder] ?? "");

    if (show === null) return undefined;

    exists = true;
  } else {
    show = await addSeries({
      folder,
      libraryId: library.id,
    });

    if (!show) return;

    await library.addAnalyzedFolder(folder, show.id);
  }

  let themdbId = show.themdbId;

  if (themdbId === -1) {
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
    const showsSearch = await MovieDBWrapper.searchTVShows(finalName, year, 1);

    if (!showsSearch || showsSearch.length === 0) return undefined;

    themdbId = showsSearch[0].id ?? -1;
    show.themdbId = showsSearch[0].id ?? -1;
  }

  showData = await MovieDBWrapper.getTVShow(show.themdbId, library.language);

  if (!showData) return undefined;

  await setSeriesMetadataAndImages(show, showData);

  show.analyzingFiles = true;

  // Save data in DB
  show.save();

  //   if (!exists) {
  //     // Add show to view
  //     Utils.addSeries(wsManager, library.id, show);
  //   }

  // Descargar metadatos de cada temporada
  let seasonsMetadata: TvSeasonResponse[] = [];
  if (showData.seasons) {
    const seasonPromises = showData.seasons.map(async (seasonBasic) => {
      if (showData.id && seasonBasic.season_number) {
        return await MovieDBWrapper.getSeason(
          showData.id,
          seasonBasic.season_number,
          library.language
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
    show.episodeGroupId !== ""
      ? await MovieDBWrapper.getEpisodeGroup(show.episodeGroupId)
      : undefined;

  await processEpisodes(
    library,
    videoFiles,
    show,
    seasonsMetadata,
    episodesGroup,
    wsManager
  );

  const seasons = await getSeasons(show.id);

  if (!seasons || seasons.length < 1) {
    await deleteSeries(show.id);
    return undefined;
  }

  show.analyzingFiles = false;

  // Save data in DB
  show.save();

  // Update show in view
  //Utils.updateSeries(wsManager, library.id, show);
}

export async function processEpisodes(
  library: Library,
  videoFiles: string[],
  show: Series,
  seasonsMetadata: TvSeasonResponse[],
  episodesGroup: EpisodeGroupResponse | undefined,
  wsManager: WebSocketManager
) {
  // Construir el índice y el arreglo acumulado para búsquedas optimizadas.
  const seasonsIndex = Utils.indexSeasons(seasonsMetadata);
  const cumulativeEpisodes = Utils.buildCumulativeEpisodes(seasonsMetadata);

  // Process each episode
  for (const videoFile of videoFiles) {
    if (!library.analyzedFiles[videoFile]) {
      await processEpisode(
        library,
        show,
        videoFile,
        seasonsMetadata,
        seasonsIndex,
        cumulativeEpisodes,
        episodesGroup,
        wsManager
      );
    }
  }

  const seasons = await getSeasons(show.id);

  if (!seasons) return;

  // Change the name of every season to match the Episodes Group
  if (show.episodeGroupId !== "" && episodesGroup) {
    for (const season of seasons) {
      if (episodesGroup.groups) {
        for (const group of episodesGroup.groups) {
          if (group.order == season.seasonNumber) {
            season.name = group.name ?? season.name;
          }
        }
      }
    }
  } else if (seasons.length > 1) {
    //If two seasons have the same name
    if (seasons[0].name === seasons[1].name) {
      for (const season of seasons) {
        if (season.seasonNumber !== 0)
          season.name = "Season " + season.seasonNumber;
      }
    }
  }
}

export async function processEpisode(
  library: Library,
  show: Series,
  videoSrc: string,
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
  let fullName = path.parse(videoSrc).name;
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

    if (toFindMetadata && show.episodeGroupId !== "") {
      if (!episodesGroup) {
        episodesGroup = await MovieDBWrapper.getEpisodeGroup(
          show.episodeGroupId
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
          if (seasonMeta.season_number === realSeason && seasonMeta.episodes) {
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

  const seasons = await getSeasons(show.id);
  let season: Season | null | undefined;
  if (seasons && realEpisode !== -1 && realSeason) {
    season = seasons.find((season) => season.seasonNumber === realSeason);
  } else if (seasons && seasonMetadata.season_number) {
    season = seasons.find(
      (season) => season.seasonNumber === seasonMetadata.season_number
    );
  }

  if (!season) {
    season = await addSeason({
      seriesId: show.id,
      name: seasonMetadata.name ?? "",
      year:
        seasonMetadata.episodes &&
        seasonMetadata.episodes[0] &&
        seasonMetadata.episodes[0].air_date
          ? seasonMetadata.episodes[0].air_date
          : "",
      overview: seasonMetadata.overview ?? show.overview,
      seasonNumber:
        realEpisode !== -1
          ? realSeason ?? 0
          : seasonMetadata.season_number ?? 0,
    });

    if (!season) return;

    if (seasons && seasons.length > 1) {
      season.backgroundSrc = seasons[0].backgroundSrc;
      season.backgroundsUrls = seasons[0].backgroundsUrls;
    } else {
      setSeasonBackgrounds(show, season);
    }

    if (season.seasonNumber === 0) season.order = 100;

    // Save data in DB
    season.save();

    // Add season to view
    //Utils.addSeason(wsManager, library.id, season);
  }

  const episodes = await getEpisodes(season.id);
  let episode: EpisodeLocal | undefined | null;
  if (episodes && realEpisode && realEpisode !== -1) {
    episode = episodes.find((episode) => episode.episodeNumber === realEpisode);
  } else if (episodes && episodeMetadata.episode_number) {
    episode = episodes.find(
      (episode) => episode.episodeNumber === episodeMetadata.episode_number
    );
  }

  let video: Video | null = null;

  if (episode) {
    video = await addVideoAsEpisode(episode.id, {
      fileSrc: videoSrc,
    });
  } else {
    episode = await addEpisode({
      seasonId: season.id,
      seasonNumber: season.seasonNumber,
      name: episodeMetadata?.name ?? "",
      overview: episodeMetadata?.overview ?? "",
      year: episodeMetadata?.air_date ?? "",
      score: episodeMetadata?.vote_average
        ? (episodeMetadata.vote_average * 10.0) / 10.0
        : 0,
      episodeNumber:
        realEpisode && realEpisode != -1
          ? realEpisode
          : episodeMetadata.episode_number ?? 0,
    });

    if (!episode) return;

    await library.addAnalyzedFile(videoSrc, episode.id);

    // Set Metadata

    if (episodeMetadata.crew) {
      if (!episode.directedByLock && episode.directedBy) {
        episode.directedBy.splice(0, episode.directedBy.length);
        for (const person of episodeMetadata.crew) {
          if (person.name && person.job === "Director" && episode?.directedBy)
            episode.directedBy = [...episode.directedBy, person.name];
        }
      }

      if (!episode.writtenByLock && episode.writtenBy) {
        episode.writtenBy.splice(0, episode.writtenBy.length);
        for (const person of episodeMetadata.crew) {
          if (person.name && person.job === "Writer" && episode?.writtenBy)
            episode.writtenBy = [...episode.writtenBy, person.name];
        }
      }
    }

    video = await addVideoAsEpisode(episode.id, {
      fileSrc: videoSrc,
    });

    if (!video) return;

    video.runtime = episodeMetadata?.runtime ?? 0;

    const images = await MovieDBWrapper.getEpisodeImages(
      show.themdbId,
      season.seasonNumber,
      episode.episodeNumber
    );

    if (images) {
      video.imgUrls = images.stills
        ? images.stills.map(
            (img: any) => `${FileSearch.BASE_URL}${img.file_path}`
          )
        : [];
    }

    // Create images folder if not exists
    const outputDir = FilesManager.getExternalPath(
      "resources/img/thumbnails/video/" + episode.id + "/"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    video.imgSrc = `${FileSearch.BASE_URL}${episodeMetadata.still_path}`;

    // Add episode to view
    // Utils.addEpisode(
    //   wsManager,
    //   library.id,
    //   season.seriesId,
    //   episode
    // );
  }

  // Update video in DB
  episode.save();

  if (video) {
    video.episodeId = episode.id;
    video.save();
  }
}

export async function setSeriesMetadataAndImages(
  show: Series,
  showData: ShowResponse
) {
  show.name = !show.nameLock ? showData.name ?? "" : "";
  show.year = !show.yearLock ? showData.first_air_date ?? "" : "";
  show.overview = !show.overviewLock ? showData.overview ?? "" : "";
  show.score = showData.vote_average
    ? (showData.vote_average * 10.0) / 10.0
    : 0;
  show.productionStudios = show.productionStudiosLock
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

  const credits = await MovieDBWrapper.getTVCredits(show.themdbId);

  if (credits && credits.cast) {
    if (show.cast && show.cast.length > 0)
      show.cast.splice(0, show.cast.length);

    for (const person of credits.cast) {
      show.cast = [
        ...show.cast,
        {
          name: person.name ?? "",
          character: person.character ?? "",
          profileImage: person.profile_path
            ? `${FileSearch.BASE_URL}${person.profile_path}`
            : "",
        },
      ];
    }
  }

  if (credits && credits.crew) {
    if (show.creator && show.creator.length > 0)
      show.creator.splice(0, show.creator.length);

    if (show.musicComposer && show.musicComposer.length > 0)
      show.musicComposer.splice(0, show.musicComposer.length);

    for (const person of credits.crew) {
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
          show.creator = [...show.creator, person.name];

      if (person.job && person.job === "Original Music Composer")
        if (person.name && !show.musicComposerLock && show.musicComposer)
          show.musicComposer = [...show.musicComposer, person.name];
    }
  }

  if (show.creator && show.creator.length === 0) {
    show.creator = showData.created_by
      ? showData.created_by.map((person) => person.name ?? "")
      : [];
  }

  await downloadLogosAndPosters(show.themdbId, show);

  // Mandar library y show a React
}

export async function setSeasonBackgrounds(show: Series, season: Season) {
  let backgroundFound = false;
  const seasons = await getSeasons(show.id);
  if (seasons && seasons.length > 1) {
    for (let i = 0; i < seasons.length; i++) {
      const s = seasons[i];
      if (s.backgroundSrc.length > 0) {
        season.backgroundSrc = s.backgroundSrc;
        season.backgroundsUrls = s.backgroundsUrls;
        backgroundFound = true;
        break;
      }
    }
  }

  if (backgroundFound) return;

  try {
    // Get images
    const images = await MovieDBWrapper.getTVShowImages(show.themdbId);
    const backdrops = images?.backdrops ?? [];

    // Create folders if they do not exist
    const outputImageDir = FilesManager.getExternalPath(
      "resources/img/backgrounds/" + season.id
    );
    if (!fs.existsSync(outputImageDir)) {
      fs.mkdirSync(outputImageDir);
    }

    // Download backgrounds
    for (const backdrop of backdrops) {
      if (backdrop.file_path) {
        const backgroundUrl = `${FileSearch.BASE_URL}${backdrop.file_path}`;
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

export async function downloadLogosAndPosters(
  themoviedbID: number,
  show: Series
) {
  try {
    // Get images
    const images = await MovieDBWrapper.getTVShowImages(themoviedbID);

    const logos = images?.logos ?? [];
    const posters = images?.posters ?? [];

    // Create folders if they do not exist
    const outputLogosDir = FilesManager.getExternalPath(
      "resources/img/logos/" + show.id
    );
    if (!fs.existsSync(outputLogosDir)) {
      fs.mkdirSync(outputLogosDir);
    }

    const outputPostersDir = FilesManager.getExternalPath(
      "resources/img/posters/" + show.id
    );
    if (!fs.existsSync(outputPostersDir)) {
      fs.mkdirSync(outputPostersDir);
    }

    // Download logos
    for (const logo of logos) {
      if (logo.file_path && show.logosUrls) {
        const logoUrl = `${FileSearch.BASE_URL}${logo.file_path}`;
        show.logosUrls = [...show.logosUrls, logoUrl];

        if (show.logoSrc === "") {
          show.logoSrc = logoUrl;
        }
      }
    }

    // Download posters
    for (const poster of posters) {
      if (poster.file_path) {
        const posterUrl = `${FileSearch.BASE_URL}${poster.file_path}`;
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
