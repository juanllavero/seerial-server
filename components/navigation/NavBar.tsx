import { router, usePathname } from 'expo-router'
import React, { useRef, memo, useCallback, useEffect } from 'react'
import { View, Dimensions, Animated } from 'react-native'
import Libraries from './Libraries'
import { useAuth } from '@/context/auth.context'
import { BookmarkIcon, LucideHome, SettingsIcon } from 'lucide-react-native'
import Button from '../buttons/NavBarButton'
import useDataStore from '@/context/data.context'
import { shallow } from 'zustand/shallow'
import OptimizedImage from '../images/OptimizedImage'
import {
	DefaultFocus,
	SpatialNavigationRoot,
	SpatialNavigationScrollView,
	SpatialNavigationView,
} from 'react-tv-space-navigation'
import { scaledPixels } from '@/hooks/useScale'
import {
	collapsedSidebarWidth,
	expandedSidebarWidth,
} from '@/constants/SidebarSizes'

function NavBar() {
	const user = useAuth((state) => state.user)
	const { sidebarOpen, setSidebarOpen } = useDataStore(
		(state) => ({
			sidebarOpen: state.sidebarOpen,
			setSidebarOpen: state.setSidebarOpen,
		}),
		shallow
	)
	const pathname = usePathname()
	const { width } = Dimensions.get('screen')
	const animatedWidth = useRef(
		new Animated.Value(
			sidebarOpen
				? scaledPixels(expandedSidebarWidth)
				: scaledPixels(collapsedSidebarWidth)
		)
	).current

	// Refs
	const homeButtonRef = useRef<View | null>(null)
	const profileButtonRef = useRef<View | null>(null)
	const settingsButtonRef = useRef<View | null>(null)

	// Right press behavior
	const onDirectionHandledWithoutMovement = useCallback(
		(movement: string) => {
			if (movement === 'right') {
				setSidebarOpen(false)
			}
		},
		[setSidebarOpen]
	)

	// Animation
	useEffect(() => {
		Animated.timing(animatedWidth, {
			toValue: sidebarOpen
				? scaledPixels(expandedSidebarWidth)
				: scaledPixels(collapsedSidebarWidth),
			duration: 150,
			useNativeDriver: false,
		}).start()
	}, [animatedWidth, sidebarOpen])

	const handleProfilePress = useCallback(() => console.log('profile'), [])
	const handleSettingsPress = useCallback(() => console.log('settings'), [])

	const handleMyListPress = useCallback(() => {
		if (pathname === '/myList') return

		setSidebarOpen(false)
		router.push('/myList')
	}, [setSidebarOpen])

	const handleHomePress = useCallback(() => {
		setSidebarOpen(false)
		router.push('/')
	}, [setSidebarOpen])

	const imageSize = scaledPixels(70)

	return (
		<SpatialNavigationRoot
			isActive={sidebarOpen}
			onDirectionHandledWithoutMovement={onDirectionHandledWithoutMovement}
		>
			<View className={`absolute top-0 z-999 h-screen`}>
				<SpatialNavigationView direction='vertical'>
					<Animated.View
						className={`top-0 z-999 h-screen justify-between bg-white/10 items-start space-y-5 pt-5 ${sidebarOpen ? 'px-0' : ''}`}
						style={{ width: animatedWidth }}
					>
						<Button
							text={user?.name}
							ref={profileButtonRef}
							hideText={!sidebarOpen}
							onPress={handleProfilePress}
							icon={
								user && user.image && user.image !== '' ? (
									<OptimizedImage
										source={{ uri: user.image }}
										style={{
											width: imageSize,
											height: imageSize,
											borderRadius: 100,
										}}
									/>
								) : (
									<OptimizedImage
										source={require('@/assets/images/default/person.jpg')}
										className='rounded-full'
										style={{
											width: imageSize,
											height: imageSize,
										}}
									/>
								)
							}
						/>

						<SpatialNavigationScrollView
							contentContainerStyle={{
								gap: 10,
								alignItems: 'center',
								height: '100%',
								justifyContent: 'space-between',
								paddingBottom: 10,
							}}
						>
							<View></View>
							<View className='justify-start items-start w-full gap-1'>
								<Button
									text='My List'
									iconSize={scaledPixels(70)}
									onPress={handleMyListPress}
									hideText={!sidebarOpen}
									icon={BookmarkIcon}
								/>

								<DefaultFocus>
									<Button
										text='Home'
										ref={homeButtonRef}
										iconSize={scaledPixels(70)}
										onPress={handleHomePress}
										hideText={!sidebarOpen}
										icon={LucideHome}
									/>
								</DefaultFocus>

								<Libraries />
							</View>

							<Button
								text='Settings'
								ref={settingsButtonRef}
								iconSize={scaledPixels(70)}
								onPress={handleSettingsPress}
								hideText={!sidebarOpen}
								icon={SettingsIcon}
							/>
						</SpatialNavigationScrollView>
					</Animated.View>
				</SpatialNavigationView>
			</View>
		</SpatialNavigationRoot>
	)
}

export default memo(NavBar)
