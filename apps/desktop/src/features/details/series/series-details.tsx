import type { DetailsData, Episode, Season, Series } from '@seerial/domain';
import { formatDate, formatTimeForView } from '@seerial/domain';
import { t } from 'i18next';
import { memo, useCallback, useEffect, useState } from 'react';
import BackgroundImage from '@/components/backgrounds/BackgroundImage';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import EpisodesList from '@/features/details/series/components/episodes-list';
import SeasonSelector from '@/features/details/series/components/season-selector';
import { useSeriesDetailsFocusStore } from '@/features/details/series/stores/series-details-focus.store';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';

interface SeriesDetailsProps {
  series: Series | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
}

function SeriesDetails({ series, isLoading, details }: SeriesDetailsProps) {
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isRestoringEpisodeFocus, setIsRestoringEpisodeFocus] = useState(true);

  const getLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
    (state) => state.getLastFocusedEpisodeForSeason,
  );
  const setLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
    (state) => state.setLastFocusedEpisodeForSeason,
  );

  useEffect(() => {
    if (series && series.seasons?.length > 0) {
      setSelectedSeason(series.seasons[0]);
    }
  }, [series]);

  useEffect(() => {
    if (!selectedSeason) {
      setSelectedEpisode(null);
      setIsRestoringEpisodeFocus(false);
      return;
    }

    const sortedEpisodes = [...selectedSeason.episodes].sort(
      (a, b) => a.episodeNumber - b.episodeNumber,
    );

    if (sortedEpisodes.length === 0) {
      setSelectedEpisode(null);
      setIsRestoringEpisodeFocus(false);
      return;
    }

    const restoredEpisodeId = getLastFocusedEpisodeForSeason(selectedSeason.id);
    const restoredEpisode = restoredEpisodeId
      ? sortedEpisodes.find((episode) => episode.id === restoredEpisodeId)
      : null;

    if (restoredEpisode) {
      setSelectedEpisode(restoredEpisode);
      setIsRestoringEpisodeFocus(true);
      return;
    }

    setSelectedEpisode(sortedEpisodes[0]);
    setIsRestoringEpisodeFocus(false);
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

  if (!isLoading && !series) return <span>Series not found</span>;

  return (
    <Page justify="end">
      <GradientBackground
        imageSrc={details?.backgroundSrc ?? selectedSeason?.backgroundSrc ?? series?.coverSrc}
        index={0}
      />
      <BackgroundImage
        imageSrc={details?.backgroundSrc ?? selectedSeason?.backgroundSrc ?? series?.coverSrc}
      />
      <DetailsInfo
        details={details}
        subtitle={selectedEpisode?.name}
        infoItems={[
          selectedEpisode
            ? `${t('seasonLetter')}${selectedEpisode.seasonNumber}${t('episodeLetter')}${selectedEpisode.episodeNumber}`
            : '',
          formatDate(selectedEpisode ? selectedEpisode.year : (series?.year ?? '')),
          selectedEpisode ? formatTimeForView(selectedEpisode.video.runtime ?? 0) : '',
        ]}
        videoInfo={selectedEpisode?.video.videoTracks?.[0]?.displayTitle}
        audioInfo={
          selectedEpisode?.video.audioTracks?.[selectedEpisode.video.selectedAudioTrack ?? 0]
            ?.displayTitle
        }
        subtitleInfo={
          selectedEpisode?.video.subtitleTracks?.[selectedEpisode.video.selectedSubtitleTrack ?? 0]
            ?.displayTitle
        }
      />
      {selectedSeason && (
        <EpisodesList
          selectedSeason={selectedSeason}
          selectedEpisode={selectedEpisode}
          selectEpisode={handleSelectEpisode}
          isRestoringFocus={isRestoringEpisodeFocus}
        />
      )}
      <SeasonSelector
        seasons={series?.seasons ?? []}
        onSelectSeason={setSelectedSeason}
        selectedSeasonId={selectedSeason?.id}
      />
    </Page>
  );
}

export default memo(SeriesDetails);
