import React from 'react'
// Este import SÓLO se ejecutará en builds nativas (iOS/Android)
import { BlurView, BlurViewProps } from '@react-native-community/blur'

type BlurEffectProps = BlurViewProps & {
	children?: React.ReactNode
}

const BlurEffect: React.FC<BlurEffectProps> = ({ children, ...props }) => {
	// Aquí usamos directamente BlurView porque sabemos que estamos en una plataforma nativa
	return <BlurView {...props}>{children}</BlurView>
}

export default BlurEffect
