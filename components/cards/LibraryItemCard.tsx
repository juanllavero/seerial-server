import React, { memo, useCallback, useState } from 'react' // --> 1. Importar useState
import { Image, Pressable, TouchableOpacity, View } from 'react-native'
import Tertiary from '../text/Tertiary'
import { useServerStore } from '@/context/server.context'
import { fetcher, getImageUrl } from '@/utils/utils'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { Marquee } from '@animatereactnative/marquee'
import useSWR from 'swr'
import { CollectionImages } from '@/data/interfaces/Media'
import CollectionImage from '../images/CollectionImage'
import { Link } from 'expo-router'
import useDataStore from '@/context/data.context'

interface LibraryItemCardProps {
	type: string
	id: string
	title: string
	subtitle: string
	imgSrc: string
	width: number
	aspectRatio?: number
	updateImage?: boolean
	link?: string
	isCollection?: boolean
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
	link,
	isCollection = false,
}: LibraryItemCardProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const [isFocused, setIsFocused] = useState<boolean>(false)
	const [isTitleOverflowing, setIsTitleOverflowing] = useState(false)
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

	const handleTextLayout = useCallback(
		(event: any) => {
			console.log({ event })
			if (event.nativeEvent.lines.length > 1 && !isTitleOverflowing) {
				setIsTitleOverflowing(true)
			}
		},
		[isTitleOverflowing]
	)

	return (
		<View
			style={{
				width,
				overflow: 'hidden',
				outline: 'none',
				transform: isFocused ? 'scale(1.05)' : 'scale(1)',
			}}
			className={`items-center transition-all duration-150 ease-in-out`}
		>
			<Link
				asChild
				href={{
					pathname: '/details/[id]',
					params: {
						id,
						type,
						isCollection: isCollection ? 'true' : 'false',
					},
				}}
			>
				<TouchableOpacity
					focusable
					className='flex flex-col items-center'
					onFocus={() => {
						setIsFocused(true)

						if (updateImage) setCurrentBackground(imageSrc ?? '')
					}}
					style={{ outline: 'none' }}
					onBlur={() => setIsFocused(false)}
				>
					{(!url || url === '') &&
					collectionImages &&
					collectionImages.images &&
					collectionImages.images.length > 0 ? (
						<CollectionImage
							images={collectionImages.images}
							type={type}
							width={width - 8}
							className={`border-4 border-transparent transition-all duration-150 ease-in-out ${
								isFocused ? 'border-white' : ''
							}`}
							height={width * (aspectRatio || 1) - 8}
						/>
					) : (
						<Image
							source={
								url && url !== ''
									? { uri: url }
									: type === LibraryTypes.MUSIC
										? require('@/assets/images/default/music.png')
										: require('@/assets/images/default/movie.jpg')
							}
							className={`border-4 border-transparent transition-all duration-150 ease-in-out`}
							style={{
								width,
								height: width * (aspectRatio || 1),
								borderRadius: 10,
								borderColor: isFocused ? 'white' : 'transparent',
							}}
						/>
					)}

					{/* Measurement component (not working) */}
					<Tertiary
						onTextLayout={handleTextLayout}
						className='absolute opacity-0 z-[-1]'
						style={{ width }}
					>
						{title}
					</Tertiary>

					{isFocused && !isTitleOverflowing ? (
						<Marquee spacing={100} speed={0.4}>
							<Tertiary className='truncate text-center'>
								{title}
							</Tertiary>
						</Marquee>
					) : (
						<Tertiary className='line-clamp-1 text-center'>
							{title}
						</Tertiary>
					)}

					<Tertiary className='line-clamp-1 text-center text-xl sm:text-md md:text-lg lg:text-xl'>
						{subtitle}
					</Tertiary>
				</TouchableOpacity>
			</Link>
		</View>
	)
}

export default memo(LibraryItemCard)
