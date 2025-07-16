import { useServerStore } from '@/context/server.context'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

interface GradientBackgroundProps {
	showGradient?: boolean
	imageSrc?: string
}

// Componente interno para renderizar la pila de gradientes (VERSIÓN CORREGIDA)
const GradientStack = ({ colors }: { colors: string[] }) => {
	if (colors.length < 4) {
		return (
			<View style={[styles.absoluteFill, { backgroundColor: 'black' }]} />
		)
	}

	// ✅ CORRECCIÓN: Definimos las posiciones de inicio y fin para cada gradiente LINEAL
	// para que se comporte como un gradiente de esquina a esquina opuesta.
	const cornerVectors = [
		// De inferior-izquierda (0,1) a superior-derecha (1,0)
		{ start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
		// De inferior-derecha (1,1) a superior-izquierda (0,0)
		{ start: { x: 1, y: 1 }, end: { x: 0, y: 0 } },
		// De superior-derecha (1,0) a inferior-izquierda (0,1)
		{ start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
		// De superior-izquierda (0,0) a inferior-derecha (1,1)
		{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
	]

	return (
		<View style={styles.absoluteFill}>
			{/* Fondo negro base */}
			<View style={[styles.absoluteFill, { backgroundColor: 'black' }]} />

			{/* Renderizamos los 4 gradientes lineales en diagonal */}
			{cornerVectors.map((vectors, index) => (
				<LinearGradient
					key={index}
					colors={[colors[index], 'transparent']}
					// Usamos las props correctas: start y end
					start={vectors.start}
					end={vectors.end}
					style={styles.absoluteFill}
				/>
			))}
		</View>
	)
}

const GradientBackground = ({
	showGradient = true,
	imageSrc,
}: GradientBackgroundProps) => {
	// const serverUrl = useServerStore((state) => state.serverUrl);
	const serverUrl = useServerStore((state) => state.serverUrl)

	// Usamos un estado para almacenar los dos sets de colores para la transición
	const [colors, setColors] = useState<string[][]>([[], []])
	const [activeIndex, setActiveIndex] = useState(0)

	// Usamos la API Animated para controlar las opacidades de los dos "buffers"
	const opacityAnims = useRef([
		new Animated.Value(0),
		new Animated.Value(0),
	]).current

	useEffect(() => {
		if (!showGradient || !imageSrc) {
			// Si no hay imagen, fundimos a negro
			Animated.timing(opacityAnims[activeIndex], {
				toValue: 0,
				duration: 700,
				useNativeDriver: true, // Importante para el rendimiento
			}).start()
			return
		}

		const fetchAndAnimateGradient = async () => {
			try {
				const response = await fetch(
					`${serverUrl}/image-colors?${imageSrc.startsWith('http') ? `url=${imageSrc}` : `localPath=${imageSrc}`}`
				)
				const data = await response.json()

				if (data.colors && data.colors.length >= 4) {
					// El índice del buffer que está oculto y que vamos a actualizar
					const newIndex = (activeIndex + 1) % 2

					// Actualizamos el array de colores con los nuevos valores en el buffer oculto
					const newColors = [...colors]
					newColors[newIndex] = data.colors
					setColors(newColors)

					// Iniciamos la animación de fundido cruzado (crossfade)
					Animated.parallel([
						// El buffer antiguo se desvanece
						Animated.timing(opacityAnims[activeIndex], {
							toValue: 0,
							duration: 700,
							useNativeDriver: true,
						}),
						// El nuevo buffer aparece
						Animated.timing(opacityAnims[newIndex], {
							toValue: 1,
							duration: 700,
							useNativeDriver: true,
						}),
					]).start(() => {
						// Cuando la animación termina, actualizamos el índice activo
						setActiveIndex(newIndex)
					})
				}
			} catch (error) {
				console.error('Error fetching gradient:', error)
			}
		}

		fetchAndAnimateGradient()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [showGradient, imageSrc]) // El efecto se dispara cuando cambia la imagen

	return (
		<View style={styles.container}>
			{/* Renderizamos los dos "buffers" de gradiente. Uno siempre estará visible y el otro oculto. */}
			{colors.map((colorSet, i) => (
				<Animated.View
					key={i}
					style={[styles.absoluteFill, { opacity: opacityAnims[i] }]}
				>
					<GradientStack colors={colorSet} />
				</Animated.View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		zIndex: -1, // Se asegura de que el fondo esté siempre detrás de otros contenidos
		overflow: 'hidden',
		backgroundColor: 'black', // Fondo por defecto mientras carga
	},
	absoluteFill: {
		...StyleSheet.absoluteFillObject,
	},
})

export default GradientBackground
