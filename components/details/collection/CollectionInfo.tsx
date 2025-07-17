import CollectionImage from '@/components/images/CollectionImage'
import Secondary from '@/components/text/Secondary'
import Subtitle from '@/components/text/Subtitle'
import Tertiary from '@/components/text/Tertiary'
import Title from '@/components/text/Title'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { Collection, CollectionImages } from '@/data/interfaces/Media'
import { fetcher, getImageUrl } from '@/utils/utils'
import React, { use, useEffect } from 'react'
import { Dimensions, Image, View } from 'react-native'
import useSWR from 'swr'

interface CollectionInfoProps {
	collection: Collection
	type: string
}

function CollectionInfo({ collection, type }: CollectionInfoProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const setCurrentBackground = useDataStore(
		(state) => state.setCurrentBackground
	)
	const { height } = Dimensions.get('window')

	const { data: collectionImages } = useSWR<CollectionImages>(
		serverUrl && collection
			? `${serverUrl}/collection-images?collectionId=${collection.id}&type=${type}`
			: null,
		fetcher
	)

	useEffect(() => {
		if (
			collectionImages &&
			collectionImages.background &&
			collectionImages.background !== ''
		) {
			setCurrentBackground(collectionImages.background)
		}
	}, [collectionImages])

	function getYearRange(): string {
		if (!collection) return 'N/A'

		const years =
			type === LibraryTypes.MUSIC
				? collection.albums &&
					collection.albums
						.map((album) => album.year)
						.filter((year) => year !== '')
				: type === LibraryTypes.MOVIES
					? collection.movies &&
						collection.movies
							.map((movie) => movie.year)
							.filter((year) => year !== '')
					: type === LibraryTypes.SHOWS
						? collection.shows &&
							collection.shows
								.map((show) => show.year)
								.filter((year) => year !== '')
						: []

		if (!years || years.length === 0) {
			return 'N/A'
		}

		const numericYears = years.map((year) => (year ? parseInt(year, 10) : 0))

		const minYear = Math.min(...numericYears)
		const maxYear = Math.max(...numericYears)

		if (minYear === maxYear) {
			return `${minYear}`
		} else {
			return `${minYear} - ${maxYear}`
		}
	}

	const imageHeight = height * 0.4
	const imageWidth = (type === LibraryTypes.MUSIC ? 1 : 9 / 16) * imageHeight

	return (
		<View className='flex-row gap-20 pb-10'>
			{collectionImages &&
			collectionImages.images &&
			collectionImages.images.length > 1 ? (
				<CollectionImage
					images={collectionImages.images}
					type={type}
					width={imageWidth}
					height={imageHeight}
				/>
			) : (
				<Image
					source={
						collectionImages &&
						collectionImages.images &&
						collectionImages.images.length === 1
							? {
									uri: getImageUrl(
										serverUrl,
										collectionImages.images[0]
									),
								}
							: collectionImages &&
								  collectionImages.poster &&
								  collectionImages.poster !== ''
								? {
										uri: getImageUrl(
											serverUrl,
											collectionImages.poster
										),
									}
								: type === LibraryTypes.MUSIC
									? require('@/assets/images/default/music.png')
									: require('@/assets/images/default/movie.jpg')
					}
					style={{
						width: imageWidth,
						height: imageHeight,
						resizeMode: 'contain',
						borderRadius: 10,
					}}
				/>
			)}

			<View>
				<Title className='mb-5'>{collection.title}</Title>
				<Tertiary>{getYearRange()}</Tertiary>
				<Tertiary>{collection.description}</Tertiary>
			</View>
		</View>
	)
}

export default CollectionInfo
