import HorizontalList from '@/components/lists/HorizontalList'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { Collection, LibraryItem, Movie, Series } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { CollectionKey, ContentType } from '@/types/types'
import { getOnlyYear } from '@/utils/utils'
import React, { memo, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import ExtrasList from '../extras/ExtrasList'
import { scaledPixels } from '@/hooks/useScale'
import FocusableLibraryItem from '@/components/cards/FocusableLibraryItem'

interface CollectionContentProps {
	collection: Collection
	type: string
}

const orderMap: Record<ContentType, CollectionKey[]> = {
	Music: ['albums', 'movies', 'shows'],
	Shows: ['shows', 'movies', 'albums'],
	Movies: ['movies', 'shows', 'albums'],
}

function CollectionContent({ collection, type }: CollectionContentProps) {
	const itemWidth = scaledPixels(130)

	const renderAlbumItem = useCallback(
		({ item }: { item: Album }) => {
			const libraryItem: LibraryItem = {
				type: 'item',
				order: 0,
				data: {
					id: item.id,
					title: item.title,
					year: String(getOnlyYear(item.year ?? '')),
					musicPosterSrc: item.coverSrc ?? '',
				},
			}
			return (
				<FocusableLibraryItem
					item={libraryItem}
					type={LibraryTypes.MUSIC}
					itemWidth={itemWidth}
					updateBackgroundOnFocus={false}
				/>
			)
		},
		[itemWidth]
	)

	const renderMovieItem = useCallback(
		({ item }: { item: Movie }) => {
			const libraryItem: LibraryItem = {
				type: 'item',
				order: 0,
				data: {
					id: item.id,
					title: item.name,
					year: String(getOnlyYear(item.year ?? '')),
					posterSrc: item.coverSrc ?? '',
				},
			}
			return (
				<FocusableLibraryItem
					item={libraryItem}
					type={LibraryTypes.MOVIES}
					itemWidth={itemWidth}
					updateBackgroundOnFocus={false}
				/>
			)
		},
		[itemWidth]
	)

	const renderShowItem = useCallback(
		({ item }: { item: Series }) => {
			const libraryItem: LibraryItem = {
				type: 'item',
				order: 0,
				data: {
					id: item.id,
					title: item.name,
					year: String(getOnlyYear(item.year ?? '')),
					posterSrc: item.coverSrc ?? '',
				},
			}
			return (
				<FocusableLibraryItem
					item={libraryItem}
					type={LibraryTypes.SHOWS}
					itemWidth={itemWidth}
					updateBackgroundOnFocus={false}
				/>
			)
		},
		[itemWidth]
	)

	const renderMap = useMemo(
		() => ({
			albums: (items: Album[]) => (
				<HorizontalList<Album>
					key={'Albums List'}
					title={'Albums'}
					items={items}
					itemSize={itemWidth + 15}
					renderItem={renderAlbumItem}
				/>
			),
			movies: (items: Movie[]) => (
				<HorizontalList<Movie>
					key={'Movies List'}
					title={'Movies'}
					items={items}
					itemSize={itemWidth + 15}
					renderItem={renderMovieItem}
				/>
			),
			shows: (items: Series[]) => (
				<HorizontalList<Series>
					key={'Shows List'}
					title={'Shows'}
					items={items}
					itemSize={itemWidth + 15}
					renderItem={renderShowItem}
				/>
			),
		}),
		[renderAlbumItem, renderMovieItem, renderShowItem, itemWidth]
	)

	return (
		<View className='gap-5'>
			{orderMap[type as ContentType]?.map((key) => {
				if (key === 'albums' && collection.albums?.length > 0) {
					return renderMap.albums(collection.albums)
				}
				if (key === 'movies' && collection.movies?.length > 0) {
					return renderMap.movies(collection.movies)
				}
				if (key === 'shows' && collection.shows?.length > 0) {
					return renderMap.shows(collection.shows)
				}
				return null
			})}
			<ExtrasList collection={collection} />
		</View>
	)
}

export default memo(CollectionContent)
