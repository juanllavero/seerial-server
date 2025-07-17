import React from 'react'
import { Text, StyleSheet, Platform } from 'react-native'

interface AppTextProps {
	className?: string
	style?: any
	onTextLayout?: any
	noShadow?: boolean
	children: React.ReactNode
}

const AppText = ({
	className,
	style,
	onTextLayout,
	noShadow,
	children,
	...props
}: AppTextProps) => {
	return (
		<Text
			className={className}
			onTextLayout={onTextLayout}
			style={[styles.text, !noShadow && styles.shadow, style]}
			{...props}
		>
			{children}
		</Text>
	)
}

const styles = StyleSheet.create({
	text: {
		fontFamily: 'Satoshi',
		color: 'white',
		...Platform.select({
			ios: {
				fontVariant: ['stylistic-one', 'stylistic-three', 'stylistic-four'],
			},
			android: {
				textShadowSettings: "'ss01' 1, 'ss03' 1, 'ss04' 1",
			},
		}),
	},
	shadow: {
		textShadowColor: 'black',
		textShadowOffset: { width: 0, height: 0 },
		textShadowRadius: 10,
	},
})

export default AppText
