import { useGetMovie } from '@seerial/api';
import type { Movie, Video } from '@seerial/domain';
import { formatDate, formatTimeForView } from '@seerial/domain';
import { memo, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import Loading from '@/shared/components/loading';
import Page from '@/shared/components/page';
import DetailsInfo from '../components/DetailsInfo';

function MovieDetails() {
  const { movieId } = useParams();
  const [selectedVideo, selectVideo] = useState<Video | null>(null);

  const { data: movie, isLoading } = useGetMovie<Movie>(movieId ?? '', {
    enabled: !!movieId,
  });

  useEffect(() => {
    if (movie && movie.videos.length > 0) {
      selectVideo(movie.videos[0]);
    }
  }, [movie]);

  if (isLoading) {
    return <Loading />;
  }

  if (!movie) return <span>Movie not found</span>;

  return (
    <Page padding="0 2rem" justify="end">
      <GradientBackground imageSrc={movie?.backgroundSrc ?? movie?.coverSrc} index={0} />
      <DetailsInfo
        title={movie.name}
        logoUrl={movie.logoSrc}
        subtitle={selectedVideo?.title}
        tagline={movie.tagline}
        score={movie.score}
        genres={movie.genres}
        directedBy={movie.directedBy}
        infoItems={[
          formatDate(movie.year),
          selectedVideo ? formatTimeForView(selectedVideo.runtime ?? 0) : '',
        ]}
        overview={movie.overview}
      />
      {/* {movie.videos && movie.videos.length > 1 && (
				<VideosList
					selectedVideo={selectedVideo}
					selectVideo={selectVideo}
				/>
			)} */}
    </Page>
  );
}

export default memo(MovieDetails);
