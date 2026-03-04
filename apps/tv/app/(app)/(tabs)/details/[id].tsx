import AnimatedTabContentView from '@/components/AnimatedTabContentView'
import AlbumDetails from '@/components/details/album/AlbumDetails'
import CollectionDetails from '@/components/details/collection/CollectionDetails'
import MovieDetails from '@/components/details/movie/MovieDetails'
import SeriesDetails from '@/components/details/series/SeriesDetails'
import { AnimatedImage } from '@/components/images/AnimatedImage'
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
				<AnimatedImage
					uri={getImageUrl(serverUrl, currentBackground ?? '')}
					toValue={0.2}
					style={{
						zIndex: 0,
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
					}}
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
