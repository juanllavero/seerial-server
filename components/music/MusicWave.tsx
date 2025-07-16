import useMusicStore from '@/context/music.context'
import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'

const MusicWave = () => {
	// Obtiene el estado de reproducción desde tu store (Zustand, Redux, etc.)
	const isPlaying = useMusicStore((state) => state.isPlaying)

	// Usamos useRef para mantener las mismas instancias de Animated.Value entre renders
	const barAnimations = useRef(
		[0, 1, 2, 3].map(() => new Animated.Value(0.2)) // Valor inicial (20% de altura)
	).current

	const delays = [0.3, 0.8, 0.5, 0.1]

	useEffect(() => {
		if (isPlaying) {
			// Iniciar animación para cada barra
			barAnimations.forEach((anim, index) => {
				// Creamos un retraso para cada animación para el efecto de onda
				setTimeout(() => {
					Animated.loop(
						Animated.sequence([
							// Animar hacia arriba
							Animated.timing(anim, {
								toValue: 1, // Representa el 90% de la altura
								duration: 400, // La mitad de la duración total (0.8s)
								easing: Easing.inOut(Easing.ease),
								useNativeDriver: false, // 'height' no es compatible con el driver nativo
							}),
							// Animar hacia abajo
							Animated.timing(anim, {
								toValue: 0, // Representa la altura mínima
								duration: 400,
								easing: Easing.inOut(Easing.ease),
								useNativeDriver: false,
							}),
						])
					).start()
				}, delays[index] * 1000) // Convertimos el delay a milisegundos
			})
		} else {
			// Detener y resetear las animaciones si la música se pausa
			barAnimations.forEach((anim) => {
				anim.stopAnimation() // Detiene el bucle
				Animated.timing(anim, {
					// Vuelve a la altura de "pausa"
					toValue: 0.2,
					duration: 200,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: false,
				}).start()
			})
		}

		// Función de limpieza para detener animaciones si el componente se desmonta
		return () => {
			barAnimations.forEach((anim) => anim.stopAnimation())
		}
	}, [isPlaying, barAnimations]) // El efecto se ejecuta cuando 'isPlaying' cambia

	return (
		<View className='flex-row h-6 items-end justify-center space-x-0.5'>
			{barAnimations.map((anim, index) => {
				// Interpolamos el valor animado (0 a 1) a un valor de altura real ('3px' a '90%')
				const height = anim.interpolate({
					inputRange: [0, 0.2, 1],
					outputRange: ['3px', '20%', '90%'], // Mapeo de valores
				})

				return (
					<Animated.View
						key={index}
						className='w-[0.18rem] bg-white' // Clases de estilo estáticas
						style={{
							height: height, // Aplicamos la altura animada
						}}
					/>
				)
			})}
		</View>
	)
}

export default memo(MusicWave)
