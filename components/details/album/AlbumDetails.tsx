import { useServerStore } from '@/context/server.context'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import React from 'react'
import { ScrollView, View } from 'react-native'
import useSWR from 'swr'
import AlbumInfo from './AlbumInfo'
import SongsList from './SongsList'

interface AlbumDetailsProps {
	id: string
}

function AlbumDetails({ id }: AlbumDetailsProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)

	const { data: album, isLoading } = useSWR<Album>(
		serverUrl ? `${serverUrl}/details/album?id=${id}` : null,
		fetcher
	)

	if (!album) return null

	return (
		<View className='flex-row h-screen gap-20'>
			<AlbumInfo album={album} isLoading={isLoading} />

			<ScrollView>
				<SongsList album={album} />
			</ScrollView>
		</View>
	)
}

export default AlbumDetails
