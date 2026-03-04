import { lazy } from 'react'

export const dialogRegistry = {
  library: lazy(() => import('./library/LibraryDialog')),

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
  deleteSeries: lazy(() => import('./delete/DeleteDialog')),
  deleteMovie: lazy(() => import('./delete/DeleteDialog')),
  deleteSeason: lazy(() => import('./delete/DeleteDialog')),
  deleteEpisode: lazy(() => import('./delete/DeleteDialog')),
  deleteAlbum: lazy(() => import('./delete/DeleteDialog')),
  deleteSong: lazy(() => import('./delete/DeleteDialog')),
  deleteCollection: lazy(() => import('./delete/DeleteDialog')),
  deleteLibrary: lazy(() => import('./delete/DeleteDialog')),
} as const

export type DialogType = keyof typeof dialogRegistry
