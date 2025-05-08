import AlbumDetailsPage from '@/pages/details/album/AlbumDetailsPage'
import CollectionDetailsPage from '@/pages/details/collection/CollectionDetailsPage'
import EpisodeDetailsPage from '@/pages/details/episode/EpisodeDetailsPage'
import MovieDetailsPage from '@/pages/details/movie/MovieDetailsPage'
import SeriesDetailsPage from '@/pages/details/series/SeriesDetailsPage'
import HomePage from '@/pages/home/HomePage'
import LibraryPage from '@/pages/library/LibraryPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import VideoPlayerPage from '@/pages/videoPlayer/VideoPlayerPage'
import { createRoute } from '@tanstack/react-router'
import { RootRoute } from './__root'

export const HomeRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: HomePage,
})

export const LibraryRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/library/$libraryId',
  component: LibraryPage,
})

export const MovieDetailsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/details/movie/$movieId',
  component: MovieDetailsPage,
})

export const SeriesDetailsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/details/series/$seriesId',
  component: SeriesDetailsPage,
})

export const AlbumDetailsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/details/album/$albumId',
  component: AlbumDetailsPage,
})

export const CollectionDetailsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/details/collection/$collectionId/$type',
  component: CollectionDetailsPage,
})

export const EpisodeDetailsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/details/episode/$episodeId',
  component: EpisodeDetailsPage,
})

export const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/settings',
  component: SettingsPage,
})

export const VideoPlayerRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/video-player/$videoId',
  component: VideoPlayerPage,
})

export const rootTree = RootRoute.addChildren([
  HomeRoute,
  LibraryRoute,
  MovieDetailsRoute,
  SeriesDetailsRoute,
  AlbumDetailsRoute,
  CollectionDetailsRoute,
  EpisodeDetailsRoute,
  SettingsRoute,
  VideoPlayerRoute,
])
