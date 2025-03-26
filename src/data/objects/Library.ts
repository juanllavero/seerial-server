import { Library, Series } from '../interfaces/Media'

export class LibraryObject {
  id: string
  name: string
  language: string
  type: string
  order: number
  folders: string[]
  series: Series[]
  seriesList: string[] = []
  analyzedFiles: Map<string, string> = new Map()
  analyzedFolders: Map<string, string> = new Map()
  seasonFolders: Map<string, string> = new Map()
  preferAudioLan: string | undefined
  preferSubLan: string | undefined
  subsMode: string | undefined
  isCollection: boolean

  constructor(
    name: string,
    lang: string,
    type: string,
    order: number,
    folders: string[],
    preferAudioLan: string | undefined,
    preferSubLan: string | undefined,
    subsMode: string | undefined,
  ) {
    // Generates 4 random bytes (32 bits)
    const array = new Uint8Array(4)
    window.crypto.getRandomValues(array)
    // Converts the bytes to hexadecimal
    this.id = Array.from(array)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

    this.name = name
    this.language = lang
    this.type = type
    this.order = order
    this.folders = folders
    this.preferAudioLan = preferAudioLan
    this.preferSubLan = preferSubLan
    this.subsMode = subsMode
    this.isCollection = false
    this.series = []
  }

  toLibraryData(): Library {
    return {
      id: this.id,
      name: this.name,
      language: this.language,
      type: this.type,
      series: [],
      seriesList: this.seriesList,
      order: this.order,
      folders: this.folders,
      analyzedFiles: Array.from(this.analyzedFiles.entries()),
      analyzedFolders: Array.from(this.analyzedFolders.entries()),
      seasonFolders: Array.from(this.seasonFolders.entries()),
      preferAudioLan: this.preferAudioLan,
      preferSubLan: this.preferSubLan,
      subsMode: this.subsMode,
      isCollection: this.isCollection,
    }
  }

  static fromLibraryData(data: Library): Library {
    const library = new LibraryObject(
      data.name,
      data.language,
      data.type,
      data.order,
      data.folders,
      data.preferAudioLan,
      data.preferSubLan,
      data.subsMode,
    )
    library.id = data.id
    library.seriesList = data.seriesList
    library.analyzedFiles = new Map(data.analyzedFiles || [])
    library.analyzedFolders = new Map(data.analyzedFolders || [])
    library.seasonFolders = new Map(data.seasonFolders || [])
    return library
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
      seriesList: this.seriesList,
      analyzedFiles: Array.from(this.analyzedFiles.entries()),
      analyzedFolders: Array.from(this.analyzedFolders.entries()),
      seasonFolders: Array.from(this.seasonFolders.entries()),
      preferAudioLan: this.preferAudioLan,
      preferSubLan: this.preferSubLan,
      subsMode: this.subsMode,
    }
  }

  // Crear una instancia de Library desde JSON
  static fromJSON(jsonData: any): Library {
    const library = new LibraryObject(
      jsonData.name,
      jsonData.language,
      jsonData.type,
      jsonData.order,
      jsonData.folders,
      jsonData.preferAudioLan,
      jsonData.preferSubLan,
      jsonData.subsMode,
    )

    library.id = jsonData.id
    library.seriesList = jsonData.seriesList
    library.analyzedFiles = new Map(
      Object.entries(jsonData.analyzedFiles || {}),
    )
    library.analyzedFolders = new Map(
      Object.entries(jsonData.analyzedFolders || {}),
    )
    library.seasonFolders = new Map(
      Object.entries(jsonData.seasonFolders || {}),
    )

    return library
  }

  getId(): string {
    return this.id
  }

  getName(): string {
    return this.name
  }

  setName(name: string): void {
    this.name = name
  }

  getLanguage(): string {
    return this.language
  }

  setLanguage(language: string): void {
    this.language = language
  }

  getType(): string {
    return this.type
  }

  setType(type: string): void {
    this.type = type
  }

  getFolders(): string[] {
    return this.folders
  }

  setFolders(folders: string[]): void {
    this.folders = folders
  }

  getAnalyzedFiles(): Map<string, string> {
    return this.analyzedFiles
  }

  setAnalyzedFiles(analyzedFiles: Map<string, string>): void {
    this.analyzedFiles = analyzedFiles
  }

  getAnalyzedFolders(): Map<string, string> {
    return this.analyzedFolders
  }

  setAnalyzedFolders(analyzedFolders: Map<string, string>): void {
    this.analyzedFolders = analyzedFolders
  }

  getSeasonFolders(): Map<string, string> {
    return this.seasonFolders
  }

  setSeasonFolders(seasonFolders: Map<string, string>): void {
    this.seasonFolders = seasonFolders
  }

  getOrder(): number {
    return this.order
  }

  setOrder(order: number): void {
    this.order = order
  }
}
