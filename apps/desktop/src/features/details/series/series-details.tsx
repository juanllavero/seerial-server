import { useSetEpisodeWatchState } from '@seerial/api';
import type { DetailsData, Episode, LibraryType, Season, Series } from '@seerial/domain';
import { formatDate, formatTimeForView, getAudioTrack, getSubtitleTrack } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
  const [isRestoringEpisodeFocus, setIsRestoringEpisodeFocus] = useState(true);
  const [isBackgroundVideoVisible, setIsBackgroundVideoVisible] = useState(false);
  const backgroundImageSrc =
    details?.backgroundSrc ?? selectedSeason?.backgroundSrc ?? series?.coverSrc;

  const getLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
    (state) => state.getLastFocusedEpisodeForSeason,
  );
  const setLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
    (state) => state.setLastFocusedEpisodeForSeason,
  );
  const { mutateAsync: setEpisodeWatchState, isPending: isUpdatingWatchState } =
    useSetEpisodeWatchState<unknown, { state: boolean }>(selectedEpisode?.id ?? '');

  useEffect(() => {
    const seasonToSelect = getInitialSeason(series, currentSeasonNumber);
    setSelectedSeason(seasonToSelect);
  }, [series, currentSeasonNumber]);

  useEffect(() => {
    const nextState = getSeasonEpisodeState(selectedSeason, getLastFocusedEpisodeForSeason);
    setSelectedEpisode(nextState.selectedEpisode);
    setIsRestoringEpisodeFocus(nextState.isRestoringEpisodeFocus);
  }, [selectedSeason, getLastFocusedEpisodeForSeason]);

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

  const detailsInfoItems = useMemo(
    () => buildDetailsInfoItems(selectedEpisode, series?.year),
    [selectedEpisode, series?.year],
  );

  const episodeAudioInfo = useMemo(
    () => getEpisodeAudioInfo(selectedEpisode, series),
    [selectedEpisode, series],
  );
  const episodeSubtitleInfo = useMemo(
    () => getEpisodeSubtitleInfo(selectedEpisode, series),
    [selectedEpisode, series],
  );

  const handleMarkWatched = useCallback(async () => {
    if (!series || !selectedEpisode || isUpdatingWatchState) {
      return;
    }

    await setEpisodeWatchState({ state: !isWatched });
    await queryClient.invalidateQueries({
      queryKey: ['series', 'get', series.id],
    });
  }, [isUpdatingWatchState, isWatched, queryClient, selectedEpisode, series, setEpisodeWatchState]);

  if (!isLoading && !series) return <span>Series not found</span>;

  console.log({
    selectedEpisode,
    video: selectedEpisode?.video,
    mediaInfo: selectedEpisode?.video.mediaInfo,
  }); // Debug log to check the values

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
          infoItems={detailsInfoItems}
          videoInfo={selectedEpisode?.video.videoTracks?.[0]?.displayTitle}
          audioInfo={episodeAudioInfo}
          subtitleInfo={episodeSubtitleInfo}
          handlePlay={handlePlay}
          handleMarkWatched={handleMarkWatched}
          isWatched={isWatched}
          customDescription={selectedEpisode?.overview}
        />
        <EpisodesList
          selectedSeason={selectedSeason}
          selectedEpisode={selectedEpisode}
          selectEpisode={handleSelectEpisode}
          isRestoringFocus={isRestoringEpisodeFocus}
          isLoading={isLoading || !selectedSeason}
          skeletonCount={numberOfItems ?? MAX_SKELETON_COUNT}
        />
        <SeasonSelector
          seasons={series?.seasons ?? []}
          onSelectSeason={setSelectedSeason}
          selectedSeasonId={selectedSeason?.id}
        />
      </Page>
    </DetailsWithRelatedContent>
  );
}

export default memo(SeriesDetails);
