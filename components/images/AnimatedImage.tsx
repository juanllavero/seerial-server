import React, { useRef, useEffect } from 'react'
import { Animated, StyleProp, ImageStyle } from 'react-native'
import { Image as OptimizedImage, ImageProps } from 'expo-image'

const AnimatedOptimizedImage = Animated.createAnimatedComponent(OptimizedImage)

interface AnimatedImageProps extends Omit<ImageProps, 'source' | 'style'> {
	uri: string | null | undefined
	style?: StyleProp<ImageStyle>
	duration?: number
	toValue?: number
}

export function AnimatedImage({
	uri,
	style,
	duration = 500,
	toValue = 1,
	...rest
}: AnimatedImageProps) {
	const opacity = useRef(new Animated.Value(0)).current

	const fadeIn = () => {
		Animated.timing(opacity, {
			toValue,
			duration,
			useNativeDriver: true,
		}).start()
	}

	useEffect(() => {
		opacity.setValue(0)
	}, [uri, opacity])

	if (!uri) {
		return null
	}

	return (
		<AnimatedOptimizedImage
			source={{ uri }}
			onLoad={fadeIn}
			style={[style, { opacity }]}
			{...rest}
		/>
	)
}
