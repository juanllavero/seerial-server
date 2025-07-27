import OptimizedImage from '@/components/images/OptimizedImage'
import { useServerStore } from '@/context/server.context'
import React, { useRef, memo } from 'react'
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native'

interface VideoThumbnailProps {
	videoUrl: string
	snapshotAtTime?: number
	height: number
	style?: StyleProp<ViewStyle>
}

const VideoThumbnail = ({
	videoUrl,
	snapshotAtTime = 10,
	height,
	style,
}: VideoThumbnailProps) => {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const opacityAnim = useRef(new Animated.Value(0)).current
	const thumbnailUrl = `${serverUrl}/video-thumbnail?url=${encodeURIComponent(videoUrl)}&time=${snapshotAtTime}`

	return (
		<View style={[styles.container, style]}>
			{/* <OptimizedImage
				source={{ uri: thumbnailUrl }}
				style={[{ opacity: opacityAnim, height, width: (16 / 9) * height }]}
				resizeMode='cover'
			/> */}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		aspectRatio: 16 / 9,
		backgroundColor: 'transparent',
		borderRadius: 12,
		borderWidth: 4,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
	},
	absoluteFill: {
		...StyleSheet.absoluteFillObject,
	},
	errorContainer: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorText: {
		color: 'white',
		fontWeight: '500',
	},
})

export default memo(VideoThumbnail)
