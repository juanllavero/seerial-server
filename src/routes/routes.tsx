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
import SideBarLayout from '@/pages/sidebarLayout/SideBarLayout'
import { memo } from 'react'

export const BaseRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/') {
      throw redirect({ to: '/home' })
    }
  },
  component: memo(SideBarLayout),
})

export const HomeRoute = createRoute({
  getParentRoute: () => BaseRoute,
  path: '/home',
  component: memo(HomePage),
})

export const LoginRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/login',
  component: memo(LoginPage),
})

export const SettingsRoute = createRoute({
  getParentRoute: () => BaseRoute,
  path: '/settings',
  component: memo(SettingsPage),
})

export const ServerRoute = createRoute({
  getParentRoute: () => BaseRoute,
  path: '/server/$serverId',
  loader: async ({ params }) => {
    const { serverId } = params

    console.log(`Server/$serverId:loader [${new Date().toISOString()}]: `, {
      serverId: params.serverId,
    })

    const user = await getUser()
    const server = user?.servers.find((server) => server.id === serverId)

    if (!server) {
      throw redirect({ to: '/home' })
    }

    return { server }
  },
})

export const LibraryRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/library/$libraryId',
  component: memo(LibraryPage),
})

export const MovieDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/movie/$movieId',
  component: memo(MovieDetailsPage),
})

export const SeriesDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/series/$seriesId',
  component: memo(SeriesDetailsPage),
})

export const AlbumDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/album/$albumId',
  component: memo(AlbumDetailsPage),
})

export const CollectionDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/collection/$collectionId/$type',
  component: memo(CollectionDetailsPage),
})

export const EpisodeDetailsRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/details/episode/$episodeId',
  component: memo(EpisodeDetailsPage),
})

export const VideoPlayerRoute = createRoute({
  getParentRoute: () => ServerRoute,
  path: '/video-player/$videoId',
  component: memo(VideoPlayerPage),
})

export const rootTree = RootRoute.addChildren([
  LoginRoute,
  BaseRoute.addChildren([
    HomeRoute,
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
  ]),
])
