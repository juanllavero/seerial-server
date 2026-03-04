import React, { memo } from 'react'
import { View } from 'react-native'
import {
	SpatialNavigationFocusableView,
	SpatialNavigationNode,
} from 'react-tv-space-navigation'
import { Season } from '@/data/interfaces/Media'
import { appColor } from '@/constants/Colors'
import Secondary from '@/components/text/Secondary'

interface SeasonButtonProps {
	season: Season
	selectedSeason: Season | null
	selectSeason: React.Dispatch<React.SetStateAction<Season | null>>
}

function SeasonButton({
	season,
	selectedSeason,
	selectSeason,
}: SeasonButtonProps) {
	return (
		<SpatialNavigationNode>
			<SpatialNavigationFocusableView onSelect={() => selectSeason(season)}>
				{({ isFocused }) => (
					<View
						style={{
							backgroundColor: isFocused ? 'white' : 'transparent',
							opacity: isFocused || selectedSeason === season ? 1 : 0.4,
							transform:
								selectedSeason === season
									? [{ scale: 1.1 }]
									: [{ scale: 1 }],
							outline: 'none',
						}}
						className={`rounded-full py-1 px-2.5  justify-center`}
					>
						<Secondary
							noShadow
							style={{
								color: isFocused
									? 'black'
									: selectedSeason === season
										? appColor
										: 'white',
							}}
						>
							{season.seasonNumber}
						</Secondary>
					</View>
				)}
			</SpatialNavigationFocusableView>
		</SpatialNavigationNode>
	)
}

export default memo(SeasonButton)
