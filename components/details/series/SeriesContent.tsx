import HorizontalList from '@/components/lists/HorizontalList'
import { Series, Episode, Season } from '@/data/interfaces/Media'
import { scaledPixels } from '@/hooks/useScale'
import React, { useCallback, useEffect } from 'react'
import { View } from 'react-native'
import EpisodeCard from './EpisodeCard'
import {
	SpatialNavigationFocusableView,
	SpatialNavigationNode,
	SpatialNavigationView,
} from 'react-tv-space-navigation'
import SeasonButton from './SeasonButton'
import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import useDataStore from '@/context/data.context'

interface SeriesContentProps {
	series: Series
	currentEpisode: Episode | null
	setCurrentEpisode: React.Dispatch<React.SetStateAction<Episode | null>>
}

function SeriesContent({
	series,
	currentEpisode,
	setCurrentEpisode,
}: SeriesContentProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const setCurrentBackground = useDataStore(
		(state) => state.setCurrentBackground
	)
	const [selectedSeason, setSelectedSeason] = React.useState<Season | null>(
		null
	)
	const [episodesFocused, setEpisodesFocused] = React.useState(true)

	const { data: season } = useSWR<Season>(
		serverUrl && selectedSeason
			? `${serverUrl}/details/season?id=${selectedSeason.id}`
			: null,
		fetcher
	)

	useEffect(() => {
		if (series.seasons && series.seasons.length > 0) {
			setSelectedSeason(series.seasons[0])
		}
	}, [])

	useEffect(() => {
		setCurrentEpisode(
			season && season.episodes && season.episodes.length > 0
				? season.episodes[0]
				: null
		)
	}, [season])

	useEffect(() => {
		if (
			selectedSeason &&
			selectedSeason.backgroundSrc &&
			selectedSeason.backgroundSrc !== ''
		) {
			setCurrentBackground(selectedSeason.backgroundSrc)
		}
	}, [selectedSeason, setCurrentBackground])

	const renderEpisodeItem = useCallback(
		({ item }: { item: Episode }) => (
			<EpisodeCard
				episode={item}
				key={item.id}
				episodesFocused={episodesFocused}
				width={scaledPixels(170)}
				selectedEpisode={currentEpisode}
				setSelectedEpisode={setCurrentEpisode}
			/>
		),
		[currentEpisode]
	)

	return (
		<View className='flex-1'>
			<SpatialNavigationNode>
				<View className='flex-1'>
					<HorizontalList<Episode>
						key={'Episodes List'}
						title={''}
						items={season && season.episodes ? season.episodes : []}
						itemSize={scaledPixels(190)}
						renderItem={renderEpisodeItem}
					/>
				</View>
			</SpatialNavigationNode>

			<SpatialNavigationView
				direction='horizontal'
				style={{
					gap: 5,
					justifyContent: 'center',
				}}
			>
				{series.seasons &&
					series.seasons
						.sort((a, b) => a.seasonNumber - b.seasonNumber)
						.map((season) => (
							<SeasonButton
								key={season.id}
								season={season}
								selectedSeason={selectedSeason}
								selectSeason={setSelectedSeason}
							/>
						))}
			</SpatialNavigationView>
		</View>
	)
}

export default SeriesContent
