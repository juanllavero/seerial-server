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
import { memo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Root from './__root'
import TVLinkPage from '@/pages/link/TVLinkPage'
import UsersPage from '@/pages/users/UsersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/link" element={<TVLinkPage />} />
        <Route index element={<Navigate to="/home" replace />} />
        <Route element={<SideBarLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="library/:libraryId/:type" element={<LibraryPage />} />
          <Route path="details/movie/:movieId" element={<MovieDetailsPage />} />
          <Route
            path="details/series/:seriesId"
            element={<SeriesDetailsPage />}
          />
          <Route path="details/album/:albumId" element={<AlbumDetailsPage />} />
          <Route
            path="details/collection/:collectionId/:type"
            element={<CollectionDetailsPage />}
          />
          <Route
            path="details/episode/:episodeId"
            element={<EpisodeDetailsPage />}
          />
        </Route>
        <Route path="video-player/:videoId" element={<VideoPlayerPage />} />
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
