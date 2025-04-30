import fs from "fs-extra";
import * as path from "path";
import { Episode as EpisodeData } from "../data/interfaces/Media";
import { Episode, Episode as EpisodeLocal } from "../data/objects/Episode";
import { Library } from "../data/objects/Library";
import { Season } from "../data/objects/Season";
import { Series } from "../data/objects/Series";

export class DataManager {
  static DATA_PATH: string = "resources/data.json";

  public static getLibraries(): Library[] {
    return this.libraries;
  }

  public static addLibrary(newLibrary: Library) {
    if (!this.libraries.includes(newLibrary)) this.libraries.push(newLibrary);
  }

  //#region GET DATA
  public static getLibrary(libraryId: string): Library | undefined {
    return this.libraries.find((library) => library.id === libraryId);
  }

  public static getSeries(libraryId: string, seriesId: string): Series | null {
    const library = this.getLibrary(libraryId);

    console.log({ libraryId: library?.id });

    if (!library) return null;

    return library.getSeriesById(seriesId);
  }

  public static getSeasonById(
    libraryId: string,
    seasonId: string
  ): Season | null {
    const library = this.getLibrary(libraryId);

    if (!library) return null;

    for (const series of library.series) {
      if (!series.seasons) continue;

      for (const season of series.seasons) {
        if (season.id === seasonId) {
          return season;
        }
      }
    }

    return null;
  }

  public static getEpisode(
    libraryId: string,
    showId: string,
    seasonId: string,
    episodeId: string
  ): EpisodeLocal | null {
    const series = this.getSeries(libraryId, showId);

    console.log({ seriesId: series?.id });

    if (!series) return null;

    const season = series.seasons.find((season) => season.id === seasonId);

    console.log({ seasonId: season?.id });

    if (!season) return null;

    const episode = season.getEpisodeById(episodeId);

    return episode || null;
  }

  public static getEpisodeByPath(
    libraryId: string,
    episodePath: string
  ): Episode | null {
    const library = this.getLibrary(libraryId);

    if (!library) return null;

    for (const series of library.series) {
      if (!series.seasons) return null;
      for (const season of series.seasons) {
        if (!season.episodes) return null;
        for (const episode of season.episodes) {
          if (episode.videoSrc === episodePath) {
            return episode;
          }
        }
      }
    }

    return null;
  }
  //#endregion

  //#region UPDATE DATA

  /**
   * Checks if two objects have different properties or values
   * @param obj1 first object to compare
   * @param obj2 second object to compare
   * @returns true if the objects have changes, false otherwise
   */
  private static hasChanges(obj1: object, obj2: object): boolean {
    return JSON.stringify(obj1) !== JSON.stringify(obj2);
  }

  public static updateLibrary(libraryId: string, library: Library) {
    const libraryToEdit = this.libraries.find((l) => l.id === libraryId);

    if (libraryToEdit) {
      const previousState = { ...libraryToEdit };

      Object.assign(libraryToEdit, library);

      // Update data if it has changed
      if (this.hasChanges(previousState, libraryToEdit)) {
        this.saveData(this.libraries.map((library) => library.toJSON()));
      }
    }
  }

  public static updateShow(libraryId: string, showId: string, show: Series) {
    const library = this.libraries.find((l) => l.id === libraryId);

    if (!library) return;

    const showToEdit = library.getSeriesById(showId);

    if (showToEdit) {
      const previousState = { ...showToEdit };

      Object.assign(showToEdit, show);

      // Update data if it has changed
      if (this.hasChanges(previousState, showToEdit)) {
        this.saveData(this.libraries.map((library) => library.toJSON()));
      }
    }
  }

  public static updateSeason(
    libraryId: string,
    seriesId: string,
    seasonId: string,
    season: Season
  ) {
    const library = this.libraries.find((library) => library.id === libraryId);

    if (!library) return;

    const series = library.getSeriesById(seriesId);

    if (!series) return;

    const seasonToEdit = series
      .getSeasons()
      .find((season) => season.id === seasonId);

    if (seasonToEdit) {
      const previousState = { ...seasonToEdit };

      Object.assign(seasonToEdit, season);

      // Update data if it has changed
      if (this.hasChanges(previousState, seasonToEdit)) {
        this.saveData(this.libraries.map((library) => library.toJSON()));
      }
    }
  }

