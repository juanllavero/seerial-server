import React, { memo } from 'react'
import { View } from 'react-native'
import Tertiary from '../text/Tertiary'
import { useServerStore } from '@/context/server.context'
import { getImageUrl } from '@/utils/utils'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import OptimizedImage from '../images/OptimizedImage'
import { CollectionImages } from '@/data/interfaces/Media'
import CollectionImage from '../images/CollectionImage'
import AnimatedCard from './AnimatedCard'

interface LibraryItemCardProps {
	type: string
	title: string
	subtitle: string
	imgSrc: string
	width: number
	isFocused: boolean // <-- Recibirá el estado de foco
	collectionImages?: CollectionImages
	aspectRatio?: number
	isCollection?: boolean
}

function LibraryItemCard({
	type,
	title,
	subtitle,
	imgSrc,
	width,
	aspectRatio,
	collectionImages,
	isFocused, // <-- Usamos la prop
	isCollection = false,
}: LibraryItemCardProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const url = serverUrl
		? getImageUrl(serverUrl, imgSrc, width, width * (aspectRatio || 1.5))
		: ''

	return (
		<AnimatedCard isFocused={isFocused} width={width}>
			<View
				className='flex flex-col items-center'
				style={{ outline: 'none' }}
			>
				{collectionImages &&
				!collectionImages.poster &&
				collectionImages.images?.length > 0 ? (
					<CollectionImage
						images={collectionImages.images}
						type={type}
						width={width - 2}
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
	)
}

export default memo(LibraryItemCard)
