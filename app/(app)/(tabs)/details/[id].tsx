import AnimatedTabContentView from '@/components/AnimatedTabContentView'
import AlbumDetails from '@/components/details/album/AlbumDetails'
import CollectionDetails from '@/components/details/collection/CollectionDetails'
import MovieDetails from '@/components/details/MovieDetails'
import SeriesDetails from '@/components/details/SeriesDetails'
import OptimizedImage from '@/components/images/OptimizedImage'
import { Page } from '@/components/Page'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { getImageUrl } from '@/utils/utils'
import { useLocalSearchParams } from 'expo-router'
import React, { memo } from 'react'
import { View } from 'react-native'
import { shallow } from 'zustand/shallow'

function DetailsScreen() {
	const { id, type, isCollection } = useLocalSearchParams()
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { currentBackground } = useDataStore(
		(state) => ({
			currentBackground: state.currentBackground,
		}),
		shallow
	)

	return (
		<Page>
			<View>
				<OptimizedImage
					source={{
						uri: getImageUrl(serverUrl, currentBackground ?? ''),
					}}
					style={{
						opacity: 0.3,
						zIndex: 0,
					}}
					className='absolute top-0 left-0 w-screen h-screen'
				/>
				<OptimizedImage
					source={require('@/assets/images/noise.png')}
					className='absolute top-0 left-0 w-screen h-screen'
					style={{ opacity: 0.01, zIndex: 0 }}
				/>
				<AnimatedTabContentView>
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
				</AnimatedTabContentView>
			</View>
		</Page>
	)
}

export default memo(DetailsScreen)
