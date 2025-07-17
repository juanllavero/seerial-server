import AlbumDetails from '@/components/details/album/AlbumDetails'
import CollectionDetails from '@/components/details/collection/CollectionDetails'
import MovieDetails from '@/components/details/MovieDetails'
import SeriesDetails from '@/components/details/SeriesDetails'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { getImageUrl } from '@/utils/utils'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Dimensions, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { shallow } from 'zustand/shallow'

export default function DetailsScreen() {
	const { id, type, isCollection } = useLocalSearchParams()
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { sidebarOpen, currentBackground } = useDataStore(
		(state) => ({
			sidebarOpen: state.sidebarOpen,
			currentBackground: state.currentBackground,
		}),
		shallow
	)
	const { height } = Dimensions.get('screen')

	return (
		<View
			className='w-screen h-screen bg-black transition-all duration-300 ease-in-out'
			style={{ paddingLeft: sidebarOpen ? height * 0.3 : height * 0.08 }}
		>
			<Animated.Image
				source={{ uri: getImageUrl(serverUrl, currentBackground ?? '') }}
				className='absolute top-0 left-0 w-screen h-screen opacity-55 brightness-50'
			/>

			<Animated.Image
				source={require('@/assets/images/noise.png')}
				className='absolute top-0 left-0 w-screen h-screen'
				style={{ opacity: 0.01 }}
			/>

			{/* Details Content */}
			{isCollection === 'true' ? (
				<CollectionDetails id={id as string} type={type as string} />
			) : type === LibraryTypes.SHOWS ? (
				<SeriesDetails id={id as string} />
			) : type === LibraryTypes.MOVIES ? (
				<MovieDetails id={id as string} />
			) : type === LibraryTypes.MUSIC ? (
				<AlbumDetails id={id as string} />
			) : null}
		</View>
	)
}
