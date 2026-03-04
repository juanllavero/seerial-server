import { Stack } from 'expo-router'
import { memo } from 'react'

function AuthLayout() {
	return (
		<Stack>
			<Stack.Screen name='login' options={{ headerShown: false }} />
		</Stack>
	)
}

export default memo(AuthLayout)
