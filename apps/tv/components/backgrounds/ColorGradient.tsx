import { useServerStore } from '@/context/server.context'
import { LinearGradient } from 'expo-linear-gradient'
import React, { memo, useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

interface GradientBackgroundProps {
	showGradient?: boolean
	imageSrc?: string
}

/**
 * Un componente de fondo que muestra un gradiente de color extraído de una imagen.
 * Incluye una animación de fundido cruzado (cross-fade) al cambiar de imagen.
 */
const GradientBackground = memo(function GradientBackground({
	showGradient = true,
	imageSrc,
}: GradientBackgroundProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)

	// Se utilizan dos estados de colores para permitir la transición entre el gradiente antiguo y el nuevo.
	const [colors1, setColors1] = useState<string[]>([])
	const [colors2, setColors2] = useState<string[]>([])

	// Valores animados para controlar la opacidad de cada gradiente.
	const fadeAnim1 = useRef(new Animated.Value(0)).current
	const fadeAnim2 = useRef(new Animated.Value(0)).current

	// Referencia para rastrear qué gradiente está actualmente activo (1 o 2).
	const activeGradient = useRef<1 | 2>(1)

	// Referencia para el temporizador del debounce.
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		// Limpia el temporizador anterior si existe.
		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current)
		}

		// Establece un debounce para evitar peticiones excesivas mientras el usuario cambia de imagen rápidamente.
		debounceTimer.current = setTimeout(async () => {
			// Si el gradiente no debe mostrarse o no hay imagen, se desvanece el gradiente activo.
			if (!showGradient || !imageSrc || !serverUrl) {
				const activeAnim =
					activeGradient.current === 1 ? fadeAnim1 : fadeAnim2
				Animated.timing(activeAnim, {
					toValue: 0,
					duration: 500,
					useNativeDriver: true, // Usa el hilo de UI para una animación más fluida.
				}).start()
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

				// Asegura que se recibieron al menos 2 colores para poder formar un gradiente.
				if (data.colors && data.colors.length >= 2) {
					const newColors = data.colors.slice(0, 2)
					const isFirstLoad = colors1.length === 0 && colors2.length === 0

					// Si es la primera carga, simplemente muestra el primer gradiente.
					if (isFirstLoad) {
						setColors1(newColors)
						Animated.timing(fadeAnim1, {
							toValue: 1,
							duration: 1000,
							useNativeDriver: true,
						}).start()
						activeGradient.current = 1
					} else {
						// Si ya hay un gradiente, realiza una transición cruzada.
						if (activeGradient.current === 1) {
							// Carga los nuevos colores en el gradiente 2 (el inactivo).
							setColors2(newColors)
							// Anima en paralelo: el gradiente 1 se desvanece y el 2 aparece.
							Animated.parallel([
								Animated.timing(fadeAnim1, {
									toValue: 0,
									duration: 1500,
									useNativeDriver: true,
								}),
								Animated.timing(fadeAnim2, {
									toValue: 1,
									duration: 1500,
									useNativeDriver: true,
								}),
							]).start()
							// El gradiente 2 es ahora el activo.
							activeGradient.current = 2
						} else {
							// Carga los nuevos colores en el gradiente 1 (el inactivo).
							setColors1(newColors)
							// Anima en paralelo: el gradiente 2 se desvanece y el 1 aparece.
							Animated.parallel([
								Animated.timing(fadeAnim2, {
									toValue: 0,
									duration: 1500,
									useNativeDriver: true,
								}),
								Animated.timing(fadeAnim1, {
									toValue: 1,
									duration: 1500,
									useNativeDriver: true,
								}),
							]).start()
							// El gradiente 1 es ahora el activo.
							activeGradient.current = 1
						}
					}
				}
			} catch (error) {
				console.error('Error fetching gradient:', error)
				// En caso de error, oculta ambos gradientes.
				Animated.parallel([
					Animated.timing(fadeAnim1, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					}),
					Animated.timing(fadeAnim2, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					}),
				]).start()
			}
		}, 300)

		// Función de limpieza para el useEffect.
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current)
			}
		}
	}, [
		imageSrc,
		showGradient,
		serverUrl,
		fadeAnim1,
		fadeAnim2,
		colors1.length,
		colors2.length,
	])

	return (
		<View style={styles.container}>
			{/* Gradiente 1: se renderiza solo si tiene colores */}
			{colors1.length > 0 && (
				<Animated.View
					style={[styles.absoluteFill, { opacity: fadeAnim1 }]}
				>
					<LinearGradient
						colors={colors1 as [string, string]}
						style={styles.absoluteFill}
					/>
				</Animated.View>
			)}

			{/* Gradiente 2: se renderiza solo si tiene colores */}
			{colors2.length > 0 && (
				<Animated.View
					style={[styles.absoluteFill, { opacity: fadeAnim2 }]}
				>
					<LinearGradient
						colors={colors2 as [string, string]}
						style={styles.absoluteFill}
					/>
				</Animated.View>
			)}
		</View>
	)
})

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'black', // Fondo por defecto mientras carga el gradiente.
	},
	absoluteFill: {
		...StyleSheet.absoluteFillObject,
	},
})

export default GradientBackground
