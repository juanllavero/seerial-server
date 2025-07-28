import {
	collapsedSidebarWidth,
	expandedSidebarWidth,
} from '@/constants/SidebarSizes'
import useDataStore from '@/context/data.context'
import { scaledPixels } from '@/hooks/useScale'
import React, { useEffect, useRef } from 'react'
import { Animated, ViewStyle } from 'react-native'

function AnimatedTabContentView({
	children,
	containerStyles,
}: {
	children: React.ReactNode
	containerStyles?: ViewStyle
}) {
	const sidebarOpen = useDataStore((state) => state.sidebarOpen)
	const SIDEBAR_CLOSED_WIDTH = scaledPixels(collapsedSidebarWidth)
	const PADDING_LEFT = SIDEBAR_CLOSED_WIDTH + 20
	const SIDEBAR_OPEN_WIDTH =
		scaledPixels(expandedSidebarWidth) - SIDEBAR_CLOSED_WIDTH
	const animatedPosition = useRef(
		new Animated.Value(sidebarOpen ? SIDEBAR_OPEN_WIDTH : 0)
	).current

	useEffect(() => {
		Animated.timing(animatedPosition, {
			toValue: sidebarOpen ? SIDEBAR_OPEN_WIDTH : 0,
			duration: 150,
			useNativeDriver: true,
		}).start()
	}, [sidebarOpen])
	return (
		<Animated.View
			style={{
				paddingLeft: PADDING_LEFT,
				gap: scaledPixels(10),
				transform: [{ translateX: animatedPosition }],
				...containerStyles,
			}}
		>
			{children}
		</Animated.View>
	)
}

export default AnimatedTabContentView
