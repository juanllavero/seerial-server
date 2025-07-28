import { useServerStore } from '@/context/server.context'
import { getImageUrl } from '@/utils/utils'
import React, { memo, useState, useEffect, useRef } from 'react'
import { Dimensions, View, Animated } from 'react-native'
import ColorGradient from './ColorGradient'
import { Image as OptimizedImage } from 'expo-image'

// 1. Creamos la versión animable de OptimizedImage
const AnimatedOptimizedImage = Animated.createAnimatedComponent(OptimizedImage)

interface HomeBackgroundProps {
	background: string
}

function HomeBackground({ background }: HomeBackgroundProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { width } = Dimensions.get('window')
	const [url, setUrl] = useState('')
	const [processedImageUrl, setProcessedImageUrl] = useState('')

	// 2. Creamos la referencia para el valor animado de opacidad
	const opacity = useRef(new Animated.Value(0)).current

	const imageWidth = width * 0.65
	const imageHeight = (9 / 16) * imageWidth

	// 3. Definimos la animación de fade-in (hasta 0.7 de opacidad)
	const fadeIn = () => {
		Animated.timing(opacity, {
			toValue: 0.7,
			duration: 500,
			useNativeDriver: true,
		}).start()
	}

	useEffect(() => {
		if (background) {
			// 4. Reseteamos la opacidad y la URL procesada inmediatamente
			opacity.setValue(0)
			setProcessedImageUrl('')

			const originalUrl = getImageUrl(serverUrl, background)
			setUrl(originalUrl)

			// 5. Se elimina el setTimeout. La URL se genera y se asigna al instante.
			// La imagen permanecerá oculta (opacity: 0) hasta que 'onLoad' se dispare.
			const processedUrl = `${serverUrl}/transparent-image-effect?${background.startsWith('http') ? `url=${encodeURIComponent(background)}` : `localPath=${background}`}&width=${Math.round(imageWidth * 2)}&height=${Math.round(imageHeight * 2)}`
			setProcessedImageUrl(processedUrl)
		} else {
			setUrl('')
			setProcessedImageUrl('')
		}
	}, [background, serverUrl, imageWidth, imageHeight])

	return (
		<View className='absolute top-0 w-screen flex-row h-screen items-start justify-end'>
			<ColorGradient showGradient imageSrc={url} />

			{/* La imagen se renderiza si hay una URL, pero la opacidad controla su visibilidad */}
			{processedImageUrl ? (
				<AnimatedOptimizedImage
					source={{ uri: processedImageUrl }}
					resizeMode='cover'
					style={{
						width: imageWidth,
						height: imageHeight,
						// 6. La opacidad ahora es controlada por el valor animado
						opacity: opacity,
					}}
					// 7. La animación se inicia al cargar la imagen
					onLoad={fadeIn}
				/>
			) : null}
		</View>
	)
}

export default memo(HomeBackground)
