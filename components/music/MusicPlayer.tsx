import React, { memo, useCallback, useEffect } from 'react'
import { View, BackHandler } from 'react-native'
import { shallow } from 'zustand/shallow'
import useMusicStore from '@/context/music.context'
import { router } from 'expo-router'
import Button from '../buttons/Button'

function MusicPlayer() {
	const { currentSong, album, isExpanded, setIsExpanded } = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			album: state.album,
			isExpanded: state.isExpanded,
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

	const handleExpand = useCallback(() => {
		router.push('/(app)/(no-tabs)/audioPlayer')
	}, [setIsExpanded])

	if (!album || !currentSong) return null

	return (
		<View className='absolute top-10 right-10'>
			<Button onPress={handleExpand} text='Expand Music Player' />
		</View>
	)
}

export default memo(MusicPlayer)
