import { Stack } from 'expo-router'

export default function NoTabsLayout() {
	return (
		<Stack>
			<Stack.Screen name='videoPlayer' options={{ headerShown: false }} />
			<Stack.Screen name='audioPlayer' options={{ headerShown: false }} />
		</Stack>
	)
}
