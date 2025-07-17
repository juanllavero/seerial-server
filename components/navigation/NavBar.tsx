import { Link } from 'expo-router'
import React, { useState, useRef } from 'react'
import { View, Image, Dimensions, ScrollView, ViewProps } from 'react-native'
import Libraries from './Libraries'
import { useAuth } from '@/context/auth.context'
import { BookmarkIcon, SettingsIcon } from 'lucide-react-native'
import HomeIcon from '../svg/HomeIcon'
import Button from '../buttons/Button'
import useDataStore from '@/context/data.context'
import { shallow } from 'zustand/shallow'

function NavBar() {
	const user = useAuth((state) => state.user)
	const { sidebarOpen, setSidebarOpen } = useDataStore(
		(state) => ({
			sidebarOpen: state.sidebarOpen,
			setSidebarOpen: state.setSidebarOpen,
		}),
		shallow
	)
	const { height } = Dimensions.get('screen')

	const blurTimeout = useRef<number | null>(null)

	const handleFocus: ViewProps['onFocus'] = () => {
		if (blurTimeout.current) {
			clearTimeout(blurTimeout.current)
		}
		setSidebarOpen(true)
	}

	const handleBlur: ViewProps['onBlur'] = () => {
		blurTimeout.current = setTimeout(() => {
			setSidebarOpen(false)
		}, 10)
	}

	const relativeSize = sidebarOpen ? height * 0.3 : height * 0.1

	return (
		<View
			focusable
			onFocus={handleFocus}
			onBlur={handleBlur}
			className={`transition-all duration-300 ease-in-out absolute top-0 z-999 h-screen justify-between items-start space-y-5  pt-5 ${sidebarOpen ? 'px-5' : ''}`}
			style={{ width: relativeSize }}
		>
			<Button
				text={user?.name}
				transparent
				leftAlign
				fullWidth
				hideText={!sidebarOpen}
				icon={
					user && user.image && user.image !== '' ? (
						<Image
							source={{ uri: user.image }}
							className='rounded-full'
							style={{ width: height * 0.025, height: height * 0.025 }}
						/>
					) : (
						<Image
							source={require('@/assets/images/default/person.jpg')}
							className='rounded-full'
							style={{ width: height * 0.025, height: height * 0.025 }}
						/>
					)
				}
			/>

			<ScrollView
				showsHorizontalScrollIndicator={false}
				className='w-full'
				contentContainerStyle={{
					gap: 10,
					alignItems: 'center',
					height: '100%',
					justifyContent: 'space-between',
					paddingBottom: 10,
				}}
			>
				<View></View>
				<View className='justify-center items-start w-full space-y-2'>
					<Link asChild href='/myList'>
						<Button
							text='My List'
							leftAlign
							iconSize={24}
							fullWidth
							transparent
							hideText={!sidebarOpen}
							icon={BookmarkIcon}
						/>
					</Link>
					<Link asChild href='/'>
						<Button
							text='Home'
							leftAlign
							iconSize={24}
							fullWidth
							transparent
							hideText={!sidebarOpen}
							icon={HomeIcon}
						/>
					</Link>
					<Libraries isExpanded={sidebarOpen} />
				</View>

				<Button
					text='Settings'
					transparent
					leftAlign
					fullWidth
					iconSize={24}
					hideText={!sidebarOpen}
					icon={SettingsIcon}
				/>
			</ScrollView>
		</View>
	)
}

export default NavBar
