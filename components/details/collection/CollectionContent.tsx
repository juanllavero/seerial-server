import LibraryItemCard from '@/components/cards/LibraryItemCard'
import HorizontalList from '@/components/lists/HorizontalList'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { Collection, Movie, Series } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { ContentType, CollectionKey } from '@/types/types'
import { getOnlyYear } from '@/utils/utils'
import React from 'react'
import { Dimensions, View } from 'react-native'
import ExtrasList from '../extras/ExtrasList'

interface CollectionContentProps {
	collection: Collection
	type: string
}

function CollectionContent({ collection, type }: CollectionContentProps) {
	const { height } = Dimensions.get('window')

	// Set order of content
	const orderMap: Record<ContentType, CollectionKey[]> = {
		Music: ['albums', 'movies', 'shows'],
		Shows: ['shows', 'movies', 'albums'],
		Movies: ['movies', 'shows', 'albums'],
	}

	// Render content by type
	const renderMap: Record<CollectionKey, (items: any[]) => React.ReactNode> = {
		albums: (items: Album[]) => (
			<HorizontalList<Album>
				key={'Albums List'}
				title={'Albums'}
				items={items}
				renderItem={({ item }) => (
					<LibraryItemCard
						type={LibraryTypes.MUSIC}
						id={item.id}
						title={item.title}
						subtitle={String(getOnlyYear(item.year ?? ''))}
						imgSrc={item.coverSrc ?? ''}
						width={height * 0.3}
						selectedItem={null}
						setSelectedItem={function (
							value: React.SetStateAction<string | null>
						): void {}}
					/>
				)}
			/>
		),
		movies: (items: Movie[]) => (
			<HorizontalList<Movie>
				key={'Movies List'}
				title={'Movies'}
				items={items}
				renderItem={({ item }) => (
					<LibraryItemCard
						type={LibraryTypes.MOVIES}
						id={item.id}
						title={item.name}
						subtitle={String(getOnlyYear(item.year ?? ''))}
						imgSrc={item.coverSrc ?? ''}
						width={height * 0.3}
						selectedItem={null}
						setSelectedItem={function (
							value: React.SetStateAction<string | null>
						): void {}}
					/>
				)}
			/>
		),
		shows: (items: Series[]) => (
			<HorizontalList<Series>
				key={'Shows List'}
				title={'Shows'}
				items={items}
				renderItem={({ item }) => (
					<LibraryItemCard
						type={LibraryTypes.SHOWS}
						id={item.id}
						title={item.name}
						subtitle={String(getOnlyYear(item.year ?? ''))}
						imgSrc={item.coverSrc ?? ''}
						width={height * 0.3}
						selectedItem={null}
						setSelectedItem={function (
							value: React.SetStateAction<string | null>
						): void {}}
					/>
				)}
			/>
		),
	}
	return (
		<View className='gap-5'>
			{orderMap &&
				orderMap[type as ContentType].map((key) => {
					const items = collection[key]
					return items.length > 0 ? renderMap[key](items) : null
				})}

			<ExtrasList collection={collection} />
		</View>
	)
}

export default CollectionContent
