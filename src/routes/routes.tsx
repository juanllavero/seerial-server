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
import Root from './__root'
import SideBarLayout from '@/pages/sidebarLayout/SideBarLayout'
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { memo, useEffect, useState } from 'react'
import React from 'react'
import { Server } from '@/data/interfaces/Users'
import { useServerStore } from '@/context/server.context'

// Wrapper for BaseRoute to handle redirect from '/' to '/home'
function BaseRouteWrapper() {
  if (window.location.pathname === '/') {
    return <Navigate to="/home" replace />
  }
  return <SideBarLayout />
}

// Wrapper for ServerRoute to handle loader logic
function ServerRouteWrapper() {
  const { serverId } = useParams()
  const { selectedServer, selectServer } = useServerStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadServer() {
      console.log(`Server/:serverId:loader [${new Date().toISOString()}]: `, {
        serverId,
      })
      const user = await getUser()
      const foundServer = user?.servers.find((s) => s.id === serverId)
      console.log(foundServer)
      selectServer(foundServer ?? null)
      setLoading(false)
    }
    loadServer()
  }, [serverId])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!selectedServer) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Root />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<BaseRouteWrapper />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/server/:serverId/*" element={<ServerRouteWrapper />}>
            <Route index element={<Navigate to="library" replace />} />
            <Route path="library/:libraryId" element={<LibraryPage />} />
            <Route
              path="details/movie/:movieId"
              element={<MovieDetailsPage />}
            />
            <Route
              path="details/series/:seriesId"
              element={<SeriesDetailsPage />}
            />
            <Route
              path="details/album/:albumId"
              element={<AlbumDetailsPage />}
            />
            <Route
              path="details/collection/:collectionId/:type"
              element={<CollectionDetailsPage />}
            />
            <Route
              path="details/episode/:episodeId"
              element={<EpisodeDetailsPage />}
            />
            <Route path="video-player/:videoId" element={<VideoPlayerPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

// Export memoized components for consistency
export const MemoizedHomePage = memo(HomePage)
export const MemoizedLoginPage = memo(LoginPage)
export const MemoizedSettingsPage = memo(SettingsPage)
export const MemoizedLibraryPage = memo(LibraryPage)
export const MemoizedMovieDetailsPage = memo(MovieDetailsPage)
export const MemoizedSeriesDetailsPage = memo(SeriesDetailsPage)
export const MemoizedAlbumDetailsPage = memo(AlbumDetailsPage)
export const MemoizedCollectionDetailsPage = memo(CollectionDetailsPage)
export const MemoizedEpisodeDetailsPage = memo(EpisodeDetailsPage)
export const MemoizedVideoPlayerPage = memo(VideoPlayerPage)
export const MemoizedSideBarLayout = memo(SideBarLayout)
