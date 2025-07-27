import {
	collapsedSidebarWidth,
	expandedSidebarWidth,
} from '@/constants/SidebarSizes'
import useDataStore from '@/context/data.context'
import { scaledPixels } from '@/hooks/useScale'
import React, { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

function AnimatedTabContentView({ children }: { children: React.ReactNode }) {
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
				gap: scaledPixels(40),
				transform: [{ translateX: animatedPosition }],
			}}
		>
			{children}
		</Animated.View>
	)
}

export default AnimatedTabContentView
