import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
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
import SideBarLayout from '@/pages/sidebarLayout/SideBarLayout'
import VideoPlayerPage from '@/pages/videoPlayer/VideoPlayerPage'
import { memo, useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import Root from './__root'
import { useAuth } from '@/context/auth.context'
import { shallow } from 'zustand/shallow'

// Wrapper for ServerRoute to handle loader logic
function ServerRouteWrapper() {
  const { serverId } = useParams()
  const { logout } = useAuth()
  const { selectedServer, selectServer } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      selectServer: state.selectServer,
    }),
    shallow,
  )
  const [loading, setLoading] = useState(true)

  async function loadServer(loadFirst: boolean) {
    const user = await getUser()

    if (!user) {
      logout()
      return <Navigate to="/login" replace />
    }

    const foundServer = user.servers.find((s) => s.id === serverId)
    selectServer(
      (foundServer ?? loadFirst)
        ? user.servers && user.servers.length > 0
          ? user.servers[0]
          : null
        : null,
    )
    setLoading(false)
  }

  useEffect(() => {
    loadServer(false)
  }, [serverId])

  if (loading) {
    return <Loading />
  }

  if (!selectedServer) {
    loadServer(true)
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />}>
        <Route path="/login" element={<LoginPage />} />
        <Route index element={<Navigate to="/home" replace />} />
        <Route element={<SideBarLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/server/:serverId/*" element={<ServerRouteWrapper />}>
            <Route index element={<Navigate to="library" replace />} />
            <Route path="library/:libraryId/:type" element={<LibraryPage />} />
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
          </Route>
        </Route>
        <Route path="/server/:serverId/*" element={<ServerRouteWrapper />}>
          <Route path="video-player/:videoId" element={<VideoPlayerPage />} />
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
