import { Link, Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import Title from '@/components/text/Title'
import Secondary from '@/components/text/Secondary'
import { memo } from 'react'

function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: 'Oops!' }} />
			<View style={styles.container}>
				<Title>This screen doesn`&apos;`t exist.</Title>
				<Link href='/' style={styles.link}>
					<Secondary>Go to home screen!</Secondary>
				</Link>
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	link: {
		marginTop: 15,
		paddingVertical: 15,
	},
})

export default memo(NotFoundScreen)
