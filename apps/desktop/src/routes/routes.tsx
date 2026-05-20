import { Navigate, Route, Routes } from 'react-router-dom';
import {
  AlbumDetails,
  CollectionDetails,
  Home,
  Library,
  LoginPage,
  MovieDetails,
  SearchPage,
  SeriesDetails,
  ToSeePage,
  VideoPlayer,
  VideoPlayerFile,
} from '@/pages';
import { BaseLayout, TopBarLayout } from '@/shared/layouts';
import Root from './root';

export default function AppRoutes() {
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
          <Route path="/search" element={<SearchPage />} />
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
