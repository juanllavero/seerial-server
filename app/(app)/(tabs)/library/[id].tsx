import { useWindowDimensions } from 'react-native'
import AppText from '@/components/text/AppText'
import { useLocalSearchParams } from 'expo-router'
import { LibraryItem } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import LibraryItemCard from '@/components/cards/LibraryItemCard'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { SpatialNavigationVirtualizedGrid } from 'react-tv-space-navigation'
import { scaledPixels } from '@/hooks/useScale'
import { Page } from '@/components/Page'
import AnimatedTabContentView from '@/components/AnimatedTabContentView'

const NUM_COLUMNS = 6
const ITEM_SPACING = 15

function LibrariesScreen() {
	const { id, serverIP, type } = useLocalSearchParams()
	const { width: screenWidth, height } = useWindowDimensions()

	const { data: content, isLoading } = useSWR<LibraryItem[]>(
		serverIP
			? `${serverIP}/library-content-flat?libraryId=${id}&type=${type}`
			: null,
		fetcher
	)

	const itemWidth = useMemo(() => {
		const containerPadding = height * 0.08
		const availableWidth = screenWidth - containerPadding
		const totalWidthPerColumn = availableWidth / NUM_COLUMNS
		return totalWidthPerColumn - ITEM_SPACING
	}, [screenWidth, height])
	const itemHeight = useMemo(
		() =>
			scaledPixels(
				type === LibraryTypes.MUSIC ? itemWidth * 1.3 : itemWidth * 2
			),
		[]
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
				imgSrc={item.data.posterSrc ?? item.data.musicPosterSrc ?? ''}
				width={itemWidth}
				aspectRatio={type === LibraryTypes.MUSIC ? 1 : 1.5}
			/>
		),
		[type, itemWidth]
	)

	if (!isLoading && !content) return <AppText>Library not found</AppText>

	return (
		<Page>
			<AnimatedTabContentView>
				<SpatialNavigationVirtualizedGrid
					data={content ?? []}
					renderItem={renderLibraryItem}
					itemHeight={itemHeight}
					nbMaxOfItems={12}
					rowContainerStyle={{
						gap: ITEM_SPACING,
						marginBottom: 20,
					}}
					numberOfColumns={NUM_COLUMNS}
				/>
			</AnimatedTabContentView>
		</Page>
	)
}

export default memo(LibrariesScreen)
