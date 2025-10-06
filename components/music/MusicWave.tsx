import useMusicStore from '@/context/music.context'
import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'

interface MusicWaveProps {
	width?: number
	color?: string
	maxHeight?: number
}

const MusicWave = ({
	width = 4,
	color = '#FFFFFF',
	maxHeight = 12,
}: MusicWaveProps) => {
	const isPlaying = useMusicStore((state) => state.isPlaying)

	const barAnimations = useRef(
		[0, 1, 2, 3].map(() => new Animated.Value(0.2))
	).current

	// CAMBIO 1: Nuevo orden de delays para la animación asimétrica.
	// Orden: 1ª barra, 4ª barra, 2ª barra, 3ª barra.
	const delays = [0, 400, 600, 200]

	useEffect(() => {
		if (isPlaying) {
			barAnimations.forEach((anim, index) => {
				Animated.loop(
					Animated.sequence([
						// Usamos el delay para desfasar el inicio de cada ciclo
						Animated.delay(delays[index]),
						Animated.timing(anim, {
							toValue: 1,
							duration: 400,
							easing: Easing.inOut(Easing.ease),
							useNativeDriver: true,
						}),
						Animated.timing(anim, {
							toValue: 0.2,
							duration: 400,
							easing: Easing.inOut(Easing.ease),
							useNativeDriver: true,
						}),
						// Pequeña pausa al final del ciclo para evitar que sea demasiado repetitivo
						Animated.delay(200),
					])
				).start()
			})
		} else {
			barAnimations.forEach((anim) => {
				anim.stopAnimation()
				Animated.timing(anim, {
					toValue: 0.2,
					duration: 200,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}).start()
			})
		}

		return () => {
			barAnimations.forEach((anim) => anim.stopAnimation())
		}
	}, [isPlaying])

	return (
		// El contenedor usa `items-end` para alinear las barras en la parte inferior.
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'flex-end',
				justifyContent: 'center',
				height: maxHeight,
				columnGap: 1,
			}}
		>
			{barAnimations.map((anim, index) => {
				const scaleY = anim.interpolate({
					inputRange: [0.2, 1],
					// Mapeamos a una escala mínima (e.g., 20%) y máxima (100%)
					outputRange: [0.2, 1],
				})

				return (
					<Animated.View
						key={index}
						style={{
							height: maxHeight, // Altura fija que ocupa todo el espacio
							width: width,
							backgroundColor: color,
							// CAMBIO 2: La transformación `scaleY` con `align-items-end` crea el efecto.
							transform: [{ scaleY }],
						}}
					/>
				)
			})}
		</View>
	)
}

export default memo(MusicWave)
