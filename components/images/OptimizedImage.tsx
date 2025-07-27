import React, { memo, useCallback, useState } from 'react'
import {
	Image,
	ImageResizeMode,
	ImageSourcePropType,
	ImageStyle,
	StyleProp,
	StyleSheet,
	View,
} from 'react-native'
import SkeletonWrapper from '../skeleton/SkeletonWrapper'

interface OptimizedImageProps {
	source: ImageSourcePropType | undefined
	className?: string
	style?: StyleProp<ImageStyle>
	resizeMode?: ImageResizeMode
	hideSkeleton?: boolean
	onLoad?: () => void
}

function OptimizedImage({
	source,
	className,
	style,
	resizeMode,
	hideSkeleton = false,
	onLoad,
}: OptimizedImageProps) {
	const [imageLoaded, setImageLoaded] = useState(false)
	const [skeletonDimensions, setSkeletonDimensions] = useState({
		width: 0,
		height: 0,
		borderRadius: 0,
	})

	const handleImageLoad = useCallback(() => {
		setImageLoaded(true)
		if (onLoad) {
			onLoad()
		}
	}, [])

	const handleImageError = useCallback(() => {
		console.warn('Error al cargar la imagen:', source)
	}, [source])

	const onLayout = useCallback(
		(event: any) => {
			const { width: layoutWidth, height: layoutHeight } =
				event.nativeEvent.layout

			const flatStyle = StyleSheet.flatten(style || {})
			const inferredBorderRadius =
				typeof flatStyle.borderRadius === 'number'
					? flatStyle.borderRadius
					: 4

			if (
				layoutWidth > 0 &&
				layoutHeight > 0 &&
				(layoutWidth !== skeletonDimensions.width ||
					layoutHeight !== skeletonDimensions.height ||
					inferredBorderRadius !== skeletonDimensions.borderRadius)
			) {
				setSkeletonDimensions({
					width: layoutWidth,
					height: layoutHeight,
					borderRadius: inferredBorderRadius,
				})
			} else {
				const styleWidth =
					typeof flatStyle.width === 'number' ? flatStyle.width : 0
				const styleHeight =
					typeof flatStyle.height === 'number' ? flatStyle.height : 0

				if (
					styleWidth > 0 &&
					styleHeight > 0 &&
					(styleWidth !== skeletonDimensions.width ||
						styleHeight !== skeletonDimensions.height ||
						inferredBorderRadius !== skeletonDimensions.borderRadius)
				) {
					setSkeletonDimensions({
						width: styleWidth,
						height: styleHeight,
						borderRadius: inferredBorderRadius,
					})
				}
			}
		},
		[style, skeletonDimensions]
	)

	return (
		<Image
			source={source}
			className={className}
			style={[style]}
			resizeMode={resizeMode}
			onLoad={handleImageLoad}
			onError={handleImageError}
		/>
	)

	const showSkeleton = !imageLoaded && !hideSkeleton

	return (
		<View style={style} onLayout={onLayout}>
			{!hideSkeleton &&
			skeletonDimensions.width > 0 &&
			skeletonDimensions.height > 0 ? (
				<SkeletonWrapper
					isLoading={showSkeleton}
					width={skeletonDimensions.width}
					height={skeletonDimensions.height}
					borderRadius={skeletonDimensions.borderRadius}
				>
					<Image
						source={source}
						className={className}
						style={[style]}
						resizeMode={resizeMode}
						onLoad={handleImageLoad}
						onError={handleImageError}
					/>
				</SkeletonWrapper>
			) : (
				<Image
					source={source}
					className={className}
					style={[style]}
					resizeMode={resizeMode}
					onLoad={handleImageLoad}
					onError={handleImageError}
				/>
			)}
		</View>
	)
}

export default memo(OptimizedImage)
