import { useServerStore } from '@/context/server.context'
import React, { useState, useRef, useEffect, memo } from 'react'
import {
	View,
	StyleSheet,
	Animated,
	StyleProp,
	ViewStyle,
	Text,
} from 'react-native'

interface VideoThumbnailProps {
	videoUrl: string
	snapshotAtTime?: number
	height: number
	style?: StyleProp<ViewStyle>
}

const VideoThumbnail = ({
	videoUrl,
	snapshotAtTime = 10,
	height,
	style,
}: VideoThumbnailProps) => {
	const serverUrl = useServerStore((state) => state.serverUrl)

	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)

	const opacityAnim = useRef(new Animated.Value(0)).current
	const thumbnailUrl = `${serverUrl}/video-thumbnail?url=${encodeURIComponent(videoUrl)}&time=${snapshotAtTime}`

	const handleImageLoad = () => {
		setIsLoading(false)
		setHasError(false)
		Animated.timing(opacityAnim, {
			toValue: 1,
			duration: 400,
			useNativeDriver: true,
		}).start()
	}

	const handleImageError = () => {
		setIsLoading(false)
		setHasError(true)
	}

	return (
		<View style={[styles.container, style]}>
			{/* El esqueleto se muestra solo durante la carga inicial */}
			{/* {isLoading && <Skeleton style={styles.absoluteFill} />} */}

			{/* Mensaje de error si la carga de la imagen falla */}
			{hasError && (
				<View style={[styles.absoluteFill, styles.errorContainer]}>
					<Text style={styles.errorText}>Error al cargar</Text>
				</View>
			)}

			{/* La imagen de la miniatura, inicialmente transparente */}
			<Animated.Image
				source={{ uri: thumbnailUrl }}
				style={[{ opacity: opacityAnim, height, width: (16 / 9) * height }]}
				onLoad={handleImageLoad}
				onError={handleImageError}
				resizeMode='cover'
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		aspectRatio: 16 / 9,
		backgroundColor: '#222', // Un color de fondo mientras carga
		borderRadius: 12,
		overflow: 'hidden', // Necesario para que el borderRadius afecte a la imagen
		justifyContent: 'center',
		alignItems: 'center',
	},
	absoluteFill: {
		...StyleSheet.absoluteFillObject,
	},
	errorContainer: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorText: {
		color: 'white',
		fontWeight: '500',
	},
})

export default memo(VideoThumbnail)
