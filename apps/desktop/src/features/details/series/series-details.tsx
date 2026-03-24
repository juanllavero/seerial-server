import type { DetailsData, Episode, Season, Series } from '@seerial/domain';
import { formatDate, formatTimeForView } from '@seerial/domain';
import { t } from 'i18next';
import { memo, useEffect, useState } from 'react';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import EpisodesList from '@/features/details/series/components/episodes-list';
import SeasonSelector from '@/features/details/series/components/season-selector';
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

  useEffect(() => {
    if (series && series.seasons?.length > 0) {
      setSelectedSeason(series.seasons[0]);
    }
  }, [series]);

  if (!isLoading && !series) return <span>Series not found</span>;

  return (
    <Page padding="0 2rem" justify="end">
      <GradientBackground
        imageSrc={details?.backgroundSrc ?? selectedSeason?.backgroundSrc ?? series?.coverSrc}
        index={0}
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
      />
      {selectedSeason && (
        <EpisodesList
          selectedSeasonId={selectedSeason.id}
          selectedEpisode={selectedEpisode}
          selectEpisode={setSelectedEpisode}
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
