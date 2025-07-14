import AppText from '@/components/text/AppText'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function VideoPlayerScreen() {
	return (
		<View style={styles.contentContainer} className='bg-white'>
			<AppText className='text-5xl text-stone-400'>Video Player</AppText>
		</View>
	)
}

const styles = StyleSheet.create({
	contentContainer: {
		flex: 1,
		padding: 10,
		alignItems: 'center',
		backgroundColor: 'white',
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
