import { useServerStore } from '@/context/server.context'
import { isAbsolutePath } from '@/utils/utils'
import React, { memo, useState, useEffect, useRef } from 'react'
import { Dimensions, View, Animated } from 'react-native' // Importa Animated
import ColorGradient from './ColorGradient'

// No es necesario modificar esta interfaz
interface HomeBackgroundProps {
	background: string
}

function HomeBackground({ background }: HomeBackgroundProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { width } = Dimensions.get('window')

	// --- Lógica de URL (sin cambios) ---
	const url = background
		? background.startsWith('http')
			? background
			: background.startsWith('local')
				? background.replace('local', '')
				: isAbsolutePath(background)
					? `${serverUrl}/image?path=${encodeURIComponent(background)}`
					: `${serverUrl}/${background.replace('resources/img', 'img')}`
		: ''

	const imageWidth = width * 0.55
	const imageHeight = (9 / 16) * imageWidth

	const processedImageUrl = background
		? `${serverUrl}/transparent-image-effect?${background.startsWith('http') ? `url=${encodeURIComponent(background)}` : `localPath=${background}`}&width=${imageWidth}&height=${imageHeight}`
		: ''

	// --- NUEVOS ESTADOS Y ANIMACIÓN ---

	// 1. Estado para saber si la imagen ya se cargó
	const [imageLoaded, setImageLoaded] = useState(false)

	// 2. Valor animado para la opacidad. Usamos useRef para que no se reinicie en cada render.
	const opacityAnim = useRef(new Animated.Value(0)).current

	// 3. Efecto que se dispara cuando la imagen se carga
	useEffect(() => {
		if (imageLoaded) {
			// Inicia la animación de opacidad
			Animated.timing(opacityAnim, {
				toValue: 0.8, // El valor final de opacidad que tenías
				duration: 500, // Duración de la animación en milisegundos
				useNativeDriver: true, // Importante para un buen rendimiento
			}).start()
		}
	}, [imageLoaded, opacityAnim])

	return (
		<View className='absolute top-0 w-screen flex-row h-screen items-start justify-end'>
			<ColorGradient showGradient imageSrc={url} />

			{/* 4. Usamos Animated.ImageBackground en lugar de ImageBackground */}
			<Animated.Image
				source={{ uri: processedImageUrl }}
				resizeMode='cover'
				// 5. El callback onLoad se llama cuando la imagen se ha descargado
				onLoad={() => setImageLoaded(true)}
				style={{
					width: imageWidth,
					height: imageHeight,
					// 6. La opacidad ahora es controlada por nuestro valor animado
					opacity: opacityAnim,
				}}
			/>
		</View>
	)
}

export default memo(HomeBackground)
