import { useServerStore } from '@/context/server.context'
import { Episode, Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React, { memo } from 'react'
import { View } from 'react-native'
import useSWR from 'swr'
import SeriesInfo from './SeriesInfo'
import SeriesContent from './SeriesContent'

interface SeriesDetailsProps {
	id: string
}

function SeriesDetails({ id }: SeriesDetailsProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const [currentEpisode, setCurrentEpisode] = React.useState<Episode | null>(
		null
	)

	const { data: series } = useSWR<Series>(
		serverUrl ? `${serverUrl}/details/series?id=${id}` : null,
		fetcher
	)

	if (!series) {
		return null
	}

	return (
		<View className='h-screen pb-3 pl-1'>
			{/* Series Info */}
			<SeriesInfo series={series} currentEpisode={currentEpisode} />

			{/* Series Content */}
			<SeriesContent
				series={series}
				currentEpisode={currentEpisode}
				setCurrentEpisode={setCurrentEpisode}
			/>
		</View>
	)
}

export default memo(SeriesDetails)
