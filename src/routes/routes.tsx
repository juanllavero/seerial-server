import { getUser } from '@/lib/auth'
import AlbumDetailsPage from '@/pages/details/album/AlbumDetailsPage'
import CollectionDetailsPage from '@/pages/details/collection/CollectionDetailsPage'
import EpisodeDetailsPage from '@/pages/details/episode/EpisodeDetailsPage'
import MovieDetailsPage from '@/pages/details/movie/MovieDetailsPage'
import SeriesDetailsPage from '@/pages/details/series/SeriesDetailsPage'
import HomePage from '@/pages/home/HomePage'
import LibraryPage from '@/pages/library/LibraryPage'
import LoginPage from '@/pages/login/LoginPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import VideoPlayerPage from '@/pages/videoPlayer/VideoPlayerPage'
import { createRoute, redirect } from '@tanstack/react-router'
import { RootRoute } from './__root'

export const HomeRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: HomePage,
})

export const LoginRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/login',
  component: LoginPage,
})

export const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/settings',
  component: SettingsPage,
})

export const ServerRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/server/$serverId',
  loader: async ({ params }) => {
    const { serverId } = params

    const user = await getUser()
    const server = user?.servers.find((server) => server.id === serverId)

    if (!server) {
      throw redirect({ to: '/' })
    }

    return { server }
  },
})

export const LibraryRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/library/$libraryId',
  component: LibraryPage,
})

export const MovieDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/movie/$movieId',
  component: MovieDetailsPage,
})

export const SeriesDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/series/$seriesId',
  component: SeriesDetailsPage,
})

export const AlbumDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/album/$albumId',
  component: AlbumDetailsPage,
})

export const CollectionDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/collection/$collectionId/$type',
  component: CollectionDetailsPage,
})

export const EpisodeDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/episode/$episodeId',
  component: EpisodeDetailsPage,
})

export const VideoPlayerRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/video-player/$videoId',
  component: VideoPlayerPage,
})

export const rootTree = RootRoute.addChildren([
  HomeRoute,
  LoginRoute,
  SettingsRoute,
  ServerRoute.addChildren([
    LibraryRoute,
    MovieDetailsRoute,
    SeriesDetailsRoute,
    AlbumDetailsRoute,
    CollectionDetailsRoute,
    EpisodeDetailsRoute,
    VideoPlayerRoute,
  ]),
])
