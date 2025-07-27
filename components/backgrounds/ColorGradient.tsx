import { useServerStore } from '@/context/server.context'
import { LinearGradient } from 'expo-linear-gradient'
import React, { memo, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

// --- Componente GradientStack (sin cambios) ---
const cornerVectors = [
	{ start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
	{ start: { x: 1, y: 1 }, end: { x: 0, y: 0 } },
	{ start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
	{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
]

const GradientStack = memo(({ colors }: { colors: string[] }) => {
	if (colors.length < 4) {
		return null
	}
	return (
		<>
			{cornerVectors.map((vectors, index) => (
				<LinearGradient
					key={index}
					colors={[colors[index], 'transparent']}
					start={vectors.start}
					end={vectors.end}
					style={styles.absoluteFill}
				/>
			))}
		</>
	)
})

// --- Componente principal con la lógica de Debounce ---
interface GradientBackgroundProps {
	showGradient?: boolean
	imageSrc?: string
}

const GradientBackground = memo(function GradientBackground({
	showGradient = true,
	imageSrc,
}: GradientBackgroundProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const [currentColors, setCurrentColors] = useState<string[]>([])
	const [previousColors, setPreviousColors] = useState<string[]>([])
	const fadeAnim = useRef(new Animated.Value(0)).current

	// ✨ Ref para guardar el identificador del temporizador del debounce
	const debounceTimer = useRef<number | null>(null)

	// 1. Efecto para obtener los colores con Debounce
	useEffect(() => {
		// Cancela cualquier temporizador pendiente anterior.
		// Esto es clave: si imageSrc cambia rápidamente, la actualización anterior nunca se ejecuta.
		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current)
		}

		// Inicia un nuevo temporizador. La lógica solo se ejecutará si pasan 300ms
		// sin que este efecto se vuelva a disparar (es decir, sin que imageSrc cambie).
		debounceTimer.current = setTimeout(async () => {
			if (!showGradient || !imageSrc || !serverUrl) {
				setPreviousColors(currentColors)
				setCurrentColors([])
				return
			}

			try {
				const response = await fetch(
					`${serverUrl}/image-colors?${
						imageSrc.startsWith('http')
							? `url=${encodeURIComponent(imageSrc)}`
							: `localPath=${imageSrc}`
					}`
				)
				const data = await response.json()

				if (data.colors && data.colors.length >= 4) {
					setPreviousColors(currentColors)
					setCurrentColors(data.colors)
				}
			} catch (error) {
				console.error('Error fetching gradient:', error)
			}
		}, 300) // 👈 Tiempo de espera en milisegundos. ¡Puedes ajustarlo!

		// Función de limpieza: se ejecuta si el componente se desmonta.
		// Asegura que no queden temporizadores activos que puedan causar errores.
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current)
			}
		}
	}, [imageSrc, showGradient, serverUrl, currentColors]) // Añadimos currentColors por ser usado en el closure

	// 2. Efecto para la animación (sin cambios)
	useEffect(() => {
		fadeAnim.setValue(0)
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 1200,
			useNativeDriver: true,
		}).start()
	}, [currentColors])

	return (
		<View style={styles.container}>
			{/* Fondo Anterior */}
			{previousColors.length > 0 && (
				<Animated.View
					style={[
						styles.absoluteFill,
						{
							opacity: fadeAnim.interpolate({
								inputRange: [0, 1],
								outputRange: [1, 0],
							}),
						},
					]}
				>
					<GradientStack colors={previousColors} />
				</Animated.View>
			)}

			{/* Fondo Nuevo */}
			{currentColors.length > 0 && (
				<Animated.View style={[styles.absoluteFill, { opacity: fadeAnim }]}>
					<GradientStack colors={currentColors} />
				</Animated.View>
			)}
		</View>
	)
})

// --- Estilos (sin cambios) ---
const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'black',
	},
	absoluteFill: {
		...StyleSheet.absoluteFillObject,
	},
})

export default GradientBackground
