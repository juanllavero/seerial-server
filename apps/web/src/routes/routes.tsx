import { lazy, memo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Root from './__root'

const LoginPage = lazy(() => import('@/pages/login/LoginPage'))
const TVLinkPage = lazy(() => import('@/pages/link/TVLinkPage'))
const HomePage = lazy(() => import('@/pages/home/HomePage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const LibraryPage = lazy(() => import('@/pages/library/LibraryPage'))
const MovieDetailsPage = lazy(() => import('@/pages/details/movie/MovieDetailsPage'))
const SeriesDetailsPage = lazy(() => import('@/pages/details/series/SeriesDetailsPage'))
const AlbumDetailsPage = lazy(() => import('@/pages/details/album/AlbumDetailsPage'))
const CollectionDetailsPage = lazy(() => import('@/pages/details/collection/CollectionDetailsPage'))
const EpisodeDetailsPage = lazy(() => import('@/pages/details/episode/EpisodeDetailsPage'))
const VideoPlayerPage = lazy(() => import('@/pages/videoPlayer/VideoPlayerPage'))
const SideBarLayout = lazy(() => import('@/pages/sidebarLayout/SideBarLayout'))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />}>
        {/* Login Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/link" element={<TVLinkPage />} />

        {/* Default to Home Page */}
        <Route index element={<Navigate to="/home" replace />} />

        {/* Sidebar Content */}
        <Route element={<SideBarLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/library/:libraryId" element={<LibraryPage />} />
          <Route path="/library/:libraryId/movie/:movieId" element={<MovieDetailsPage />} />
          <Route path="/library/:libraryId/series/:seriesId" element={<SeriesDetailsPage />} />
          <Route path="/library/:libraryId/album/:albumId" element={<AlbumDetailsPage />} />
          <Route path="/library/:libraryId/episode/:episodeId" element={<EpisodeDetailsPage />} />

          {/* Collection Details Page */}
          <Route path="/collection/:collectionId/:type" element={<CollectionDetailsPage />} />
        </Route>

        {/* Video Player */}
        <Route path="/video-player/:videoId" element={<VideoPlayerPage />} />
      </Route>
    </Routes>
  )
}

// Export memoized components for consistency
export const MemoizedHomePage = memo(HomePage)
export const MemoizedSettingsPage = memo(SettingsPage)
export const MemoizedLibraryPage = memo(LibraryPage)
export const MemoizedMovieDetailsPage = memo(MovieDetailsPage)
export const MemoizedSeriesDetailsPage = memo(SeriesDetailsPage)
export const MemoizedAlbumDetailsPage = memo(AlbumDetailsPage)
export const MemoizedCollectionDetailsPage = memo(CollectionDetailsPage)
export const MemoizedEpisodeDetailsPage = memo(EpisodeDetailsPage)
export const MemoizedVideoPlayerPage = memo(VideoPlayerPage)
export const MemoizedSideBarLayout = memo(SideBarLayout)
