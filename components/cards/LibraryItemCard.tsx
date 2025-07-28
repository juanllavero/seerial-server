import React, { memo, useCallback } from 'react'
import { View } from 'react-native'
import Tertiary from '../text/Tertiary'
import { useServerStore } from '@/context/server.context'
import { getImageUrl } from '@/utils/utils'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { router } from 'expo-router'
import useDataStore from '@/context/data.context'
import OptimizedImage from '../images/OptimizedImage'
import {
	SpatialNavigationFocusableView,
	SpatialNavigationNode,
} from 'react-tv-space-navigation'
import { CollectionImages } from '@/data/interfaces/Media'
import CollectionImage from '../images/CollectionImage'
import AnimatedCard from './AnimatedCard'

interface LibraryItemCardProps {
	type: string
	id: string
	title: string
	subtitle: string
	imgSrc: string
	width: number
	collectionImages?: CollectionImages
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
	collectionImages,
	updateImage = true,
	isCollection = false,
	onFocus,
}: LibraryItemCardProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const setCurrentBackground = useDataStore(
		(state) => state.setCurrentBackground
	)

	const url = serverUrl
		? getImageUrl(serverUrl, imgSrc, width, width * (aspectRatio || 1.5))
		: ''

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
		if (updateImage && imgSrc && imgSrc !== '') {
			setCurrentBackground(imgSrc)
		}
	}, [updateImage, setCurrentBackground, imgSrc, onFocus])

	return (
		<SpatialNavigationNode>
			<SpatialNavigationFocusableView
				onSelect={handlePress}
				onFocus={handleFocus}
			>
				{({ isFocused }) => (
					<AnimatedCard isFocused={isFocused} width={width}>
						<View
							className='flex flex-col items-center'
							style={{ outline: 'none' }}
						>
							{collectionImages &&
							!collectionImages.poster &&
							collectionImages.images &&
							collectionImages.images.length > 0 ? (
								<CollectionImage
									images={collectionImages.images}
									type={type}
									width={width}
									height={width * (aspectRatio || 1.5)}
									style={{
										borderRadius: 5,
										borderWidth: 1,
										borderColor: isFocused ? 'white' : 'transparent',
									}}
								/>
							) : (
								<OptimizedImage
									source={
										url ||
										(type === LibraryTypes.MUSIC
											? require('@/assets/images/default/music.png')
											: require('@/assets/images/default/movie.jpg'))
									}
									resizeMode='cover'
									style={{
										width,
										height: width * (aspectRatio || 1.5),
										borderRadius: 5,
										borderWidth: 1,
										borderColor: isFocused ? 'white' : 'transparent',
									}}
								/>
							)}

							<Tertiary className='line-clamp-1 text-center mt-1'>
								{title}
							</Tertiary>
							<Tertiary className='line-clamp-1 text-center text-gray-400'>
								{subtitle}
							</Tertiary>
						</View>
					</AnimatedCard>
				)}
			</SpatialNavigationFocusableView>
		</SpatialNavigationNode>
	)
}

export default memo(LibraryItemCard)
