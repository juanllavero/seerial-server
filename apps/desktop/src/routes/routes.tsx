import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/pages/login/login-page';
import TopBarLayout from '@/pages/top-bar-layout/top-bar-layout';
import AlbumDetails from '../pages/details/album/AlbumDetails';
import CollectionDetails from '../pages/details/collection/CollectionDetails';
import MovieDetails from '../pages/details/movie/MovieDetails';
import SeriesDetails from '../pages/details/series/SeriesDetails';
import Home from '../pages/home/home-page';
import Library from '../pages/library/library-page';
import VideoPlayer from '../pages/videoplayer/VideoPlayer';
import Root from './root';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />}>
        <Route path="/login" element={<LoginPage />} />
        <Route index element={<Navigate to="/home" replace />} />
        <Route element={<TopBarLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/home2" element={<VideoPlayer />} />
          <Route index element={<Navigate to="library" replace />} />
          <Route path="library/:libraryId/:type" element={<Library />} />
          <Route path="details/movie/:movieId" element={<MovieDetails />} />
          <Route path="details/series/:seriesId" element={<SeriesDetails />} />
          <Route path="details/album/:albumId" element={<AlbumDetails />} />
          <Route path="details/collection/:collectionId/:type" element={<CollectionDetails />} />
        </Route>
        <Route path="video-player/:videoId" element={<VideoPlayer />} />
      </Route>
    </Routes>
  );
}
