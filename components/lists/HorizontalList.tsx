import React, { JSX, memo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import {
	SpatialNavigationNode,
	SpatialNavigationVirtualizedList,
} from 'react-tv-space-navigation'
import ListTitle from '../text/ListTitle'
import { scaledPixels } from '@/hooks/useScale'
import AppText from '../text/AppText'

interface HorizontalListProps<T> {
	title?: string
	items: T[]
	itemSize?: number
	renderItem: (args: { item: T; index: number }) => JSX.Element
	style?: StyleProp<ViewStyle>
	contentContainerStyle?: StyleProp<ViewStyle>
	ListEmptyComponent?: React.ReactElement | null
	[key: string]: any
}

function HorizontalList<T>({
	title,
	items,
	itemSize = 250,
	renderItem,
	style,
	contentContainerStyle,
	ListEmptyComponent,
	...rest
}: HorizontalListProps<T>) {
	return (
		<View style={style} className='gap-5'>
			{title && <ListTitle>{title}</ListTitle>}
			{items.length > 0 ? (
				<SpatialNavigationNode>
					<SpatialNavigationVirtualizedList
						itemSize={scaledPixels(itemSize)}
						orientation='horizontal'
						style={{
							gap: 10,
						}}
						scrollBehavior='jump-on-scroll'
						data={items}
						renderItem={renderItem}
						{...rest}
					/>
				</SpatialNavigationNode>
			) : (
				<AppText>No items</AppText>
			)}
		</View>
	)
}

export default memo(HorizontalList) as <T>(
	props: HorizontalListProps<T>
) => React.ReactElement
