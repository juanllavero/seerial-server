import React, { memo } from 'react'
import { View } from 'react-native'
import Secondary from '../text/Secondary'
import {
	SpatialNavigationFocusableView,
	SpatialNavigationNode,
} from 'react-tv-space-navigation'
import useDataStore from '@/context/data.context'
import { scaledPixels } from '@/hooks/useScale'
import {
	collapsedSidebarWidth,
	expandedSidebarWidth,
} from '@/constants/SidebarSizes'

interface ButtonProps {
	icon?: React.ComponentType<{ [key: string]: any }> | React.ReactElement
	iconSize?: number
	ref?: any
	text?: string
	color?: string
	hideText?: boolean
	onPress?: () => void
}

function Button({
	icon,
	iconSize = 20,
	text,
	ref,
	color,
	hideText,
	onPress,
}: ButtonProps) {
	const Icon = icon
	const sidebarOpen = useDataStore((state) => state.sidebarOpen)

	const buttonWidth = sidebarOpen
		? scaledPixels(expandedSidebarWidth - 80)
		: scaledPixels(collapsedSidebarWidth - 80)
	return (
		<SpatialNavigationNode>
			<SpatialNavigationFocusableView ref={ref} onSelect={onPress}>
				{({ isFocused }) => (
					<View
						style={{
							backgroundColor: isFocused ? 'white' : 'transparent',
							//transform: isFocused ? [{ scale: 1.05 }] : [{ scale: 1 }],
							opacity: isFocused ? 1 : 0.8,
							width: buttonWidth,
							outline: 'none',
							marginHorizontal: 10,
						}}
						className={`rounded-md py-2 flex-row  justify-start gap-2 items-center px-2`}
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
						{text && !hideText && (
							<Secondary
								noShadow
								style={{
									color: isFocused ? 'black' : 'white',
									width: buttonWidth - 35,
								}}
								className={`truncate line-clamp-1 ellipsis`}
							>
								{text}
							</Secondary>
						)}
					</View>
				)}
			</SpatialNavigationFocusableView>
		</SpatialNavigationNode>
	)
}

export default memo(Button)
