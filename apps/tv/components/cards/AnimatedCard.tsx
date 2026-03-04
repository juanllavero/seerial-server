import { memo, useRef, useEffect } from 'react'
import { Animated } from 'react-native'

const AnimatedCard = memo(
	({
		isFocused,
		width,
		children,
	}: {
		isFocused: boolean
		width: number
		children: React.ReactNode
	}) => {
		// useRef para mantener la instancia de Animated.Value estable entre re-renderizados.
		const scale = useRef(new Animated.Value(1)).current

		// useEffect para disparar la animación cada vez que 'isFocused' cambia.
		useEffect(() => {
			Animated.spring(scale, {
				toValue: isFocused ? 1.05 : 1, // Anima a 1.05 si está enfocado, si no a 1.
				friction: 7, // Controla la "elasticidad" de la animación de resorte.
				useNativeDriver: true, // Mejora el rendimiento ejecutando la animación en el hilo nativo.
			}).start()
		}, [isFocused, scale])

		return (
			<Animated.View
				style={{
					width,
					overflow: 'hidden',
					outline: 'none',
					transform: [{ scale: scale }], // Aplica el valor de escala animado.
				}}
				className='items-center'
			>
				{children}
			</Animated.View>
		)
	}
)

export default AnimatedCard
