import { Episode, Library, Season, Series } from './Media'

export interface HomeInfoElement {
  library: Library
  show: Series
  season: Season
  episode: Episode
}
