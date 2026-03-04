import React, { memo, useEffect, useRef } from 'react'
import { StyleSheet, View, Animated, Easing } from 'react-native'
import AnimatedAlbumBackground from './AnimatedAlbumBackground' // El componente que creamos antes
import BlurEffect from './blur/BlurEffect'

interface Props {
	imageUrl: string
}

const BlurredAnimatedBackground: React.FC<Props> = ({ imageUrl }) => {
	// 1. Valor animado para la opacidad, empieza en 0 (invisible)
	const opacityAnim = useRef(new Animated.Value(0)).current

	useEffect(() => {
		// 2. Después de un breve delay, inicia la animación de fade-in
		const timer = setTimeout(() => {
			Animated.timing(opacityAnim, {
				toValue: 1, // La opacidad final será 1 (totalmente visible)
				duration: 800, // Duración de la animación en milisegundos
				easing: Easing.out(Easing.ease), // Curva de animación suave
				useNativeDriver: true, // ¡Importante para el rendimiento!
			}).start()
		}, 250) // Delay de 250ms para evitar el "race condition"

		return () => clearTimeout(timer) // Limpieza del temporizador
	}, [opacityAnim])

	return (
		// 3. Contenedor principal animado que aplica la opacidad
		<Animated.View
			style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}
		>
			{/* Capa 1: El fondo con las imágenes que giran */}
			<AnimatedAlbumBackground imageUrl={imageUrl} />

			{/* Capa 2: El efecto de desenfoque encima del fondo */}
			<BlurEffect
				style={StyleSheet.absoluteFill}
				blurType='dark'
				blurAmount={100}
			>
				<View style={styles.brightnessOverlay} />
			</BlurEffect>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	brightnessOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
	},
})

export default memo(BlurredAnimatedBackground)
