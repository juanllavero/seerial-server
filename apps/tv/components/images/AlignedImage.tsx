import React, { useState, useEffect, memo, useRef } from 'react'
import { View, Image, Dimensions, Animated } from 'react-native'
import { Image as OptimizedImage } from 'expo-image'

const { width } = Dimensions.get('window')

const AnimatedOptimizedImage = Animated.createAnimatedComponent(OptimizedImage)

const AlignedImage = ({
	imageUrl,
	height = 200,
	maxWidth = width,
	className,
}: {
	imageUrl: string
	height?: number
	maxWidth?: number
	className?: string
}) => {
	const [aspectRatio, setAspectRatio] = useState(1)
	const opacity = useRef(new Animated.Value(0)).current

	const fadeIn = () => {
		Animated.timing(opacity, {
			toValue: 1,
			duration: 400,
			useNativeDriver: true,
		}).start()
	}

	useEffect(() => {
		if (imageUrl) {
			opacity.setValue(0)

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
				height:
					width === maxWidth
						? height
						: Math.min(maxWidth / aspectRatio, height),
				maxWidth: maxWidth,
				alignItems: 'flex-start',
			}}
		>
			<AnimatedOptimizedImage
				source={{ uri: imageUrl }}
				style={{
					height: '100%',
					resizeMode: 'contain',
					aspectRatio,
					opacity: opacity,
					maxWidth: maxWidth,
				}}
				onLoad={fadeIn}
			/>
		</View>
	)
}

export default memo(AlignedImage)
