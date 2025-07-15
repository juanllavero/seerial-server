import { LinearGradient } from 'expo-linear-gradient'
import React, { useState, useEffect, useRef } from 'react'
import {
	Platform,
	View,
	StyleSheet,
	ActivityIndicator,
	ViewStyle,
} from 'react-native'
import { getColors } from 'react-native-image-colors'
import {
	AndroidImageColors,
	IOSImageColors,
} from 'react-native-image-colors/build/types'

// --- HOOK UNIVERSAL PARA EXTRAER COLORES ---
const useImageColors = (imageUrl: string) => {
	const [colors, setColors] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!imageUrl) {
			setIsLoading(false)
			return
		}

		const extractColors = async () => {
			setIsLoading(true)
			setError(null)
			setColors([])

			// --- Lógica para la WEB ---
			if (Platform.OS === 'web') {
				const image = new Image()
				image.crossOrigin = 'Anonymous'
				image.src = imageUrl

				image.onload = () => {
					const canvas = document.createElement('canvas')
					canvas.width = image.width
					canvas.height = image.height
					const ctx = canvas.getContext('2d')
					if (!ctx) {
						setError('No se pudo obtener el contexto del canvas.')
						setIsLoading(false)
						return
					}
					ctx.drawImage(image, 0, 0)
					try {
						const imageData = ctx.getImageData(
							0,
							0,
							canvas.width,
							canvas.height
						).data
						const colorCounts: { [key: string]: number } = {}
						const quality = 10
						for (let i = 0; i < imageData.length; i += 4 * quality) {
							const key = `${imageData[i]},${imageData[i + 1]},${imageData[i + 2]}`
							colorCounts[key] = (colorCounts[key] || 0) + 1
						}
						const sortedColors = Object.keys(colorCounts)
							.sort((a, b) => colorCounts[b] - colorCounts[a])
							.slice(0, 4)
							.map((key) => `rgb(${key})`)
						while (sortedColors.length < 4)
							sortedColors.push('rgb(23,23,23)')
						setColors(sortedColors)
					} catch (e) {
						setError('Error de CORS al procesar la imagen.')
					} finally {
						setIsLoading(false)
					}
				}
				image.onerror = () => {
					setError('No se pudo cargar la imagen.')
					setIsLoading(false)
				}
				// --- Lógica para NATIVO (iOS/Android) ---
			} else {
				try {
					const result = await getColors(imageUrl, {
						fallback: '#171717',
						cache: true,
						key: imageUrl,
					})

					const platformColors =
						Platform.select({
							android: [
								(result as AndroidImageColors).dominant,
								(result as AndroidImageColors).average,
								(result as AndroidImageColors).vibrant,
								(result as AndroidImageColors).darkVibrant,
							],
							ios: [
								(result as IOSImageColors).primary,
								(result as IOSImageColors).secondary,
								(result as IOSImageColors).background,
								(result as IOSImageColors).detail,
							],
						}) || []

					const finalColors = platformColors.filter((c) => !!c) as string[]
					while (finalColors.length < 4) finalColors.push('#171717')
					setColors(finalColors)
				} catch (e) {
					setError('Error al obtener colores de la imagen.')
					console.error(e)
				} finally {
					setIsLoading(false)
				}
			}
		}

		extractColors()
	}, [imageUrl])

	return { colors, isLoading, error }
}

// --- COMPONENTE GRADIENTBACKGROUND UNIVERSAL ---
interface GradientBackgroundProps {
	imageUrl: string
	children?: React.ReactNode
	width?: number | string
	height?: number | string
	zIndex?: number
}

const GradientBackground = ({
	imageUrl,
	children,
	width = '100%',
	height = '100%',
	zIndex = -1,
}: GradientBackgroundProps) => {
	const { colors, isLoading } = useImageColors(imageUrl)
	const [activeIndex, setActiveIndex] = useState(0)
	const [visible, setVisible] = useState(false)

	// --- Lógica para dibujar en el canvas (solo para web) ---
	const canvasRefs = [
		useRef<HTMLCanvasElement | null>(null),
		useRef<HTMLCanvasElement | null>(null),
	]
	const drawGradientOnCanvas = (
		canvas: HTMLCanvasElement,
		gradientColors: string[]
	) => {
		// ... (la misma lógica de dibujo que ya tenías)
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		canvas.width = canvas.offsetWidth
		canvas.height = canvas.offsetHeight
		const points = [
			{ x: 0, y: canvas.height, color: gradientColors[0] },
			{ x: canvas.width, y: canvas.height, color: gradientColors[1] },
			{ x: canvas.width, y: 0, color: gradientColors[2] },
			{ x: 0, y: 0, color: gradientColors[3] },
		]
		points.forEach(({ x, y, color }) => {
			const gradient = ctx.createRadialGradient(
				x,
				y,
				0,
				x,
				y,
				Math.max(canvas.width, canvas.height)
			)
			gradient.addColorStop(0, color)
			gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
			ctx.fillStyle = gradient
			ctx.fillRect(0, 0, canvas.width, canvas.height)
		})
		ctx.globalCompositeOperation = 'destination-over'
		ctx.fillStyle = 'black'
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		ctx.globalCompositeOperation = 'source-over'
	}

	useEffect(() => {
		if (isLoading || colors.length < 4) {
			setVisible(false)
			return
		}
		setVisible(true)

		const newIndex = (activeIndex + 1) % 2
		// Si es web, dibuja en el canvas
		if (Platform.OS === 'web' && canvasRefs[newIndex].current) {
			drawGradientOnCanvas(canvasRefs[newIndex].current!, colors)
		}

		const timeout = setTimeout(() => setActiveIndex(newIndex), 100)
		return () => clearTimeout(timeout)
	}, [colors, isLoading])

	const containerStyle = { width, height, zIndex }

	return (
		<View style={[styles.container, containerStyle as ViewStyle]}>
			{isLoading ? (
				<ActivityIndicator
					style={StyleSheet.absoluteFill}
					size='large'
					color='#FFF'
				/>
			) : (
				<>
					{Platform.OS === 'web'
						? // --- Renderizado para WEB ---
							[0, 1].map((i) => (
								<canvas
									key={i}
									ref={canvasRefs[i]}
									className=''
									style={{
										...StyleSheet.absoluteFillObject,
										transition: 'opacity 700ms ease-in-out',
										opacity: activeIndex === i && visible ? 1 : 0,
										filter: 'brightness(75%)',
									}}
								/>
							))
						: // --- Renderizado para NATIVO ---
							[0, 1].map((i) => (
								<LinearGradient
									key={i}
									colors={[colors[0], colors[1], colors[2], colors[3]]}
									style={[
										styles.gradient,
										{ opacity: activeIndex === i && visible ? 1 : 0 },
									]}
								/>
							))}
				</>
			)}
			{/* El contenido de tu componente se renderiza encima */}
			<View style={styles.childrenContainer}>{children}</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	gradient: {
		...StyleSheet.absoluteFillObject,
		// La transición de opacidad se maneja con el estado, no con CSS
	},
	childrenContainer: {
		flex: 1,
		position: 'relative',
		zIndex: 1,
	},
})

export default GradientBackground
