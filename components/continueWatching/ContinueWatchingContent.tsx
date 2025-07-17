import { useAuth } from '@/context/auth.context'
import { useServerStore } from '@/context/server.context'
import { ContinueWatchingElement } from '@/data/interfaces/Lists'
import { fetcher } from '@/utils/utils'
import React, { useEffect } from 'react'
import {
	Dimensions,
	FlatList,
	Image,
	TouchableOpacity,
	View,
} from 'react-native'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import AppText from '../text/AppText'
import Secondary from '../text/Secondary'
import Subtitle from '../text/Subtitle'
import Title from '../text/Title'
import ListTitle from '../text/ListTitle'
import AlignedImage from '../images/AlignedImage'
import HomeBackground from '../backgrounds/HomeBackground'
import useDataStore from '@/context/data.context'

function ContinueWatchingContent() {
	const user = useAuth((state) => state.user)
	const sidebarOpen = useDataStore((state) => state.sidebarOpen)
	const { selectedServer, selectServer, serverUrl } = useServerStore(
		(state) => ({
			selectedServer: state.selectedServer,
			selectServer: state.selectServer,
			serverUrl: state.serverUrl,
		}),
		shallow
	)
	const { height } = Dimensions.get('screen')
	const [selectedElement, setSelectedElement] =
		React.useState<ContinueWatchingElement | null>(null)

	// Get Continue Watching items
	const { data: continueWatching, isLoading } = useSWR<
		ContinueWatchingElement[]
	>(selectedServer ? `${serverUrl}/continueWatching` : null, fetcher)

	useEffect(() => {
		if (user && user.servers.length > 0) {
			selectServer(user.servers[0])
		}
	}, [user])

	useEffect(() => {
		if (continueWatching && continueWatching.length > 0) {
			setSelectedElement(continueWatching[0])
		}
	}, [continueWatching])

	if (isLoading) return <AppText>Loading...</AppText>

	const aspectRatio = 2 / 3
	const imageHeight = height * 0.4
	const imageWidth = imageHeight * aspectRatio

	return (
		<View className='w-screen h-full justify-end bg-black'>
			<HomeBackground background={selectedElement?.backgroundImage || ''} />
			<View
				className='transition-all duration-300 ease-in-out'
				style={{ paddingLeft: sidebarOpen ? height * 0.3 : height * 0.08 }}
			>
				<View className='h-[52dvh] justify-end px-10 bg-transparent'>
					{selectedElement ? (
						<>
							{selectedElement.logoImage &&
							selectedElement.logoImage !== '' ? (
								<AlignedImage
									className='pb-10'
									height={215}
									imageUrl={selectedElement.logoImage}
								/>
							) : (
								<Title>{selectedElement.title}</Title>
							)}

							{selectedElement.subtitle && (
								<Subtitle>{selectedElement.subtitle}</Subtitle>
							)}

							<View className='flex-row gap-2 pb-3'>
								{selectedElement.seasonNumber &&
									selectedElement.episodeNumber && (
										<Secondary>
											S{selectedElement.seasonNumber}E
											{selectedElement.episodeNumber}
										</Secondary>
									)}

								<Secondary>{selectedElement.date}</Secondary>
								<Secondary>
									{(
										selectedElement.duration -
										selectedElement.timeWatched
									).toFixed(0)}{' '}
									minutes remaining
								</Secondary>
							</View>

							<Secondary className='pb-5'>
								{selectedElement.genres
									? selectedElement.genres.join(', ')
									: ''}
							</Secondary>

							<View className='h-[10dvh] max-h-[10dvh] w-[50dvw] max-w-[100dvh]'>
								<Secondary className='line-clamp-3'>
									{selectedElement.overview}
								</Secondary>
							</View>
						</>
					) : (
						<>
							<Title>Nope</Title>
						</>
					)}
				</View>

				<View className='h-[48dvh] justify-center'>
					<ListTitle className='text-2xl px-10 font-bold'>
						Continue Watching
					</ListTitle>

					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							gap: 15,
							paddingHorizontal: 40,
						}}
						className='items-center h-full flex-grow-0'
						scrollEnabled={true}
						data={continueWatching}
						renderItem={({ item: element, index }) => (
							<TouchableOpacity
								onFocus={() => setSelectedElement(element)}
								focusable
								style={{ outline: 'none' }}
								className={`w-fit h-fit transition-all duration-150 ease-in-out border-4 border-transparent rounded-xl ${selectedElement === element ? ' border-white scale-105' : ''} `}
								hasTVPreferredFocus={index === 0}
							>
								<Image
									source={{ uri: element.posterImage }}
									resizeMode='cover'
									style={{
										width: imageWidth,
										height: imageHeight,
										borderRadius: 10,
										overflow: 'hidden',
									}}
								/>
							</TouchableOpacity>
						)}
					></FlatList>
				</View>
			</View>
		</View>
	)
}

export default ContinueWatchingContent
