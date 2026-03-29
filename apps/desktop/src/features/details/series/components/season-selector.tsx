import type { Season } from '@seerial/domain';
import { memo, useEffect } from 'react';
import NavigationButton from '@/components/navigation/NavigationButton';
import FlexBox from '@/components/ui/FlexBox';

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId?: string;
  onSelectSeason: (season: Season) => void;
}

function SeasonSelector({ seasons, selectedSeasonId, onSelectSeason }: SeasonSelectorProps) {
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      onSelectSeason(seasons[0]);
    }
  }, [seasons, selectedSeasonId, onSelectSeason]);

  if (seasons.length <= 1) return null;

  return (
    <FlexBox
      gap={1}
      width={'100%'}
      justify="center"
      padding="1rem"
      scroll="horizontal"
      className="z-10"
      hideScrollbar
    >
      {seasons
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((season) => (
          <NavigationButton
            variant="ghost"
            key={season.id}
            text={String(season.seasonNumber)}
            selected={selectedSeasonId === season.id}
            className={`${selectedSeasonId === season.id ? 'color-app-color' : ''}`}
            onClick={() => onSelectSeason(season)}
          />
        ))}
    </FlexBox>
  );
}

export default memo(SeasonSelector);
