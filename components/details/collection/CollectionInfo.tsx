import CollectionImage from '@/components/images/CollectionImage'
import OptimizedImage from '@/components/images/OptimizedImage'
import Tertiary from '@/components/text/Tertiary'
import Title from '@/components/text/Title'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { Collection, CollectionImages } from '@/data/interfaces/Media'
import { fetcher, getImageUrl } from '@/utils/utils'
import React, { memo, useMemo, useEffect } from 'react'
import { Dimensions, View } from 'react-native'
import useSWR from 'swr'

interface CollectionInfoProps {
	collection: Collection
	type: string
}

const CollectionInfo = memo(function CollectionInfo({
	collection,
	type,
}: CollectionInfoProps) {
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
		if (collectionImages?.background) {
			setCurrentBackground(collectionImages.background)
		}
	}, [collectionImages, setCurrentBackground])

	const yearRange = useMemo(() => {
		if (!collection) return 'N/A'

		const getYears = (items: any[] | undefined) =>
			items?.map((item) => item.year).filter(Boolean) || []

		let years: (string | undefined)[] = []
		switch (type) {
			case LibraryTypes.MUSIC:
				years = getYears(collection.albums)
				break
			case LibraryTypes.MOVIES:
				years = getYears(collection.movies)
				break
			case LibraryTypes.SHOWS:
				years = getYears(collection.shows)
				break
		}

		if (years.length === 0) return 'N/A'

		const numericYears = years.map((year) => parseInt(year!, 10))
		const minYear = Math.min(...numericYears)
		const maxYear = Math.max(...numericYears)

		return minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`
	}, [collection, type])

	const imageDimensions = useMemo(() => {
		const imageHeight = height * 0.4
		const imageWidth =
			(type === LibraryTypes.MUSIC ? 1 : 16 / 9) * imageHeight
		return { width: imageWidth, height: imageHeight }
	}, [height, type])

	return (
		<View className='flex-row gap-20 pb-10'>
			{collectionImages?.images && collectionImages.images.length > 1 ? (
				<CollectionImage
					images={collectionImages.images}
					type={type}
					width={imageDimensions.width}
					height={imageDimensions.height}
				/>
			) : (
				<OptimizedImage
					source={
						collectionImages?.images?.length === 1
							? {
									uri: getImageUrl(
										serverUrl,
										collectionImages.images[0]
									),
								}
							: collectionImages?.poster
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
						width: imageDimensions.width,
						height: imageDimensions.height,
						resizeMode: 'contain',
						borderRadius: 10,
					}}
				/>
			)}

			<View>
				<Title>{collection.title}</Title>
				<Tertiary>{yearRange}</Tertiary>
				<Tertiary>{collection.description}</Tertiary>
			</View>
		</View>
	)
})

export default CollectionInfo
