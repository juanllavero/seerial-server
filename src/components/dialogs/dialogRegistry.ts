import { lazy } from 'react'

// Registry of dialog components
export const dialogRegistry = {
  library: lazy(() => import('./library/LibraryDialog')),
  removeLibrary: lazy(() => import('./remove/RemoveLibraryDialog')),
  collection: lazy(() => import('./collection/CollectionDialog')),
  movie: lazy(() => import('./movie/MovieDialog')),
  series: lazy(() => import('./series/SeriesDialog')),
  season: lazy(() => import('./season/SeasonDialog')),
  episode: lazy(() => import('./episode/EpisodeDialog')),
  album: lazy(() => import('./album/AlbumDialog')),
  downloadMedia: lazy(() => import('./downloadMedia/DownloadMediaDialog')),
  identification: lazy(
    () => import('./identification/ChangeIdentificationDialog'),
  ),
  episodesGroup: lazy(
    () => import('./episodesGroup/ChangeEpisodesGroupDialog'),
  ),
} as const

export type DialogType = keyof typeof dialogRegistry
