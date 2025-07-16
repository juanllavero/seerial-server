import React from 'react'
import { View, type ViewProps } from 'react-native'

// Definimos las props para la versión web
type BlurEffecProps = ViewProps & {
	children?: React.ReactNode
	// Agregamos `blurType` y `blurAmount` para que no den error de prop desconocida,
	// aunque no las usemos.
	blurType?: string
	blurAmount?: number
}

const BlurEffect: React.FC<BlurEffecProps> = ({
	children,
	style,
	...props
}) => {
	// Renderizamos un View con el estilo de desenfoque para CSS
	return (
		<View
			{...props}
			style={[
				style,
				// @ts-ignore -> Le decimos a TypeScript que ignore que 'backdropFilter' no es un estilo estándar de RN
				{ backdropFilter: 'blur(80px)' },
			]}
		>
			{children}
		</View>
	)
}

export default BlurEffect
