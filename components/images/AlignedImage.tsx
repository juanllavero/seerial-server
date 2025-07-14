import React, { useState, useEffect, memo } from 'react'
import { View, Image, Dimensions } from 'react-native'

const { width } = Dimensions.get('window')

const AlignedImage = ({
	imageUrl,
	height = 200,
	className,
}: {
	imageUrl: string
	height?: number
	className?: string
}) => {
	const [aspectRatio, setAspectRatio] = useState(1)

	useEffect(() => {
		if (imageUrl) {
			Image.getSize(imageUrl, (imgWidth, imgHeight) => {
				setAspectRatio(imgWidth / imgHeight)
			})
		}
	}, [imageUrl])

	return (
		<View
			className={className}
			style={{
				width,
				height,
				alignItems: 'flex-start',
			}}
		>
			<Image
				source={{ uri: imageUrl }}
				style={{
					height: '100%',
					resizeMode: 'contain',
					aspectRatio,
				}}
			/>
		</View>
	)
}

export default memo(AlignedImage)
