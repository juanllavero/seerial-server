import AppText from '@/components/text/AppText'
import React, { memo } from 'react'
import { StyleSheet, View } from 'react-native'

const videoSource =
	'http://192.168.100.44:34200/video-file?path=H:/UHD/El%20Caballero%20Oscuro/El%20Caballero%20Oscuro%20(2008)/El%20Caballero%20Oscuro%20(2008).mkv'

function VideoPlayerScreen() {
	return (
		<View style={styles.contentContainer}>
			<AppText className='text-5xl text-stone-400'>Video Player</AppText>
		</View>
	)
}

const styles = StyleSheet.create({
	contentContainer: {
		flex: 1,
		padding: 10,
		alignItems: 'center',
		backgroundColor: 'trasnparent',
		justifyContent: 'center',
		paddingHorizontal: 50,
	},
	video: {
		width: 350,
		height: 275,
	},
	controlsContainer: {
		padding: 10,
	},
})

export default memo(VideoPlayerScreen)
