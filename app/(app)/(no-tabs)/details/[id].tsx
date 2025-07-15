import AppText from '@/components/text/AppText'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function DetailsScreen() {
	const { id } = useLocalSearchParams()
	return (
		<View style={styles.contentContainer}>
			<AppText className='text-5xl text-stone-400'>Details for {id}</AppText>
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
