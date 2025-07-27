import React, { memo, useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'
import Tertiary from '../text/Tertiary'
import { useServerStore } from '@/context/server.context'
import { fetcher, getImageUrl } from '@/utils/utils'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import useSWR from 'swr'
import { CollectionImages } from '@/data/interfaces/Media'
import CollectionImage from '../images/CollectionImage'
import { router } from 'expo-router'
import useDataStore from '@/context/data.context'
import OptimizedImage from '../images/OptimizedImage'
import {
	SpatialNavigationFocusableView,
	SpatialNavigationNode,
} from 'react-tv-space-navigation'

interface LibraryItemCardProps {
	type: string
	id: string
	title: string
	subtitle: string
	imgSrc: string
	width: number
	aspectRatio?: number
	updateImage?: boolean
	isCollection?: boolean
	onFocus?: () => void
}

function LibraryItemCard({
	type,
	id,
	title,
	subtitle,
	imgSrc,
	width,
	aspectRatio,
	updateImage = true,
	isCollection = false,
	onFocus,
}: LibraryItemCardProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const setCurrentBackground = useDataStore(
		(state) => state.setCurrentBackground
	)

	const { data: collectionImages } = useSWR<CollectionImages>(
		serverUrl && isCollection
			? `${serverUrl}/collection-images?collectionId=${id}&&type=${type}`
			: null,
		fetcher
	)

	const imageSrc = imgSrc || collectionImages?.poster || ''
	const url = serverUrl ? getImageUrl(serverUrl, imageSrc) : ''

	const handlePress = useCallback(() => {
		router.push({
			pathname: `/details/[id]`,
			params: {
				id,
				type,
				isCollection: String(isCollection),
			},
		})
	}, [id, type, isCollection])

	const handleFocus = useCallback(() => {
		onFocus?.()

		if (updateImage) {
			setCurrentBackground(imageSrc ?? '')
		}
	}, [updateImage, setCurrentBackground, imageSrc])

	const handleBlur = useCallback(() => {}, [])

	return (
		<SpatialNavigationNode>
			<SpatialNavigationFocusableView
				onSelect={handlePress}
				onFocus={handleFocus}
				onBlur={handleBlur}
			>
				{({ isFocused }) => (
					<View
						style={{
							width,
							overflow: 'hidden',
							outline: 'none',
							transform: isFocused ? [{ scale: 1.05 }] : [{ scale: 1 }],
						}}
						className={`items-center`}
					>
						<View
							className='flex flex-col items-center'
							style={{ outline: 'none' }}
						>
							{(!url || url === '') &&
							collectionImages &&
							collectionImages.images &&
							collectionImages.images.length > 0 ? (
								<CollectionImage
									images={collectionImages.images}
									type={type}
									width={width - 8}
									className={`border-2 border-transparent ${
										isFocused ? 'border-white' : ''
									}`}
									height={width * (aspectRatio || 1) - 8}
								/>
							) : (
								<OptimizedImage
									source={
										url && url !== ''
											? { uri: url }
											: type === LibraryTypes.MUSIC
												? require('@/assets/images/default/music.png')
												: require('@/assets/images/default/movie.jpg')
									}
									className={`border-2 border-transparent`}
									style={{
										width,
										height: width * (aspectRatio || 1),
										borderRadius: 5,
										borderColor: isFocused ? 'white' : 'transparent',
									}}
								/>
							)}
							<Tertiary className='line-clamp-1 text-center'>
								{title}
							</Tertiary>
							<Tertiary className='line-clamp-1 text-center'>
								{subtitle}
							</Tertiary>
						</View>
					</View>
				)}
			</SpatialNavigationFocusableView>
		</SpatialNavigationNode>
	)
}

export default memo(LibraryItemCard)
