import { API, useCreate, useSetMovieWatchState } from '@seerial/api';
import {
  type DetailsData,
  formatDate,
  formatTimeForView,
  type Movie,
  type Video,
} from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
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
  const queryClient = useQueryClient();
  const { currentUser } = useServerStore(
    (state) => ({
      currentUser: state.currentUser,
    }),
    shallow,
  );
  const navigate = useNavigate();
  const { create: mutateMyList, isLoading: isMutatingMyList } = useCreate<unknown>();
  const { mutateAsync: setMovieWatchState, isPending: isUpdatingWatchState } =
    useSetMovieWatchState<unknown, { watched: boolean }>(movie?.id ?? '');

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

  const isWatched = useMemo(() => {
    return (
      movie?.watchLists?.some(
        (watchList) => watchList.userId === currentUser?.id && watchList.watched,
      ) ?? false
    );
  }, [movie, currentUser]);
  const isInMyList = useMemo(() => {
    return movie?.myLists?.some((myList) => myList.userId === currentUser?.id) ?? false;
  }, [movie, currentUser]);

  const handleMarkWatched = useCallback(async () => {
    if (!movie || isUpdatingWatchState) {
      return;
    }

    await setMovieWatchState({ watched: !isWatched });
    await queryClient.invalidateQueries({ queryKey: ['movies', 'get', movie.id] });
  }, [movie, isUpdatingWatchState, isWatched, queryClient, setMovieWatchState]);

  const handleAddToMyList = useCallback(async () => {
    if (!movie || !currentUser?.id || isMutatingMyList) {
      return;
    }

    await mutateMyList(API.myList.movies, {
      movieId: movie.id,
      userId: currentUser.id,
    });
    await queryClient.invalidateQueries({ queryKey: ['movies', 'get', movie.id] });
    await queryClient.invalidateQueries({ queryKey: ['myList', 'movies'] });
  }, [movie, currentUser?.id, isMutatingMyList, mutateMyList, queryClient]);

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
        handleMarkWatched={handleMarkWatched}
        handleAddToMyList={handleAddToMyList}
        isWatched={isWatched}
        isInMyList={isInMyList}
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