  public static updateEpisode(
    libraryId: string,
    seriesId: string,
    episode: EpisodeData
  ) {
    const library = this.libraries.find((library) => library.id === libraryId);

    if (!library) return;

    const series = library.getSeriesById(seriesId);

    if (!series) return;

    const season = series
      .getSeasons()
      .find((season) => season.id === episode.seasonID);

    if (!season) return;

    const episodeToEdit = season.getEpisodeById(episode.id);
    const episodeObject = Episode.fromJSON(episode);

    if (episodeToEdit) {
      const previousState = { ...episodeToEdit };

      Object.assign(episodeToEdit, episodeObject);

      // Update data if it has changed
      if (this.hasChanges(previousState, episodeToEdit)) {
        this.saveData(this.libraries.map((library) => library.toJSON()));
      }
    }
  }
  //#endregion

  //#region DELETE DATA
  public static async deleteLibrary(libraryId: string) {
    const libraryToFind = this.libraries.find((obj) => obj.id === libraryId);

    if (!libraryToFind) return;

    for (const series of libraryToFind.series) {
      await this.deleteSeriesData(libraryToFind, series);
    }

    this.libraries = this.libraries.filter((obj) => obj.id !== libraryId);

    if (this.library && this.library.id === libraryId) {
      this.library = this.libraries[0] || undefined;
    }

    // Save data
    this.saveData(this.libraries.map((library) => library.toJSON()));
  }

  // Delete show object and stored data
  public static async deleteShow(libraryId: string, seriesId: string) {
    const library = this.libraries.find((l) => l.id === libraryId);

    if (!library) return;

    const series = library.getSeriesById(seriesId);

    if (!series) return;

    // Delete stored data
    await this.deleteSeriesData(library, series);

    // Delete show object
    library.series = library.series.filter((s) => s.id !== seriesId);
  }

  // Delete show stored data
  public static async deleteSeriesData(library: Library, series: Series) {
    try {
      await fs.remove(path.join("resources", "img", "posters", series.id));
      await fs.remove(path.join("resources", "img", "logos", series.id));
    } catch (error) {
      console.error(
        "deleteSeriesData: Error deleting cover images directory",
        error
      );
    }

    for (const season of series.seasons) {
      await this.deleteSeasonData(library, season);
    }

    library.getAnalyzedFolders().delete(series.folder);
  }

  // Delete season object and stored data
  public static async deleteSeason(
    libraryId: string,
    seriesId: string,
    seasonId: string
  ) {
    const library = this.libraries.find((l) => l.id === libraryId);

    if (!library) return;

    const series = library.getSeriesById(seriesId);

    if (!series) return;

    const season = series.getSeasons().find((s) => s.id === seasonId);

    if (!season) return;

    // Delete stored data
    await this.deleteSeasonData(library, season);

    // Delete season object
    series.seasons = series.seasons.filter((s) => s.id !== seasonId);
  }

  // Delete season stored data
  public static async deleteSeasonData(library: Library, season: Season) {
    try {
      await fs.remove(path.join("resources", "img", "backgrounds", season.id));
      await fs.remove(path.join("resources", "img", "logos", season.id));
      await fs.remove(path.join("resources", "img", "posters", season.id));

      if (season.musicSrc) {
        await fs.remove(season.musicSrc);
      }
      if (season.videoSrc) {
        await fs.remove(season.videoSrc);
      }
    } catch (error) {
      console.error(
        "deleteSeasonData: Error deleting images files and directories",
        error
      );
    }

    for (const episode of season.episodes) {
      await this.deleteEpisodeData(library, episode);
    }

    library.getSeasonFolders().delete(season.folder);
  }

  // Delete episode object and stored data
  public static async deleteEpisode(
    libraryId: string,
    seriesId: string,
    seasonId: string,
    episodeId: string
  ) {
    const library = this.libraries.find((l) => l.id === libraryId);

    if (!library) return;

    const series = library.getSeriesById(seriesId);

    if (!series) return;

    const season = series.getSeasons().find((s) => s.id === seasonId);

    if (!season) return;

    const episode = season.getEpisodeById(episodeId);

    if (!episode) return;

    // Delete stored data
    await this.deleteEpisodeData(library, episode);

    // Delete episode object
    season.episodes = season.episodes.filter((e) => e.id !== episodeId);
  }

  // Delete episode stored data
  public static async deleteEpisodeData(
    library: Library,
    episode: EpisodeLocal
  ) {
    try {
      await fs.remove(
        path.join("resources", "img", "thumbnails", "video", episode.id)
      );
      await fs.remove(
        path.join("resources", "img", "thumbnails", "chapters", episode.id)
      );
    } catch (error) {
      console.error(
        "deleteEpisodeData: Error deleting directory: resources/img/discCovers/" +
          episode.id,
        error
      );
    }

    library.getAnalyzedFiles().delete(episode.videoSrc);
  }
  //#endregion
}
