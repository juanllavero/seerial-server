import { Dimensions, useWindowDimensions } from 'react-native'
import AppText from '@/components/text/AppText'
import { useLocalSearchParams } from 'expo-router'
import { CollectionImages, LibraryItem } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import LibraryItemCard from '@/components/cards/LibraryItemCard'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { SpatialNavigationVirtualizedGrid } from 'react-tv-space-navigation'
import { scaledPixels } from '@/hooks/useScale'
import { Page } from '@/components/Page'
import AnimatedTabContentView from '@/components/AnimatedTabContentView'

const NUMBER_OF_COLUMNS = 6
const INFINITE_SCROLL_ROW_THRESHOLD = 2

function LibrariesScreen() {
	const { id, serverIP, type } = useLocalSearchParams()
	const { height } = Dimensions.get('screen')

	const { data: libraryContent, isLoading } = useSWR<LibraryItem[]>(
		serverIP
			? `${serverIP}/library-content-flat?libraryId=${id}&type=${type}`
			: null,
		fetcher
	)

	const itemWidth = scaledPixels(137)
	const itemHeight = useMemo(
		() => (type === LibraryTypes.MUSIC ? itemWidth * 1.3 : itemWidth * 2),
		[type, itemWidth]
	)

	const renderLibraryItem = useCallback(
		({ item }: { item: LibraryItem }) => (
			<LibraryItemCard
				id={item.data.id}
				key={item.data.id}
				type={type as string}
				title={item.data.title}
				isCollection={item.type === 'collection'}
				subtitle={
					item.type === 'collection'
						? `${item.data.numberOfItems} items`
						: (item.data.year ?? '')
				}
				collectionImages={
					item.type === 'collection' ? item.data.images : undefined
				}
				imgSrc={
					type === LibraryTypes.MUSIC
						? (item.data.musicPosterSrc ?? '')
						: (item.data.posterSrc ?? '')
				}
				width={itemWidth}
				aspectRatio={type === LibraryTypes.MUSIC ? 1 : 1.5}
			/>
		),
		[type, itemWidth]
	)

	if (isLoading && libraryContent && libraryContent.length === 0) {
		return <AppText>Loading...</AppText>
	}

	if (!isLoading && !libraryContent)
		return <AppText>Library not found</AppText>

	console.log({ libraryContent })

	return (
		<Page>
			<AnimatedTabContentView>
				<SpatialNavigationVirtualizedGrid
					data={libraryContent ?? []}
					renderItem={renderLibraryItem}
					itemHeight={itemHeight}
					numberOfColumns={NUMBER_OF_COLUMNS}
					onEndReachedThresholdRowsNumber={INFINITE_SCROLL_ROW_THRESHOLD}
					scrollInterval={150}
					scrollBehavior='jump-on-scroll'
					scrollDuration={200}
					style={{
						padding: scaledPixels(25),
						height: height,
						paddingLeft: 0,
					}}
					rowContainerStyle={{
						gap: scaledPixels(10),
					}}
				/>
			</AnimatedTabContentView>
		</Page>
	)
}

export default memo(LibrariesScreen)
