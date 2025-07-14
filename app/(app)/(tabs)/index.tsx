import ContinueWatchingContent from '@/components/continueWatching/ContinueWatchingContent'
import React from 'react'
import { Text, StyleSheet, View } from 'react-native'

const videoSource =
	'http://192.168.100.44:34200/video-file?path=H:/UHD/El%20Caballero%20Oscuro/El%20Caballero%20Oscuro%20(2008)/El%20Caballero%20Oscuro%20(2008).mkv'

export default function HomeScreen() {
	return (
		<View className='bg-white w-screen h-screen'>
			<ContinueWatchingContent />
		</View>
	)
}
