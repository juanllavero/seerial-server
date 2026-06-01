import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Root from './root';

const LoginPage = lazy(() => import('@/pages/login/login-page'));
const TVLinkPage = lazy(() => import('@/pages/link/link-page'));
const HomePage = lazy(() => import('@/pages/home/home-page'));
const SettingsPage = lazy(() => import('@/pages/settings/settings-page'));
const LibraryPage = lazy(() => import('@/pages/library/library-page'));
const MovieDetailsPage = lazy(() => import('@/pages/details/movie/movie-details-page'));
const SeriesDetailsPage = lazy(() => import('@/pages/details/series/series-details-page'));
const AlbumDetailsPage = lazy(() => import('@/pages/details/album/album-details-page'));
const CollectionDetailsPage = lazy(
  () => import('@/pages/details/collection/collection-details-page'),
);
const EpisodeDetailsPage = lazy(() => import('@/pages/details/episode/episode-details-page'));
const VideoPlayerPage = lazy(() => import('@/pages/video-player/video-player-page'));
const SideBarLayout = lazy(() => import('@/pages/sidebar-layout/sidebar-layout'));

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
          <Route path="/library/:libraryId/:type" element={<LibraryPage />} />
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
  );
}
