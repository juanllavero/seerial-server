import {
  API,
  apiClient,
  unwrapApiPayload,
  useSetEpisodeWatchState,
  useUpdateVideoMediaInfo,
} from '@seerial/api';
import type { DetailsData, Episode, LibraryType, Season, Series, Video } from '@seerial/domain';
import { formatDate, formatTimeForView, getAudioTrack, getSubtitleTrack } from '@seerial/domain';
import { useLocalStorage } from '@seerial/hooks';
import { useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import EpisodesList, {
  MAX_SKELETON_COUNT,
} from '@/features/details/series/components/episodes-list';
import SeasonSelector from '@/features/details/series/components/season-selector';
import { useSeriesDetailsFocusStore } from '@/features/details/series/stores/series-details-focus.store';
import DetailsBackgroundLayers from '@/shared/components/details/details-background-layers';
import DetailsBackgroundPlayback from '@/shared/components/details/details-background-playback';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';
import { DetailsWithRelatedContent } from '../shared';

interface SeriesDetailsProps {
  series: Series | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
  numberOfItems: number | undefined;
  currentSeasonNumber: number | undefined;
  focusedEpisodeId?: string;
  collectionId?: string;
  libraryType?: LibraryType;
}

function getInitialSeason(
  series: Series | undefined,
  currentSeasonNumber: number | undefined,
): Season | null {
  if (!series?.seasons?.length) {
    return null;
  }

  const seasonByNumber = currentSeasonNumber
    ? series.seasons.find((season) => season.seasonNumber === currentSeasonNumber)
    : null;

  return seasonByNumber ?? series.seasons[0] ?? null;
}

function getSeasonEpisodeState(
  selectedSeason: Season | null,
  getLastFocusedEpisodeForSeason: (seasonId: string) => string | undefined,
  focusedEpisodeId?: string,
): { selectedEpisode: Episode | null; isRestoringEpisodeFocus: boolean } {
  if (!selectedSeason) {
    return { selectedEpisode: null, isRestoringEpisodeFocus: false };
  }

  const sortedEpisodes = [...selectedSeason.episodes].sort(
    (a, b) => a.episodeNumber - b.episodeNumber,
  );

  if (sortedEpisodes.length === 0) {
    return { selectedEpisode: null, isRestoringEpisodeFocus: false };
  }

  const explicitFocusedEpisode = focusedEpisodeId
    ? sortedEpisodes.find((episode) => episode.id === focusedEpisodeId)
    : null;

  if (explicitFocusedEpisode) {
    return { selectedEpisode: explicitFocusedEpisode, isRestoringEpisodeFocus: true };
  }

  const restoredEpisodeId = getLastFocusedEpisodeForSeason(selectedSeason.id);
  const restoredEpisode = restoredEpisodeId
    ? sortedEpisodes.find((episode) => episode.id === restoredEpisodeId)
    : null;

  if (restoredEpisode) {
    return { selectedEpisode: restoredEpisode, isRestoringEpisodeFocus: true };
  }

  return { selectedEpisode: sortedEpisodes[0], isRestoringEpisodeFocus: true };
}

function buildDetailsInfoItems(selectedEpisode: Episode | null, seriesYear: string | undefined) {
  const seasonEpisodeLabel = selectedEpisode
    ? `${t('seasonLetter')}${selectedEpisode.seasonNumber}${t('episodeLetter')}${selectedEpisode.episodeNumber}`
    : '';

  return [
    seasonEpisodeLabel,
    formatDate(selectedEpisode ? String(selectedEpisode.year) : (seriesYear ?? '')),
    selectedEpisode ? formatTimeForView(selectedEpisode.video.runtime ?? 0) : '',
  ];
}

function getEpisodeAudioInfo(
  selectedEpisode: Episode | null,
  series: Series | undefined,
): string | undefined {
  if (!selectedEpisode) {
    return undefined;
  }

  return getAudioTrack(series?.preferAudioLan ?? '', selectedEpisode.video)?.displayTitle;
}

function getEpisodeSubtitleInfo(
  selectedEpisode: Episode | null,
  series: Series | undefined,
): string | undefined {
  if (!selectedEpisode) {
    return undefined;
  }

  return getSubtitleTrack(
    series?.preferSubLan ?? '',
    series?.subsMode ?? 'autoSubs',
    selectedEpisode.video,
  )?.displayTitle;
}

function SeriesDetails({
  series,
  isLoading,
  details,
  numberOfItems,
  currentSeasonNumber,
  focusedEpisodeId,
  collectionId,
  libraryType,
}: SeriesDetailsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useServerStore(
    (state) => ({
      currentUser: state.currentUser,
    }),
    shallow,
  );
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [resolvedVideoData, setResolvedVideoData] = useState<Map<string, Video>>(new Map());
  const [isRestoringEpisodeFocus, setIsRestoringEpisodeFocus] = useState(true);
  const [isBackgroundVideoVisible, setIsBackgroundVideoVisible] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const prevSelectedSeasonIdRef = useRef<string | null>(null);
  const isMarkingWatchedRef = useRef(false);
  const [hideUnwatchedThumbnails, setHideUnwatchedThumbnails] = useLocalStorage<boolean>(
    `hide-thumbnails-${series?.id ?? ''}`,
    false,
  );
  const backgroundImageSrc =
    details?.backgroundSrc ?? selectedSeason?.backgroundSrc ?? series?.coverSrc;

  const getLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
    (state) => state.getLastFocusedEpisodeForSeason,
  );
  const setLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
    (state) => state.setLastFocusedEpisodeForSeason,
  );
  const { mutateAsync: setEpisodeWatchState } = useSetEpisodeWatchState<
    unknown,
    { state: boolean }
  >(selectedEpisode?.id ?? '');
  const { mutateAsync: updateMediaInfo } = useUpdateVideoMediaInfo(selectedEpisode?.video.id ?? '');

  useEffect(() => {
    const video = selectedEpisode?.video;
    if (!video?.id || (video.audioTracks && video.audioTracks.length > 0)) return;
    if (resolvedVideoData.has(video.id)) return;

    const videoId = video.id;
    updateMediaInfo()
      .then(() => apiClient.get(API.videos.get(videoId)))
      .then((response) => {
        const updatedVideo = unwrapApiPayload<Video>(response.data);
        setResolvedVideoData((prev) => new Map(prev).set(videoId, updatedVideo));
      })
      .catch(() => {});
  }, [selectedEpisode, resolvedVideoData, updateMediaInfo]);

  useEffect(() => {
    const seasonToSelect = getInitialSeason(series, currentSeasonNumber);
    setSelectedSeason(seasonToSelect);
  }, [series, currentSeasonNumber]);

  useEffect(() => {
    const nextState = getSeasonEpisodeState(
      selectedSeason,
      getLastFocusedEpisodeForSeason,
      focusedEpisodeId,
    );
    const seasonId = selectedSeason?.id ?? null;
    const seasonChanged = prevSelectedSeasonIdRef.current !== seasonId;
    prevSelectedSeasonIdRef.current = seasonId;
    setSelectedEpisode(nextState.selectedEpisode);
    setIsRestoringEpisodeFocus(seasonChanged ? nextState.isRestoringEpisodeFocus : false);
  }, [selectedSeason, getLastFocusedEpisodeForSeason, focusedEpisodeId]);

  const handleSelectEpisode = useCallback(
    (episode: Episode) => {
      setSelectedEpisode(episode);
      setIsRestoringEpisodeFocus(false);

      if (selectedSeason) {
        setLastFocusedEpisodeForSeason(selectedSeason.id, episode.id);
      }
    },
    [selectedSeason, setLastFocusedEpisodeForSeason],
  );

  const handlePlay = useCallback(() => {
    if (selectedEpisode) {
      navigate(`/video-player/${selectedEpisode.video.id}`);
    }
  }, [selectedEpisode, navigate]);

  const isWatched =
    useMemo(() => {
      return (
        selectedEpisode?.video?.watchLists?.some(
          (watchList) => watchList.userId === currentUser?.id && watchList.watched,
        ) ?? false
      );
    }, [selectedEpisode, currentUser]) ?? false;

  const isWatchedRef = useRef(isWatched);
  isWatchedRef.current = isWatched;

  const detailsInfoItems = useMemo(
    () => buildDetailsInfoItems(selectedEpisode, series?.year),
    [selectedEpisode, series?.year],
  );

  const episodeForTrackInfo = useMemo(() => {
    if (!selectedEpisode) return null;
    const resolved = resolvedVideoData.get(selectedEpisode.video.id);
    return resolved ? { ...selectedEpisode, video: resolved } : selectedEpisode;
  }, [selectedEpisode, resolvedVideoData]);

  const episodeAudioInfo = useMemo(
    () => getEpisodeAudioInfo(episodeForTrackInfo, series),
    [episodeForTrackInfo, series],
  );
  const episodeSubtitleInfo = useMemo(
    () => getEpisodeSubtitleInfo(episodeForTrackInfo, series),
    [episodeForTrackInfo, series],
  );

  const handleMarkWatched = useCallback(async () => {
    if (!series || !selectedEpisode || isMarkingWatchedRef.current) {
      return;
    }

    isMarkingWatchedRef.current = true;
    try {
      await setEpisodeWatchState({ state: !isWatchedRef.current });
      await queryClient.invalidateQueries({
        queryKey: ['series', 'get', series.id],
      });
    } finally {
      isMarkingWatchedRef.current = false;
    }
  }, [queryClient, selectedEpisode, series, setEpisodeWatchState]);

  const handleToggleHideThumbnails = useCallback(() => {
    setHideUnwatchedThumbnails((prev) => !prev);
  }, [setHideUnwatchedThumbnails]);

  if (!isLoading && !series) return <span>Series not found</span>;

  return (
    <DetailsWithRelatedContent
      collectionId={collectionId}
      currentItemId={series?.id}
      currentItemType="series"
      libraryType={libraryType}
      background={
        <>
          {!!series?.id && (
            <DetailsBackgroundPlayback
              audioLocalIds={[selectedSeason?.id, series.id]}
              videoLocalIds={[selectedSeason?.id, series.id]}
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
      <Page justify="end" padding={'0'} fullScreen>
        <DetailsInfo
          details={details}
          disableInitialFocus
          subtitle={selectedEpisode?.name}
          expandedTitle={selectedEpisode?.name ?? details?.title}
          expandedImageSrc={selectedSeason?.backgroundSrc ?? selectedEpisode?.video.imgSrc}
          cast={series?.cast}
          onDescriptionExpandedChange={setIsDescriptionExpanded}
          infoItems={detailsInfoItems}
          videoInfo={episodeForTrackInfo?.video.videoTracks?.[0]?.displayTitle}
          audioInfo={episodeAudioInfo}
          subtitleInfo={episodeSubtitleInfo}
          handlePlay={handlePlay}
          handleMarkWatched={handleMarkWatched}
          handleToggleHideThumbnails={handleToggleHideThumbnails}
          isWatched={isWatched}
          hideUnwatchedThumbnails={hideUnwatchedThumbnails}
          customDescription={selectedEpisode?.overview}
        />
        {!isDescriptionExpanded && (
          <>
            <EpisodesList
              selectedSeason={selectedSeason}
              selectedEpisode={selectedEpisode}
              selectEpisode={handleSelectEpisode}
              isRestoringFocus={isRestoringEpisodeFocus}
              isLoading={isLoading || !selectedSeason}
              skeletonCount={numberOfItems ?? MAX_SKELETON_COUNT}
              hideUnwatchedThumbnails={hideUnwatchedThumbnails}
              seasonBackgroundSrc={selectedSeason?.backgroundSrc}
            />
            <SeasonSelector
              seasons={series?.seasons ?? []}
              onSelectSeason={setSelectedSeason}
              selectedSeasonId={selectedSeason?.id}
            />
          </>
        )}
      </Page>
    </DetailsWithRelatedContent>
  );
}

export default memo(SeriesDetails);
