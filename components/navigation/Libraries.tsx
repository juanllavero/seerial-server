import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import React from 'react'
import {
	Dimensions,
	FlatList,
	Pressable,
	ScrollView,
	TouchableOpacity,
	View,
} from 'react-native'
import useSWR from 'swr'
import Tertiary from '../text/Tertiary'
import { Link } from 'expo-router'
import { Library } from '@/data/interfaces/Media'
import Button from '../buttons/Button'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import SeriesIcon from '../svg/SeriesIcon'
import MusicIcon from '../svg/MusicIcon'
import MovieIcon from '../svg/MovieIcon'
import useDataStore from '@/context/data.context'

interface LibrariesProps {
	isExpanded: boolean
}

function Libraries({ isExpanded }: LibrariesProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { height } = Dimensions.get('screen')

	const { data: libraries } = useSWR<Library[]>(
		serverUrl ? `${serverUrl}/libraries` : null,
		fetcher
	)

	if (!libraries) {
		return null
	}

	return (
		<FlatList
			data={libraries}
			scrollEnabled={false}
			className='w-full'
			keyExtractor={(item, index) => item.id + index}
			renderItem={({ item }) => (
				<Link
					asChild
					href={{
						pathname: '/library/[id]',
						params: {
							id: item.id,
							serverIP: serverUrl,
							type: item.type,
						},
					}}
				>
					<Button
						text={item.name}
						transparent
						leftAlign
						iconSize={24}
						fullWidth
						hideText={!isExpanded}
						icon={
							item.type === LibraryTypes.SHOWS
								? SeriesIcon
								: item.type === LibraryTypes.MUSIC
									? MusicIcon
									: MovieIcon
						}
					/>
				</Link>
			)}
		/>
	)
}

export default Libraries
