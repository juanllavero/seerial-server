import NavigationButton from '@/components/navigation/NavigationButton'
import FlexBox from '@/components/ui/FlexBox'
import { Season } from '@/data/interfaces/Media'
import { memo, useEffect } from 'react'

interface SeasonSelectorProps {
	seasons: Season[]
	selectedSeasonId?: string
	onSelectSeason: (season: Season) => void
}

function SeasonSelector({
	seasons,
	selectedSeasonId,
	onSelectSeason,
}: SeasonSelectorProps) {
	useEffect(() => {
		if (seasons.length > 0 && !selectedSeasonId) {
			onSelectSeason(seasons[0])
		}
	}, [seasons])
	return (
		<FlexBox gap={1} padding='1rem' scroll='horizontal' hideScrollbar>
			{seasons
				.sort((a, b) => a.seasonNumber - b.seasonNumber)
				.map((season) => (
					<NavigationButton
						transparent
						key={season.id}
						className={`${selectedSeasonId === season.id ? 'color-app-color' : ''}`}
						onClick={() => onSelectSeason(season)}
					>
						{season.seasonNumber}
					</NavigationButton>
				))}
		</FlexBox>
	)
}

export default memo(SeasonSelector)
