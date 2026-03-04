import React, { memo, useEffect, useRef } from 'react'
import { StyleSheet, View, Animated, Easing } from 'react-native'
import { useServerStore } from '@/context/server.context'
import OptimizedImage from '../images/OptimizedImage'
import { getImageUrl } from '@/utils/utils'
import { scaledPixels } from '@/hooks/useScale'

interface AnimatedAlbumBackgroundProps {
	imageUrl: string
}

const AnimatedAlbumBackground: React.FC<AnimatedAlbumBackgroundProps> = ({
	imageUrl,
}) => {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const spinAnim = useRef(new Animated.Value(0)).current

	useEffect(() => {
		const animation = Animated.loop(
			Animated.timing(spinAnim, {
				toValue: 1,
				duration: 40000,
				easing: Easing.linear,
				useNativeDriver: true,
			})
		)

		animation.start()

		return () => {
			animation.stop()
			spinAnim.setValue(0)
		}
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

	const url = getImageUrl(serverUrl, imageUrl)

	const animatedStyle = {
		transform: [{ rotate: spin }, { scale: breathe }],
	}

	return (
		<View style={styles.container}>
			{/* 1. Imagen base de fondo */}
			<OptimizedImage
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
							width: scaledPixels(400),
							height: scaledPixels(400),
							top: '5%',
							left: '5%',
						},
						animatedStyle,
					]}
				>
					<OptimizedImage
						source={{ uri: url }}
						style={
							(StyleSheet.absoluteFill,
							styles.imageStyle,
							{
								width: scaledPixels(400),
								height: scaledPixels(400),
							})
						}
						resizeMode='cover'
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: scaledPixels(300),
							height: scaledPixels(300),
							top: '0%',
							right: '10%',
						},
						animatedStyle,
					]}
				>
					<OptimizedImage
						source={{ uri: url }}
						style={
							(StyleSheet.absoluteFill,
							styles.imageStyle,
							{
								width: scaledPixels(300),
								height: scaledPixels(300),
							})
						}
						resizeMode='cover'
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: scaledPixels(300),
							height: scaledPixels(300),
							bottom: '0%',
							left: '10%',
						},
						animatedStyle,
					]}
				>
					<OptimizedImage
						source={{ uri: url }}
						style={
							(StyleSheet.absoluteFill,
							styles.imageStyle,
							{
								width: scaledPixels(300),
								height: scaledPixels(300),
							})
						}
						resizeMode='cover'
					/>
				</Animated.View>
				<Animated.View
					style={[
						styles.spinnerBase,
						{
							width: scaledPixels(500),
							height: scaledPixels(500),
							bottom: '-20%',
							right: '5%',
						},
						animatedStyle,
					]}
				>
					<OptimizedImage
						source={{ uri: url }}
						style={
							(StyleSheet.absoluteFill,
							styles.imageStyle,
							{
								width: scaledPixels(500),
								height: scaledPixels(500),
							})
						}
						resizeMode='cover'
					/>
				</Animated.View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		zIndex: 0,
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		overflow: 'hidden',
		backgroundColor: 'black',
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
	brightnessOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
	},
})

export default memo(AnimatedAlbumBackground)
