export interface EpisodeGroupResult {
  description: string
  episode_count: number
  group_count: number
  id: string
  name: string
  network: null
  type: number
}

export interface IdentificationResult {
  id: number
  name?: string
  title?: string
  first_air_date?: string
  release_date?: string
  poster_path: string
  overview: string
}

export interface MediaSearchResult {
  id: string
  title: string
  url: string
  duration: number
  thumbnail: string
}

export interface SelectableOption {
  key: string
  value: string
}

export type ValueOption = string | number | boolean

export interface Settings {
  [key: string]: ValueOption
}

export enum SettingsSection {
  ClientGeneral = 1,
  ClientQuality,
  ClientPlayer,
  ServerGeneral,
  ServerTranscode,
  ServerLanguages,
  ServerLibraries,
}

//#region DropDown Menu
export interface DropdownItem {
  title: string
  shortcut?: string
  action: () => void
  hidden?: boolean
  items?: DropdownGroup[]
}

export interface DropdownGroup {
  separator?: boolean
  items: DropdownItem[]
}

export interface DropdownContent {
  title?: string
  items: DropdownGroup[]
}
//#endregion
