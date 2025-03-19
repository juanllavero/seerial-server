import { LibraryData } from "../interfaces/LibraryData";
import { SeriesData } from "../interfaces/SeriesData";
import { Series } from "./Series";

export class Library {
  id: string;
  name: string;
  language: string;
  type: string;
  order: number;
  folders: string[];
  series: Series[] = [];
  seriesList: string[] = [];
  analyzedFiles: Map<string, string> = new Map();
  analyzedFolders: Map<string, string> = new Map();
  seasonFolders: Map<string, string> = new Map();
  preferAudioLan: string | undefined;
  preferSubLan: string | undefined;
  subsMode: string | undefined;

  constructor(
    name: string,
    lang: string,
    type: string,
    order: number,
    folders: string[],
    preferAudioLan: string | undefined,
    preferSubLan: string | undefined,
    subsMode: string | undefined
  ) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.language = lang;
    this.type = type;
    this.order = order;
    this.folders = folders;
    this.preferAudioLan = preferAudioLan;
    this.preferSubLan = preferSubLan;
    this.subsMode = subsMode;
  }

  toLibraryData(): LibraryData {
    return {
      id: this.id,
      name: this.name,
      language: this.language,
      type: this.type,
      order: this.order,
      folders: this.folders,
      seriesList: this.seriesList,
      series: this.series.map((s) => {
        if (s) return s.toJSON();
      }),
      analyzedFiles: Array.from(this.analyzedFiles.entries()),
      analyzedFolders: Array.from(this.analyzedFolders.entries()),
      seasonFolders: Array.from(this.seasonFolders.entries()),
      preferAudioLan: this.preferAudioLan,
      preferSubLan: this.preferSubLan,
      subsMode: this.subsMode,
    };
  }

  static fromLibraryData(data: LibraryData): Library {
    const library = new Library(
      data.name,
      data.language,
      data.type,
      data.order,
      data.folders,
      data.preferAudioLan,
      data.preferSubLan,
      data.subsMode
    );
    library.id = data.id;
    library.series = data.series.map((s: SeriesData) => Series.fromJSON(s)); // Convierte SeriesData a Series
    library.seriesList = data.seriesList;
    library.analyzedFiles = new Map(data.analyzedFiles || []);
    library.analyzedFolders = new Map(data.analyzedFolders || []);
    library.seasonFolders = new Map(data.seasonFolders || []);
    return library;
  }

  // Convertir Library a JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      language: this.language,
      type: this.type,
      order: this.order,
      folders: this.folders,
      series: this.series.map((s) => {
        if (s) return s.toJSON();
      }),
      seriesList: this.seriesList,
      analyzedFiles: Array.from(this.analyzedFiles.entries()), // Convertir Map a array de pares
      analyzedFolders: Array.from(this.analyzedFolders.entries()),
      seasonFolders: Array.from(this.seasonFolders.entries()),
      preferAudioLan: this.preferAudioLan,
      preferSubLan: this.preferSubLan,
      subsMode: this.subsMode,
    };
  }

  // Crear una instancia de Library desde JSON
  static fromJSON(jsonData: any): Library {
    const library = new Library(
      jsonData.name,
      jsonData.language,
      jsonData.type,
      jsonData.order,
      jsonData.folders,
      jsonData.preferAudioLan,
      jsonData.preferSubLan,
      jsonData.subsMode
    );

    library.id = jsonData.id;
    library.seriesList = jsonData.seriesList;
    library.series = jsonData.series.map((s: any) => Series.fromJSON(s));
    library.analyzedFiles = new Map(
      Object.entries(jsonData.analyzedFiles || {})
    );
    library.analyzedFolders = new Map(
      Object.entries(jsonData.analyzedFolders || {})
    );
    library.seasonFolders = new Map(
      Object.entries(jsonData.seasonFolders || {})
    );

    return library;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getLanguage(): string {
    return this.language;
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  getType(): string {
    return this.type;
  }

  setType(type: string): void {
    this.type = type;
  }

  getFolders(): string[] {
    return this.folders;
  }

  setFolders(folders: string[]): void {
    this.folders = folders;
  }

  getSeries(): Series[] {
    return this.series;
  }

  getAnalyzedFiles(): Map<string, string> {
    return this.analyzedFiles;
  }

  setAnalyzedFiles(analyzedFiles: Map<string, string>): void {
    this.analyzedFiles = analyzedFiles;
  }

  getAnalyzedFolders(): Map<string, string> {
    return this.analyzedFolders;
  }

  setAnalyzedFolders(analyzedFolders: Map<string, string>): void {
    this.analyzedFolders = analyzedFolders;
  }

  getSeasonFolders(): Map<string, string> {
    return this.seasonFolders;
  }

  setSeasonFolders(seasonFolders: Map<string, string>): void {
    this.seasonFolders = seasonFolders;
  }

  removeSeries(s: Series): void {
    this.analyzedFolders.delete(s.getFolder());
    this.series = this.series.filter((serie) => serie.getId() !== s.getId());
  }

  getSeriesById(id: string): Series | null {
    return this.series.find((serie) => serie.getId() === id) || null;
  }

  getOrder(): number {
    return this.order;
  }

  setOrder(order: number): void {
    this.order = order;
  }
}
