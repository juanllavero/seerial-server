import { Navigate, Route, Routes } from 'react-router-dom';
import AlbumDetails from '@/pages/details/album/album-details-page';
import CollectionDetails from '@/pages/details/collection/collection-details-page';
import MovieDetails from '@/pages/details/movie/movie-details-page';
import SeriesDetails from '@/pages/details/series/series-details-page';
import Home from '@/pages/home/home-page';
import Library from '@/pages/library/library-page';
import LoginPage from '@/pages/login/login-page';
import ToSeePage from '@/pages/to-see/to-see-page';
import VideoPlayerFile from '@/pages/videoplayer/video-player-file-page';
import VideoPlayer from '@/pages/videoplayer/video-player-page';
import BaseLayout from '@/shared/layouts/base-layout/layout';
import TopBarLayout from '@/shared/layouts/top-bar-layout/layout';
import Root from './root';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />}>
        <Route path="/login" element={<LoginPage />} />
        <Route index element={<Navigate to="/home" replace />} />

        {/* Layout with top bar (excluding details pages) and with a slide animation page transition */}
        <Route element={<TopBarLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="library/:libraryId/:type" element={<Library />} />
          <Route path="details/movie/:movieId" element={<MovieDetails />} />
          <Route path="details/series/:seriesId" element={<SeriesDetails />} />
          <Route path="details/album/:albumId" element={<AlbumDetails />} />
          <Route path="details/collection/:collectionId/:type" element={<CollectionDetails />} />
          <Route path="/see" element={<ToSeePage />} />
        </Route>

        {/* Layout with no top bar and with a fade animation page transition */}
        <Route element={<BaseLayout />}>
          <Route path="video-player/file" element={<VideoPlayerFile />} />
          <Route path="video-player/:videoId" element={<VideoPlayer />} />
        </Route>
      </Route>
    </Routes>
  );
}
