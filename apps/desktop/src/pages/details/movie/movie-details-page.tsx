import { useGetMovie } from '@seerial/api';
import type { DetailsData, Movie } from '@seerial/domain';
import { memo } from 'react';
import { useLocation, useParams } from 'react-router';
import MovieDetails from '@/features/details/movie/movie-details';

function MovieDetailsPage() {
  const { movieId } = useParams();
  const { state } = useLocation();
  const cachedDetails: DetailsData | undefined = state?.cachedDetails;

  const { data: movie, isLoading } = useGetMovie<Movie>(movieId ?? '', {
    enabled: !!movieId,
  });

  return <MovieDetails movie={movie} isLoading={isLoading} details={cachedDetails} />;
}

export default memo(MovieDetailsPage);
