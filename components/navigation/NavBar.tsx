import { Link } from 'expo-router'
import React from 'react'
import { View, Pressable } from 'react-native'
import SearchIcon from '../svg/SearchIcon'
import AppText from '../text/AppText'
import Libraries from './Libraries'

function NavBar() {
	return (
		<View className='absolute top-0 z-999 h-screen justify-between items-center space-x-2 px-10 py-14'>
			<View>
				<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
					<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
						User
					</AppText>
				</Pressable>

				<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
					<SearchIcon />
				</Pressable>

				<Link asChild href='/myList'>
					<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
						<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
							My List
						</AppText>
					</Pressable>
				</Link>
			</View>

			<View className='justify-center items-center space-x-2'>
				<Link asChild href='/'>
					<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
						<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
							Home
						</AppText>
					</Pressable>
				</Link>
				<Libraries />
			</View>

			<Pressable className='flex justify-center w-fit h-fit px-6 py-3 bg-gray-600 rounded-full'>
				<AppText className='text-xl sm:text-sm md:text-md lg:text-lg'>
					Settings
				</AppText>
			</Pressable>
		</View>
	)
}

export default NavBar
