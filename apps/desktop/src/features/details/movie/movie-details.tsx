import {
  API,
  apiClient,
  unwrapApiPayload,
  useGetLibrary,
  useSetMovieWatchState,
  useUpdateVideoMediaInfo,
} from '@seerial/api';
import {
  type DetailsData,
  formatDate,
  formatTimeForView,
  getAudioTrack,
  getSubtitleTrack,
  type LibraryType,
  type Movie,
  type Video,
} from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import DetailsBackgroundLayers from '@/shared/components/details/details-background-layers';
import DetailsBackgroundPlayback from '@/shared/components/details/details-background-playback';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';
import { DetailsWithRelatedContent } from '../shared';

interface MovieDetailsProps {
  movie: Movie | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
  collectionId?: string;
  libraryType?: LibraryType;
}

function MovieDetails({ movie, isLoading, details, collectionId, libraryType }: MovieDetailsProps) {
  const [selectedVideo, selectVideo] = useState<Video | null>(null);
  const [resolvedVideoData, setResolvedVideoData] = useState<Map<string, Video>>(new Map());
  const [isBackgroundVideoVisible, setIsBackgroundVideoVisible] = useState(false);
  const backgroundImageSrc = details?.backgroundSrc ?? movie?.backgroundSrc ?? movie?.coverSrc;
  const queryClient = useQueryClient();
  const { currentUser } = useServerStore(
    (state) => ({
      currentUser: state.currentUser,
    }),
    shallow,
  );
  const navigate = useNavigate();
  const { mutateAsync: setMovieWatchState, isPending: isUpdatingWatchState } =
    useSetMovieWatchState<unknown, { watched: boolean }>(movie?.id ?? '');
  const { mutateAsync: updateMediaInfo } = useUpdateVideoMediaInfo(selectedVideo?.id ?? '');

  const { data: library } = useGetLibrary(movie?.libraryId ?? '', {
    enabled: !!movie?.libraryId,
  });

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

  const handleMarkWatched = useCallback(async () => {
    if (!movie || isUpdatingWatchState) {
      return;
    }

    await setMovieWatchState({ watched: !isWatched });
    await queryClient.invalidateQueries({
      queryKey: ['movies', 'get', movie.id],
    });
  }, [movie, isUpdatingWatchState, isWatched, queryClient, setMovieWatchState]);

  useEffect(() => {
    if (!selectedVideo?.id || (selectedVideo.audioTracks && selectedVideo.audioTracks.length > 0))
      return;
    if (resolvedVideoData.has(selectedVideo.id)) return;

    const videoId = selectedVideo.id;
    updateMediaInfo()
      .then(() => apiClient.get(API.videos.get(videoId)))
      .then((response) => {
        const updatedVideo = unwrapApiPayload<Video>(response.data);
        setResolvedVideoData((prev) => new Map(prev).set(videoId, updatedVideo));
      })
      .catch(() => {});
  }, [selectedVideo, resolvedVideoData, updateMediaInfo]);

  const effectiveVideo = useMemo(
    () => (selectedVideo ? (resolvedVideoData.get(selectedVideo.id) ?? selectedVideo) : null),
    [selectedVideo, resolvedVideoData],
  );

  const movieAudioInfo = useMemo(() => {
    if (!effectiveVideo || !library) return undefined;
    return getAudioTrack(library.preferAudioLan ?? '', effectiveVideo)?.displayTitle;
  }, [effectiveVideo, library]);

  const movieSubtitleInfo = useMemo(() => {
    if (!effectiveVideo || !library) return undefined;
    return getSubtitleTrack(
      library.preferSubLan ?? '',
      library.subsMode ?? 'autoSubs',
      effectiveVideo,
    )?.displayTitle;
  }, [effectiveVideo, library]);

  if (!isLoading && !movie) return <span>Movie not found</span>;

  return (
    <DetailsWithRelatedContent
      collectionId={collectionId}
      currentItemId={movie?.id}
      currentItemType="movie"
      libraryType={libraryType}
      background={
        <>
          {!!movie?.id && (
            <DetailsBackgroundPlayback
              audioLocalIds={[movie.id]}
              videoLocalIds={[movie.id]}
              onVideoVisibilityChange={setIsBackgroundVideoVisible}
            />
          )}
          <DetailsBackgroundLayers
            imageSrc={backgroundImageSrc}
            isHidden={isBackgroundVideoVisible}
          />
        </>
      }
    >
      <Page justify="end" padding="4dvh 0" fullScreen>
        <DetailsInfo
          details={details}
          subtitle={movie?.videos && movie.videos.length > 1 ? selectedVideo?.title : undefined}
          expandedImageSrc={details?.coverSrc ?? movie?.coverSrc}
          expandedTitle={details?.title ?? movie?.name}
          cast={movie?.cast}
          infoItems={[
            formatDate(details?.year ?? movie?.year ?? ''),
            selectedVideo ? formatTimeForView(selectedVideo.runtime ?? 0) : '',
          ]}
          audioInfo={movieAudioInfo}
          subtitleInfo={movieSubtitleInfo}
          videoInfo={effectiveVideo?.videoTracks?.[0]?.displayTitle}
          handlePlay={handlePlay}
          handleMarkWatched={handleMarkWatched}
          isWatched={isWatched}
        />
      </Page>
    </DetailsWithRelatedContent>
  );
}

export default memo(MovieDetails);
