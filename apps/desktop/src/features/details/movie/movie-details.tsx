import {
  type DetailsData,
  formatDate,
  formatTimeForView,
  type Movie,
  type Video,
} from '@seerial/domain';
import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import BackgroundImage from '@/components/backgrounds/BackgroundImage';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';

interface MovieDetailsProps {
  movie: Movie | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
}

function MovieDetails({ movie, isLoading, details }: MovieDetailsProps) {
  const [selectedVideo, selectVideo] = useState<Video | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (movie && movie.videos.length > 0) {
      selectVideo(movie.videos[0]);
    }
  }, [movie]);

  const handlePlay = useCallback(() => {
    if (selectedVideo) {
      navigate(`/video-player/${selectedVideo.id}`);
    }
  }, [navigate, selectedVideo]);

  if (!isLoading && !movie) return <span>Movie not found</span>;

  return (
    <Page justify="end">
      <GradientBackground
        imageSrc={details?.backgroundSrc ?? movie?.backgroundSrc ?? movie?.coverSrc}
        index={0}
      />
      <BackgroundImage
        imageSrc={details?.backgroundSrc ?? movie?.backgroundSrc ?? movie?.coverSrc}
      />
      <DetailsInfo
        details={details}
        subtitle={movie?.videos && movie.videos.length > 1 ? selectedVideo?.title : undefined}
        infoItems={[
          formatDate(details?.year ?? movie?.year ?? ''),
          selectedVideo ? formatTimeForView(selectedVideo.runtime ?? 0) : '',
        ]}
        handlePlay={handlePlay}
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
