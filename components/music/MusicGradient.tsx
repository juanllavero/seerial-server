import React, { useEffect, useRef } from 'react'
import {
	StyleSheet,
	View,
	Animated,
	Easing,
	Dimensions,
	ImageBackground,
} from 'react-native'
import { useServerStore } from '@/context/server.context'
import BlurEffect from './blur/BlurEffect.web'

interface MusicGradientProps {
	imageUrl: string
}

const MusicGradient: React.FC<MusicGradientProps> = ({ imageUrl }) => {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const spinAnim = useRef(new Animated.Value(0)).current

	useEffect(() => {
		// Inicia una animación en bucle infinito
		Animated.loop(
			Animated.timing(spinAnim, {
				toValue: 1, // El valor de la animación irá de 0 a 1
				duration: 40000, // 40 segundos, como en el CSS original
				easing: Easing.linear, // Animación lineal sin aceleración
				useNativeDriver: true, // Mejora el rendimiento al ejecutar la animación en el hilo de UI
			})
		).start()
	}, [spinAnim])

	// Interpola el valor de la animación (0 a 1) a una rotación (0deg a 360deg)
	const spin = spinAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	})

	// Interpola el valor para crear el efecto de "respiración" (escala de 1 a 1.05)
	const breathe = spinAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 1.05],
	})

	const url = `${serverUrl}/${imageUrl.replace('resources/img', 'img')}`

	// Calcula las dimensiones basadas en la altura de la pantalla para emular 'dvh'
	const { height: screenHeight } = Dimensions.get('window')
	const size60dvh = screenHeight * 0.6
	const size90dvh = screenHeight * 0.9

	const animatedStyle = {
		transform: [{ rotate: spin }, { scale: breathe }],
	}

	return (
		<View style={styles.container}>
			{/* 1. Imagen base de fondo */}
			<ImageBackground
				source={{ uri: url }}
				style={styles.baseImage}
				resizeMode='cover'
			/>

			{/* 2. Contenedor para las imágenes animadas */}
			<View style={styles.animatedContainer}>
				{/* Usamos Animated.ImageBackground para las imágenes que giran */}
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: size60dvh,
							height: size60dvh,
							top: '0%',
							left: '0%',
						},
						animatedStyle,
					]}
				>
					<ImageBackground
						source={{ uri: url }}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
						imageStyle={styles.imageStyle}
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: size60dvh,
							height: size60dvh,
							top: '0%',
							right: '0%',
						},
						animatedStyle,
					]}
				>
					<ImageBackground
						source={{ uri: url }}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
						imageStyle={styles.imageStyle}
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: size90dvh / 1.5,
							height: size90dvh / 1.5,
							top: '50%',
							left: '50%',
							marginLeft: -size90dvh / 3,
							marginTop: -size90dvh / 3,
						},
						animatedStyle,
					]}
				>
					<ImageBackground
						source={{ uri: url }}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
						imageStyle={styles.imageStyle}
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: size60dvh,
							height: size60dvh,
							bottom: '0%',
							left: '0%',
						},
						animatedStyle,
					]}
				>
					<ImageBackground
						source={{ uri: url }}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
						imageStyle={styles.imageStyle}
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: size90dvh / 1.2,
							height: size90dvh / 1.2,
							bottom: '0%',
							right: '0%',
						},
						animatedStyle,
					]}
				>
					<ImageBackground
						source={{ uri: url }}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
						imageStyle={styles.imageStyle}
					/>
				</Animated.View>
			</View>

			{/* 3. Capa de desenfoque y brillo */}
			<BlurEffect
				style={styles.blurOverlay}
				blurType='dark'
				blurAmount={100}
			>
				<View style={styles.brightnessOverlay} />
			</BlurEffect>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		overflow: 'hidden',
		backgroundColor: '#111',
	},
	baseImage: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		transform: [{ scale: 1.2 }],
	},
	animatedContainer: {
		position: 'relative',
		width: '100%',
		height: '100%',
	},
	spinnerBase: {
		position: 'absolute',
	},
	imageStyle: {
		borderRadius: 10,
	},
	blurOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
	},
	brightnessOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
	},
})

export default MusicGradient
