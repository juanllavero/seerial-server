import SearchIcon from '@/components/svg/SearchIcon'
import AppText from '@/components/text/AppText'
import { Link, Stack } from 'expo-router'
import React from 'react'
import { Pressable, View } from 'react-native'

export default function TabLayout() {
	return (
		<View className='w-screen h-screen'>
			<View className='flex-row w-screen justify-between items-center space-x-2 px-10 h-[5dvh]'>
				<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
					<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
						User
					</AppText>
				</Pressable>

				<View className='flex-row justify-center items-center space-x-2'>
					<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
						<SearchIcon />
					</Pressable>

					<Link asChild href='/'>
						<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
							<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
								Home
							</AppText>
						</Pressable>
					</Link>
					<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
						<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
							Libraries
						</AppText>
					</Pressable>
					<Link asChild href='/myList'>
						<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
							<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
								My List
							</AppText>
						</Pressable>
					</Link>
				</View>

				<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
					<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
						Settings
					</AppText>
				</Pressable>
			</View>

			<View className='h-[95dvh]'>
				<Stack screenOptions={{ headerShown: false }} />
			</View>
		</View>
	)
}
