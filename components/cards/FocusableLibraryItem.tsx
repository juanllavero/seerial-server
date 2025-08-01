import React, { memo, useCallback } from 'react'
import { router } from 'expo-router'
import { SpatialNavigationFocusableView } from 'react-tv-space-navigation'
import useDataStore from '@/context/data.context'
import { LibraryItem } from '@/data/interfaces/Media'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import LibraryItemCard from './LibraryItemCard'

interface FocusableLibraryItemProps {
	item: LibraryItem
	type: string
	itemWidth: number
	updateBackgroundOnFocus?: boolean
}

function FocusableLibraryItem({
	item,
	type,
	itemWidth,
	updateBackgroundOnFocus = true,
}: FocusableLibraryItemProps) {
	const setCurrentBackground = useDataStore(
		(state) => state.setCurrentBackground
	)

	const { id, title, year, images, musicPosterSrc, posterSrc, numberOfItems } =
		item.data
	const isCollection = item.type === 'collection'
	const finalImgSrc =
		type === LibraryTypes.MUSIC ? (musicPosterSrc ?? '') : (posterSrc ?? '')
	const subtitle = isCollection ? `${numberOfItems} items` : (year ?? '')
	const aspectRatio = type === LibraryTypes.MUSIC ? 1 : 1.5

	const handlePress = useCallback(() => {
		router.push({
			pathname: `/details/[id]`,
			params: { id, type, isCollection: String(isCollection) },
		})
	}, [id, type, isCollection])

	const handleFocus = useCallback(() => {
		if (updateBackgroundOnFocus && finalImgSrc) {
			setCurrentBackground(finalImgSrc)
		}
	}, [updateBackgroundOnFocus, finalImgSrc, setCurrentBackground])

	return (
		<SpatialNavigationFocusableView
			onSelect={handlePress}
			onFocus={handleFocus}
		>
			{({ isFocused }) => (
				<LibraryItemCard
					isFocused={isFocused}
					type={type}
					title={title}
					subtitle={subtitle}
					isCollection={isCollection}
					collectionImages={isCollection ? images : undefined}
					imgSrc={finalImgSrc}
					width={itemWidth}
					aspectRatio={aspectRatio}
				/>
			)}
		</SpatialNavigationFocusableView>
	)
}

export default memo(FocusableLibraryItem)
