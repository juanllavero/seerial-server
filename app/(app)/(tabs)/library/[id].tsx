import { Dimensions } from 'react-native'
import AppText from '@/components/text/AppText'
import { useLocalSearchParams } from 'expo-router'
import { LibraryItem } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { memo, useCallback, useMemo } from 'react'
import { SpatialNavigationVirtualizedGrid } from 'react-tv-space-navigation'
import { scaledPixels } from '@/hooks/useScale'
import { Page } from '@/components/Page'
import AnimatedTabContentView from '@/components/AnimatedTabContentView'
import FocusableLibraryItem from '@/components/cards/FocusableLibraryItem'

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
		() => (type === LibraryTypes.MUSIC ? itemWidth * 1.4 : itemWidth * 2),
		[type, itemWidth]
	)

	const renderLibraryItem = useCallback(
		({ item }: { item: LibraryItem }) => (
			<FocusableLibraryItem
				item={item}
				type={type as string}
				itemWidth={itemWidth}
			/>
		),
		[type, itemWidth]
	)

	if (isLoading && libraryContent && libraryContent.length === 0) {
		return <AppText>Loading...</AppText>
	}

	if (!isLoading && !libraryContent)
		return <AppText>Library not found</AppText>

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
