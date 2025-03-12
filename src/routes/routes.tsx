import CollectionPage from '@/pages/collection/CollectionPage'
import DetailsPage from '@/pages/details/DetailsPage'
import HomePage from '@/pages/home/HomePage'
import SettingsPage from '@/pages/settings/SettingsPage'
import VideoPlayerPage from '@/pages/videoPlayer/VideoPlayerPage'
import { createRoute } from '@tanstack/react-router'
import { RootRoute } from './__root'

export const HomeRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: HomePage,
})

export const CollectionRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/collection/$libraryId',
  component: CollectionPage,
})

export const DetailsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/details/$libraryId/$seriesId',
  component: DetailsPage,
})

export const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/settings',
  component: SettingsPage,
})

export const VideoPlayerRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/video-player/$libraryId/$seriesId/$seasonId/$episodeId',
  component: VideoPlayerPage,
})

export const rootTree = RootRoute.addChildren([
  HomeRoute,
  CollectionRoute,
  DetailsRoute,
  SettingsRoute,
  VideoPlayerRoute,
])
