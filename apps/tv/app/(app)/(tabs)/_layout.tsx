import NavBar from '@/components/navigation/NavBar'
import { Stack } from 'expo-router'
import React, { memo } from 'react'
import { View } from 'react-native'

function TabLayout() {
	return (
		<View className='relative w-screen h-screen'>
			<View className='h-screen w-screen'>
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: { backgroundColor: 'black' },
					}}
				/>
			</View>

			<NavBar />
		</View>
	)
}

export default memo(TabLayout)
