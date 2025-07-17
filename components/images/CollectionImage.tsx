import { useServerStore } from '@/context/server.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { getImageUrl } from '@/utils/utils'
import React, { memo } from 'react'
import { View, Image, StyleSheet } from 'react-native'

interface CollectionImageProps {
	images: string[]
	type: string
	width: number
	height: number
	className?: string
	style?: StyleSheet
}

const CollectionImage: React.FC<CollectionImageProps> = ({
	images = [],
	type,
	width,
	height,
	className,
	style,
}) => {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const imageCount = images.length

	if (imageCount === 0) {
		const defaultImageSource =
			type === LibraryTypes.MUSIC
				? require('@/assets/images/default/music.png')
				: require('@/assets/images/default/movie.jpg')

		return (
			<View className={className} style={{ borderRadius: 10, ...style }}>
				<Image
					source={defaultImageSource}
					style={[styles.singleImage, { width, height, borderRadius: 10 }]}
				/>
			</View>
		)
	}

	if (imageCount === 1) {
		return (
			<Image
				source={{ uri: getImageUrl(serverUrl, images[0]) }}
				className={className}
				style={[
					styles.singleImage,
					{ width, height, borderRadius: 10, ...style },
				]}
			/>
		)
	}

	const gridImages: string[] = []
	for (let i = 0; i < 4; i++) {
		gridImages.push(images[i % imageCount])
	}

	return (
		<View className={className} style={{ borderRadius: 10, ...style }}>
			<View style={[styles.gridContainer, { width, height }]}>
				{gridImages.map((uri, index) => (
					<Image
						key={`${uri}-${index}`}
						source={{ uri: getImageUrl(serverUrl, uri) }}
						style={{
							width: width / 2,
							height: height / 2,
						}}
					/>
				))}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	singleImage: {
		resizeMode: 'cover',
	},
	gridContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		borderRadius: 10,
		overflow: 'hidden',
	},
})

export default memo(CollectionImage)
