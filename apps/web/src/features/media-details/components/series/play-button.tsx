import { useGetEpisode, useGetSeason, useGetVideoByEpisodeId } from '@seerial/api';
import type { Episode, Season } from '@seerial/domain';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { PlayIcon } from 'lucide-react';

interface PlayButtonProps {
  currentlyWatchingEpisodeId?: string;
  selectedSeasonId: string | null;
}

function PlayButton({ currentlyWatchingEpisodeId, selectedSeasonId }: PlayButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: season } = useGetSeason<Season>(selectedSeasonId ?? '', undefined, {
    enabled: Boolean(selectedSeasonId),
  });

  // Get current episode
  const { data: episode } = useGetEpisode<Episode>(currentlyWatchingEpisodeId ?? '', {
    enabled: Boolean(currentlyWatchingEpisodeId),
  });

  const fallbackEpisodeId = season?.episodes?.[0]?.id ?? null;
  const resolvedEpisodeId = episode?.id ?? fallbackEpisodeId;

  const { refetch: refetchVideoByEpisode } = useGetVideoByEpisodeId<{ id: string }>(
    resolvedEpisodeId ?? '',
    {
      enabled: false,
    },
  );

  const getPlayButtonText = () => {
    return episode
      ? `${t('continueWatching')} — ${t('seasonLetter')}${episode.seasonNumber}${t('episodeLetter')}${episode.episodeNumber}`
      : t('playButton');
  };

  return (
    <Button
      onClick={async () => {
        if (!resolvedEpisodeId) {
          return;
        }

        const response = await refetchVideoByEpisode();
        if (!response.data?.id) {
          return;
        }

        navigate(`/video-player/${response.data.id}`);
      }}
    >
      <FlexBox align="center" gap={0.5} className="text-black">
        <PlayIcon color="#111111" fill="#111111" />
        {getPlayButtonText()}
      </FlexBox>
    </Button>
  );
}

export default PlayButton;
