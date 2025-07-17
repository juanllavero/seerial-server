import { FlatList, View, useWindowDimensions, StyleSheet } from 'react-native'
import AppText from '@/components/text/AppText'
import { useLocalSearchParams } from 'expo-router'
import { LibraryItem } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import LibraryItemCard from '@/components/cards/LibraryItemCard'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { useEffect, useState } from 'react'
import useDataStore from '@/context/data.context'
import { shallow } from 'zustand/shallow'

const NUM_COLUMNS = 7
const ITEM_SPACING = 30

export default function LibrariesScreen() {
	const { id, serverIP, type } = useLocalSearchParams()
	const { width: screenWidth, height } = useWindowDimensions()

	const { data: content, isLoading } = useSWR<LibraryItem[]>(
		serverIP
			? `${serverIP}/library-content-flat?libraryId=${id}&type=${type}`
			: null,
		fetcher
	)

	const containerPadding = height * 0.08
	const availableWidth = screenWidth - containerPadding * 2
	const totalWidthPerColumn = availableWidth / NUM_COLUMNS
	const itemWidth = totalWidthPerColumn - ITEM_SPACING

	if (isLoading) return <AppText>Loading...</AppText>

	if (!content) return <AppText>Library not found</AppText>

	return (
		<View
			className='flex-1 bg-black transition-all duration-300 ease-in-out'
			style={{ paddingLeft: height * 0.08 }}
		>
			<FlatList
				data={content}
				numColumns={NUM_COLUMNS}
				className='p-5'
				showsHorizontalScrollIndicator={false}
				keyExtractor={(item) => item.data.id.toString()}
				contentContainerStyle={{ paddingHorizontal: ITEM_SPACING / 2 }}
				renderItem={({ item }) => (
					<View style={{ margin: ITEM_SPACING / 2 }}>
						<LibraryItemCard
							id={item.data.id}
							type={type as string}
							title={item.data.title}
							isCollection={item.type === 'collection'}
							subtitle={
								item.type === 'collection'
									? `${item.data.numberOfItems} items`
									: (item.data.year ?? '')
							}
							imgSrc={
								item.data.posterSrc ?? item.data.musicPosterSrc ?? ''
							}
							width={itemWidth}
							aspectRatio={type === LibraryTypes.MUSIC ? 1 : 1.5}
						/>
					</View>
				)}
			/>
		</View>
	)
}
