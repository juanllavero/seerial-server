import type { Season } from '@seerial/domain';
import { memo, useEffect } from 'react';
import { NavigationButton, NavigationScrollView } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';

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

  return (
    <FlexBox
      gap={1}
      width={'100%'}
      height={'7dvh'}
      justify="center"
      padding="1dvh"
      scroll="horizontal"
      className="z-10"
      hideScrollbar
    >
      {seasons.length > 1 && (
        <NavigationScrollView
          className="gap-5 justify-center z-10 w-full"
          direction="horizontal"
          scrollMode="center"
          focusedElementId={selectedSeasonId}
          isRestoringFocus={false}
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
        </NavigationScrollView>
      )}
    </FlexBox>
  );
}

export default memo(SeasonSelector);
