import { useAuth } from '@/context/auth.context'
import { useServerStore } from '@/context/server.context'
import { ContinueWatchingElement } from '@/data/interfaces/Lists'
import { fetcher } from '@/utils/utils'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, View } from 'react-native'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import AppText from '../text/AppText'
import Secondary from '../text/Secondary'
import Subtitle from '../text/Subtitle'
import Title from '../text/Title'
import AlignedImage from '../images/AlignedImage'
import HomeBackground from '../backgrounds/HomeBackground'
import OptimizedImage from '../images/OptimizedImage'
import {
	SpatialNavigationFocusableView,
	SpatialNavigationNode,
} from 'react-tv-space-navigation'
import HorizontalList from '../lists/HorizontalList'
import { scaledPixels } from '@/hooks/useScale'
import AnimatedTabContentView from '../AnimatedTabContentView'

function ContinueWatchingContent() {
	const user = useAuth((state) => state.user)
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
		useState<ContinueWatchingElement | null>(null)

	const { data: continueWatching, isLoading } = useSWR<
		ContinueWatchingElement[]
	>(selectedServer ? `${serverUrl}/continueWatching` : null, fetcher)

	useEffect(() => {
		if (user && user.servers.length > 0) {
			selectServer(user.servers[0])
		}
	}, [user, selectServer])

	const aspectRatio = 2 / 3
	const imageHeight = height * 0.33
	const imageWidth = imageHeight * aspectRatio

	const renderItem = useCallback(
		({
			item: element,
			index,
		}: {
			item: ContinueWatchingElement
			index: number
		}) => (
			<SpatialNavigationNode key={element.id}>
				<SpatialNavigationFocusableView
					onFocus={() => {
						setSelectedElement(element)
					}}
					onSelect={() => {}}
				>
					{({ isFocused }) => (
						<View
							style={{
								outline: 'none',

								transform: isFocused
									? [{ scale: 1.05 }]
									: [{ scale: 1 }],
							}}
							className={`w-fit h-fit border-transparent rounded-lg border-2 ${
								isFocused ? 'border-white' : ''
							}`}
						>
							<OptimizedImage
								source={
									element.posterImage && element.posterImage !== ''
										? { uri: element.posterImage }
										: require('@/assets/images/default/movie.jpg')
								}
								style={{
									width: imageWidth,
									height: imageHeight,
									borderRadius: 5,
									overflow: 'hidden',
								}}
							/>
						</View>
					)}
				</SpatialNavigationFocusableView>
			</SpatialNavigationNode>
		),
		[selectedElement, imageHeight, imageWidth]
	)

	if (isLoading) return <AppText>Loading...</AppText>

	return (
		<View className='w-screen h-full justify-end bg-black' focusable={true}>
			<HomeBackground background={selectedElement?.backgroundImage || ''} />
			<AnimatedTabContentView>
				<View className='justify-end pr-64 bg-transparent'>
					{selectedElement ? (
						<>
							{selectedElement.logoImage &&
							selectedElement.logoImage !== '' ? (
								<AlignedImage
									className='pb-5'
									height={height * 0.17}
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

				{continueWatching && continueWatching.length > 0 ? (
					<HorizontalList<ContinueWatchingElement>
						itemSize={scaledPixels(2200)}
						title={'Continue Watching'}
						items={continueWatching}
						renderItem={renderItem}
						style={{ height: height * 0.45 }}
					/>
				) : null}
			</AnimatedTabContentView>
		</View>
	)
}

export default memo(ContinueWatchingContent)
