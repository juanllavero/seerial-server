import React, { memo, useCallback, useEffect } from 'react'
import {
	Dimensions,
	View,
	BackHandler,
	Pressable,
	StyleSheet,
} from 'react-native'
import MusicGradient from './MusicGradient'
import { shallow } from 'zustand/shallow'
import useMusicStore from '@/context/music.context'
import { formatTime } from '@/utils/utils'
import { appColor } from '@/constants/Colors'
import Tertiary from '../text/Tertiary'
import { MessageSquareQuote } from 'lucide-react-native'
import StopIcon from '../svg/player/controls/StopIcon'
import LRCVisualizer from './lyrics/LRCVisualizer'

function MusicPlayer() {
	const { height } = Dimensions.get('window')
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
		setIsShown,
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

	const handleExpand = useCallback(() => setIsExpanded(true), [setIsExpanded])
	const toggleShowLyrics = useCallback(
		() => setShowLyrics(!showLyrics),
		[setShowLyrics, showLyrics]
	)

	const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

	if (!album || !currentSong) return null

	if (!isExpanded) {
		return (
			<View className='absolute top-10 right-10'>
				<Pressable onPress={handleExpand}></Pressable>
			</View>
		)
	}

	return (
		<View className='w-screen h-screen bg-black'>
			<MusicGradient imageUrl={album.coverSrc ?? ''} />

			<View className='flex-row justify-center items-center h-[80vh] gap-6 pb-20'>
				<LRCVisualizer />
			</View>

			{/* Controls */}
			{isShown && (
				<View style={styles.controlsContainer}>
					{/* Progress Slider */}
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

					<View className='flex-row justify-center items-center gap-5 w-full px-20'>
						<Pressable
							onPress={toggleShowLyrics}
							style={({ focused }) => [
								styles.buttonBase,
								{ width: height * 0.05, height: height * 0.05 },
								focused && styles.focused,
							]}
						>
							<MessageSquareQuote
								size={height * 0.03}
								color={showLyrics ? 'black' : 'white'}
								fill={showLyrics ? appColor : 'none'}
							/>
						</Pressable>

						<Pressable
							onPress={resetPlayerState}
							style={({ focused }) => [
								styles.buttonBase,
								{ width: height * 0.05, height: height * 0.05 },
								focused && styles.focused,
							]}
						>
							<StopIcon size={height * 0.04} />
						</Pressable>
					</View>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	controlsContainer: {
		position: 'absolute',
		bottom: 0,
		width: '100%',
		height: '20%',
		justifyContent: 'flex-start',
		alignItems: 'center',
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

export default memo(MusicPlayer)
