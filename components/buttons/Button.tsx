import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Secondary from '../text/Secondary'
import Tertiary from '../text/Tertiary'

interface ButtonProps {
	icon?: React.ComponentType<{ [key: string]: any }> | React.ReactElement
	iconSize?: number
	text?: string
	color?: string
	leftAlign?: boolean
	textSmall?: boolean
	hideText?: boolean
	fullWidth?: boolean
	transparent?: boolean
	onPress?: () => void
}

function Button({
	icon,
	iconSize = 30,
	text,
	color,
	textSmall,
	leftAlign,
	hideText,
	fullWidth,
	transparent,
	onPress,
}: ButtonProps) {
	const [isFocused, setIsFocused] = React.useState(false)
	const Icon = icon
	return (
		<TouchableOpacity
			focusable={true}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
			onPress={onPress}
			style={{
				backgroundColor: isFocused
					? 'white'
					: transparent
						? 'transparent'
						: '',
				transform: isFocused && !textSmall ? 'scale(1.05)' : 'scale(1)',
				width: fullWidth ? '100%' : 'auto',
				outline: 'none',
			}}
			className={`rounded-md bg-neutral-600/80  py-5 ${text && !textSmall ? 'px-10' : 'px-5'}`}
		>
			<View
				className={`flex-row items-center gap-5 ${leftAlign ? 'justify-start' : 'justify-center'}`}
			>
				{Icon &&
					(React.isValidElement(Icon) ? (
						Icon
					) : (
						<Icon size={iconSize} color={isFocused ? 'black' : 'white'} />
					))}
				{text &&
					!hideText &&
					(textSmall ? (
						<Tertiary
							noShadow
							className={`truncate ${isFocused ? 'text-black' : 'text-white'}`}
						>
							{text}
						</Tertiary>
					) : (
						<Secondary
							noShadow
							className={`truncate ${isFocused ? 'text-black' : 'text-white'}`}
						>
							{text}
						</Secondary>
					))}
			</View>
		</TouchableOpacity>
	)
}

export default Button
