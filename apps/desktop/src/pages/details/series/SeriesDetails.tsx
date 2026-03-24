import { useGetSeries } from '@seerial/api';
import type { Episode, Season, Series } from '@seerial/domain';
import { formatDate, formatTimeForView } from '@seerial/domain';
import { t } from 'i18next';
import { memo, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import Loading from '@/shared/components/loading';
import Page from '@/shared/components/page';
import DetailsInfo from '../components/DetailsInfo';
import EpisodesList from './components/EpisodesList';
import SeasonSelector from './components/SeasonSelector';

function SeriesDetails() {
  const { seriesId } = useParams();
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  const { data: show, isLoading } = useGetSeries<Series>(seriesId ?? '', {
    enabled: !!seriesId,
  });

  useEffect(() => {
    if (show && show.seasons.length > 0) {
      setSelectedSeason(show.seasons[0]);
    }
  }, [show]);

  if (isLoading) {
    return <Loading />;
  }

  if (!show) return <span>Series not found</span>;

  return (
    <Page padding="0 2rem" justify="end">
      <GradientBackground imageSrc={selectedSeason?.backgroundSrc ?? show?.coverSrc} index={0} />
      <DetailsInfo
        title={show.name}
        logoUrl={show.logoSrc}
        subtitle={selectedEpisode?.name}
        tagline={show.tagline}
        score={show.score}
        genres={show.genres}
        createdBy={show.creator}
        infoItems={[
          selectedEpisode
            ? `${t('seasonLetter')}${selectedEpisode.seasonNumber}${t('episodeLetter')}${selectedEpisode.episodeNumber}`
            : '',
          formatDate(selectedEpisode ? selectedEpisode.year : show.year),
          selectedEpisode ? formatTimeForView(selectedEpisode.video.runtime ?? 0) : '',
        ]}
        overview={show.overview}
      />
      {selectedSeason && (
        <EpisodesList
          selectedSeasonId={selectedSeason.id}
          selectedEpisode={selectedEpisode}
          selectEpisode={setSelectedEpisode}
        />
      )}
      <SeasonSelector
        seasons={show.seasons}
        onSelectSeason={setSelectedSeason}
        selectedSeasonId={selectedSeason?.id}
      />
    </Page>
  );
}

export default memo(SeriesDetails);
