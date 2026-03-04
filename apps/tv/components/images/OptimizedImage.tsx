import React, { memo, useCallback } from 'react'
import { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native'
import { Image, ImageContentFit, ImageLoadEventData } from 'expo-image'

interface OptimizedImageProps {
	source: ImageSourcePropType | undefined
	className?: string
	style?: StyleProp<ImageStyle>
	resizeMode?: ImageContentFit
	onLoad?: (e: ImageLoadEventData) => void
}

function OptimizedImage({
	source,
	className,
	style,
	resizeMode,
	onLoad,
}: OptimizedImageProps) {
	const handleImageError = useCallback(() => {
		console.warn('Error al cargar la imagen:', source)
	}, [source])

	return (
		<Image
			source={source}
			className={className}
			style={[style]}
			contentFit={resizeMode}
			onLoad={onLoad}
			onError={handleImageError}
		/>
	)
}

export default memo(OptimizedImage)
