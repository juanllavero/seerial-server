import React from 'react'
import { Text, StyleSheet, Platform } from 'react-native'

interface AppTextProps {
	className?: string
	style?: any
	children: React.ReactNode
}

const AppText = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<Text className={className} style={[styles.text, style]} {...props}>
			{children}
		</Text>
	)
}

const styles = StyleSheet.create({
	text: {
		fontFamily: 'Satoshi',
		color: 'white',
		fontFeatureSettings: '"ss01" 1, "ss03" 1, "ss04" 1',
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
