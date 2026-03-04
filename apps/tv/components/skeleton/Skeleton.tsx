import React, { memo, useEffect } from 'react'
import { View, StyleSheet, DimensionValue } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	interpolate,
	Easing,
} from 'react-native-reanimated'

interface SkeletonProps {
	height: DimensionValue
	width?: DimensionValue
	borderRadius?: number
}

function Skeleton({ height, width = '100%', borderRadius = 4 }: SkeletonProps) {
	const progress = useSharedValue(0)

	useEffect(() => {
		progress.value = withRepeat(
			withTiming(1, {
				duration: 1200,
				easing: Easing.bezier(0.5, 0, 0.25, 1),
			}),
			-1,
			true
		)
	}, [])

	const animatedStyle = useAnimatedStyle(() => {
		const translateX = interpolate(progress.value, [0, 1], [-350, 350])

		return {
			transform: [{ translateX }],
		}
	})

	return (
		<View
			style={[styles.container, { height, width, borderRadius }]}
			testID='skeleton-container'
		>
			<View style={[StyleSheet.absoluteFill]}>
				<LinearGradient
					style={styles.gradient}
					colors={['#2D2D2D', '#444444', '#2D2D2D']}
					start={{ x: 0, y: 0.5 }}
					end={{ x: 1, y: 0.5 }}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#2D2D2D',
		overflow: 'hidden',
	},
	gradient: {
		...StyleSheet.absoluteFillObject,
	},
})

export default memo(Skeleton)
