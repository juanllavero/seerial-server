import React from 'react'
import { Text, StyleSheet, Platform } from 'react-native'

interface AppTextProps {
	className?: string
	style?: any
	onTextLayout?: any
	children: React.ReactNode
}

const AppText = ({
	className,
	style,
	onTextLayout,
	children,
	...props
}: AppTextProps) => {
	return (
		<Text
			className={className}
			onTextLayout={onTextLayout}
			style={[styles.text, style]}
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
		textShadowColor: 'black',
		textShadowOffset: { width: -1, height: 1 },
		textShadowRadius: 10,
		...Platform.select({
			ios: {
				fontVariant: ['stylistic-one', 'stylistic-three', 'stylistic-four'],
			},
			android: {
				textShadowSettings: "'ss01' 1, 'ss03' 1, 'ss04' 1",
			},
		}),
	},
})

export default AppText
