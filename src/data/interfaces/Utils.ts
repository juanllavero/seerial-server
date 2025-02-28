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
  id: string
  title: string
  overview: string
  date: string
  poster: string
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

//#region DropDown Menu
export interface DropdownItem {
  title: string
  shortcut?: string
  action: () => void
  disabled?: boolean
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
