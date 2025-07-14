import { Stack } from 'expo-router'

export default function NoTabsLayout() {
	return (
		<Stack>
			<Stack.Screen name='details' options={{ headerShown: false }} />
			<Stack.Screen name='videoPlayer' options={{ headerShown: false }} />
		</Stack>
	)
}
