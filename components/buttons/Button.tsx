import React, { memo } from 'react'
import { View } from 'react-native'
import Secondary from '../text/Secondary'
import Tertiary from '../text/Tertiary'
import {
	SpatialNavigationFocusableView,
	SpatialNavigationNode,
} from 'react-tv-space-navigation'

interface ButtonProps {
	icon?: React.ComponentType<{ [key: string]: any }> | React.ReactElement
	iconSize?: number
	ref?: any
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
	iconSize = 20,
	text,
	ref,
	color,
	textSmall,
	leftAlign,
	hideText,
	fullWidth,
	transparent,
	onPress,
}: ButtonProps) {
	const Icon = icon
	return (
		<SpatialNavigationNode>
			<SpatialNavigationFocusableView ref={ref} onSelect={onPress}>
				{({ isFocused }) => (
					<View
						style={{
							backgroundColor: isFocused
								? 'white'
								: transparent
									? 'transparent'
									: '#2b2b2b',
							transform:
								isFocused && !textSmall && !transparent
									? [{ scale: 1.05 }]
									: [{ scale: 1 }],
							opacity: isFocused && !transparent ? 1 : 0.8,
							width: fullWidth ? '100%' : 'auto',
							outline: 'none',
						}}
						className={`rounded-md py-2  justify-center ${text && !transparent ? 'px-10' : 'px-5'}`}
					>
						<View
							className={`flex-row items-center gap-3 ${leftAlign ? 'justify-start' : 'justify-center'}`}
						>
							{Icon &&
								(React.isValidElement(Icon) ? (
									Icon
								) : (
									<Icon
										size={iconSize}
										color={isFocused ? 'black' : 'white'}
									/>
								))}
							{text &&
								!hideText &&
								(textSmall ? (
									<Tertiary
										noShadow
										style={{ color: isFocused ? 'black' : 'white' }}
										className={`truncate`}
									>
										{text}
									</Tertiary>
								) : (
									<Secondary
										noShadow
										style={{ color: isFocused ? 'black' : 'white' }}
										className={`truncate`}
									>
										{text}
									</Secondary>
								))}
						</View>
					</View>
				)}
			</SpatialNavigationFocusableView>
		</SpatialNavigationNode>
	)
}

export default memo(Button)
