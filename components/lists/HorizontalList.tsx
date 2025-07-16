import React from 'react'
import {
	FlatList,
	ListRenderItem,
	StyleProp,
	View,
	ViewStyle,
} from 'react-native'
import Secondary from '../text/Secondary'
import Animated from 'react-native-reanimated'
import Subtitle from '../text/Subtitle'

interface HorizontalListProps<T> {
	title?: string
	items: T[]
	renderItem: ListRenderItem<T>
	keyExtractor?: (item: T, index: number) => string
	style?: StyleProp<ViewStyle>
	contentContainerStyle?: StyleProp<ViewStyle>
	ListEmptyComponent?: React.ReactElement | null
	[key: string]: any
}

function HorizontalList<T>({
	title,
	items,
	renderItem,
	keyExtractor,
	style,
	contentContainerStyle,
	ListEmptyComponent,
	...rest
}: HorizontalListProps<T>) {
	const AnimatedFlatList = Animated.createAnimatedComponent(
		FlatList as new () => FlatList<T>
	)

	return (
		<View style={style} className='gap-5'>
			{title && <Subtitle className='font-semibold'>{title}</Subtitle>}
			<AnimatedFlatList
				horizontal
				showsHorizontalScrollIndicator={false}
				data={items}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				contentContainerStyle={contentContainerStyle || { gap: 15 }}
				ListEmptyComponent={ListEmptyComponent}
				{...rest}
			/>
		</View>
	)
}

export default HorizontalList
