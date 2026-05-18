import { lazy } from 'react';

export const dialogRegistry = {
  library: lazy(() => import('./library/library-dialog')),

  collection: lazy(() => import('./collection/collection-dialog')),
  manageCollections: lazy(() => import('./manage-collections/manage-collections-dialog')),
  movie: lazy(() => import('./movie/movie-dialog')),
  series: lazy(() => import('./series/series-dialog')),
  season: lazy(() => import('./season/season-dialog')),
  episode: lazy(() => import('./episode/episode-dialog')),
  album: lazy(() => import('./album/album-dialog')),
  downloadMedia: lazy(() => import('./download-media/download-media-dialog')),
  identification: lazy(() => import('./identification/change-identification-dialog')),
  episodesGroup: lazy(() => import('./episodes-group/change-episodes-group-dialog')),
  deleteSeries: lazy(() => import('./delete/delete-dialog')),
  deleteMovie: lazy(() => import('./delete/delete-dialog')),
  deleteSeason: lazy(() => import('./delete/delete-dialog')),
  deleteEpisode: lazy(() => import('./delete/delete-dialog')),
  deleteAlbum: lazy(() => import('./delete/delete-dialog')),
  deleteSong: lazy(() => import('./delete/delete-dialog')),
  deleteCollection: lazy(() => import('./delete/delete-dialog')),
  deleteLibrary: lazy(() => import('./delete/delete-dialog')),
} as const;

export type DialogType = keyof typeof dialogRegistry;
