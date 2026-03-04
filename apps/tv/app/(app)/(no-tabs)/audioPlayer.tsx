import React, { memo, useCallback, useEffect } from 'react'
import { View, BackHandler, StyleSheet, Dimensions } from 'react-native'
import { shallow } from 'zustand/shallow'
import useMusicStore from '@/context/music.context'
import { formatTime, getImageUrl } from '@/utils/utils'
import { appColor } from '@/constants/Colors'
import { MessageSquareQuote } from 'lucide-react-native'
import { Page } from '@/components/Page'
import Secondary from '@/components/text/Secondary'
import LRCVisualizer from '@/components/music/lyrics/LRCVisualizer'
import StopIcon from '@/components/svg/player/controls/StopIcon'
import Tertiary from '@/components/text/Tertiary'
import Button from '@/components/buttons/Button'
import {
	SpatialNavigationNode,
	SpatialNavigationView,
} from 'react-tv-space-navigation'
import { router } from 'expo-router'
import { scaledPixels } from '@/hooks/useScale'
import Subtitle from '@/components/text/Subtitle'
import { useServerStore } from '@/context/server.context'
import { AnimatedImage } from '@/components/images/AnimatedImage'
import BlurredAnimatedBackground from '@/components/music/BlurredAnimatedBackground'

function AudioPlayer() {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const {
		currentSong,
		album,
		showLyrics,
		isShown,
		isExpanded,
		currentTime,
		duration,
		resetPlayerState,
		setShowLyrics,
		setIsExpanded,
	} = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			album: state.album,
			showLyrics: state.showLyrics,
			isShown: state.isShown,
			isExpanded: state.isExpanded,
			currentTime: state.currentTime,
			duration: state.duration,
			resetPlayerState: state.resetPlayerState,
			setShowLyrics: state.setShowLyrics,
			setIsShown: state.setIsShown,
			setIsExpanded: state.setIsExpanded,
		}),
		shallow
	)
	const { width } = Dimensions.get('screen')

	const handleAndroidBackPress = useCallback(() => {
		if (isExpanded) {
			setIsExpanded(false)
			return true
		}
		return false
	}, [isExpanded, setIsExpanded])

	useEffect(() => {
		const subscription = BackHandler.addEventListener(
			'hardwareBackPress',
			handleAndroidBackPress
		)

		return () => subscription.remove()
	}, [handleAndroidBackPress])

	const toggleShowLyrics = useCallback(
		() => setShowLyrics(!showLyrics),
		[setShowLyrics, showLyrics]
	)

	const handleStop = useCallback(() => {
		resetPlayerState()
		router.back()
	}, [resetPlayerState])

	const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

	if (!album || !currentSong || !isExpanded)
		return (
			<Page>
				<Secondary>No song playing</Secondary>
			</Page>
		)

	return (
		<Page>
			<View className='relative w-screen h-screen bg-black'>
				<BlurredAnimatedBackground imageUrl={album.coverSrc ?? ''} />

				<View
					className='flex-row justify-center items-center h-screen w-screen gap-6 pb-20'
					style={{ zIndex: 1 }}
				>
					<View className='justify-center items-center'>
						<AnimatedImage
							uri={getImageUrl(serverUrl, album.coverSrc ?? '')}
							style={{
								width: scaledPixels(200),
								height: scaledPixels(200),
								borderRadius: 5,
							}}
						/>
						<Subtitle className='text-center pt-3 pb-0'>
							{currentSong.title}
						</Subtitle>
						<Secondary className='text-center'>{album.title}</Secondary>
					</View>
					<View
						className='justify-center items-center'
						style={{
							width: width / 2,
						}}
					>
						<LRCVisualizer />
					</View>
				</View>

				{/* Controls */}
				{isShown && (
					<SpatialNavigationView
						direction='vertical'
						style={styles.controlsContainer}
					>
						{/* Progress Slider */}
						<SpatialNavigationNode>
							<View style={styles.sliderWrapper}>
								<View style={styles.sliderTrack}>
									<View
										style={[
											styles.sliderProgress,
											{ width: `${progressPercentage}%` },
										]}
									/>
								</View>
								<View className='flex-row justify-between items-center w-full'>
									<Tertiary>{formatTime(currentTime)}</Tertiary>
									<Tertiary>{formatTime(duration)}</Tertiary>
								</View>
							</View>
						</SpatialNavigationNode>

						<SpatialNavigationView
							style={{
								justifyContent: 'center',
								alignItems: 'center',
								gap: 5,
								paddingHorizontal: 20,
							}}
							direction='horizontal'
						>
							<Button
								onPress={toggleShowLyrics}
								icon={MessageSquareQuote}
							/>

							<Button onPress={handleStop} icon={StopIcon} />
						</SpatialNavigationView>
					</SpatialNavigationView>
				)}
			</View>
		</Page>
	)
}

const styles = StyleSheet.create({
	controlsContainer: {
		position: 'absolute',
		bottom: 0,
		width: '90%',
		height: '20%',
		justifyContent: 'flex-start',
		alignSelf: 'center',
		alignItems: 'center',
		zIndex: 2,
		gap: 20,
	},
	sliderWrapper: {
		width: '100%',
		height: '35%',
		justifyContent: 'flex-end',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 20,
	},
	sliderTrack: {
		height: '25%',
		width: '100%',
		backgroundColor: 'rgba(113, 113, 113, 0.8)',
		borderRadius: 12,
		elevation: 5,
	},
	sliderProgress: {
		height: '100%',
		backgroundColor: appColor,
		borderRadius: 12,
	},
	buttonBase: {
		backgroundColor: 'rgba(75, 85, 99, 0.8)',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 10,
	},
	focused: {
		borderColor: appColor,
		borderWidth: 2,
		transform: [{ scale: 1.1 }],
	},
})

export default memo(AudioPlayer)
