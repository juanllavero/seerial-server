import Background from '@/components/backgrounds/Background'
import NavBar from '@/components/navigation/NavBar'
import { Stack } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

export default function TabLayout() {
	return (
		<View className='relative w-screen h-screen'>
			<View className='h-screen w-screen'>
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: { backgroundColor: 'transparent' },
					}}
				/>
			</View>

			<NavBar />
		</View>
	)
}
