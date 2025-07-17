import { useServerStore } from '@/context/server.context'
import { Album } from '@/data/interfaces/Music'
import { fetcher, getImageUrl } from '@/utils/utils'
import React from 'react'
import { Animated, Dimensions, ScrollView, View } from 'react-native'
import useSWR from 'swr'
import AlbumInfo from './AlbumInfo'
import SongsList from './SongsList'

interface AlbumDetailsProps {
	id: string
}

function AlbumDetails({ id }: AlbumDetailsProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { width, height } = Dimensions.get('window')

	const { data: album, isLoading } = useSWR<Album>(
		serverUrl ? `${serverUrl}/details/album?id=${id}` : null,
		fetcher
	)

	if (!album) return null

	return (
		<View className='flex-row h-screen pt-20 pl-10 gap-0'>
			<Animated.Image
				source={{ uri: getImageUrl(serverUrl, album.coverSrc ?? '') }}
				style={{
					width: width * 0.3,
					height: width * 0.3,
					maxWidth: height * 0.7,
					maxHeight: height * 0.7,
					borderRadius: 10,
				}}
			/>

			<ScrollView
				className='px-20 pb-20'
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ gap: 40 }}
			>
				<AlbumInfo album={album} isLoading={isLoading} />
				<SongsList album={album} />
			</ScrollView>
		</View>
	)
}

export default AlbumDetails
