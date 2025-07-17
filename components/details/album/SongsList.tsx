import { Album, Song } from '@/data/interfaces/Music'
import useMusicStore from '@/context/music.context'
import { shallow } from 'zustand/shallow'
import { FlatList, View } from 'react-native'
import Secondary from '@/components/text/Secondary'
import MusicCard from './MusicCard'
import Subtitle from '@/components/text/Subtitle'
import Animated from 'react-native-reanimated'

interface SongsListProps {
	album: Album
}

function SongsList({ album }: SongsListProps) {
	const {
		currentSong,
		selectSong,
		setSongQueue,
		togglePlayPause,
		setIsShown,
		setIsExpanded,
	} = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			selectSong: state.selectSong,
			setSongQueue: state.initializeQueue,
			togglePlayPause: state.togglePlayPause,
			setIsShown: state.setIsShown,
			setIsExpanded: state.setIsExpanded,
		}),
		shallow
	)

	const hasDiscs = album.songs.some((song) => song.discNumber > 0)

	// Show all songs if there are no discs
	if (!hasDiscs) {
		return (
			<View className='gap-5'>
				<Animated.FlatList
					data={album.songs}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						gap: 8,
						paddingHorizontal: 20,
						paddingVertical: 10,
					}}
					renderItem={({ item, index }) => (
						<MusicCard
							key={item.id}
							index={index}
							song={item}
							handlePlaySong={() => {
								if (currentSong && currentSong.id === item.id) {
									setIsExpanded(true)
								} else {
									selectSong(item)
									setIsShown(true)
									setIsExpanded(true)
									setSongQueue(album.songs)
								}
							}}
						/>
					)}
				/>
			</View>
		)
	}

	const groupedByDisc = album.songs.reduce(
		(acc: { [key: number]: Song[] }, song) => {
			const discNumber = song.discNumber || 0 // Ensure discNumber is 0 if null/undefined
			if (!acc[discNumber]) {
				acc[discNumber] = []
			}
			acc[discNumber].push(song)
			return acc
		},
		{}
	)

	// Convert the grouped object into an array sorted by disc number, with disc 0 at the end
	const discEntries = Object.entries(groupedByDisc).sort(
		([discA], [discB]) => {
			const numA = Number(discA)
			const numB = Number(discB)
			if (numA === 0) return 1 // Move disc 0 to the end
			if (numB === 0) return -1 // Keep other discs before disc 0
			return numA - numB // Sort other discs numerically
		}
	)

	// Create a flat list for playback (it will respect the new order)
	const flatList = discEntries.flatMap(([, songs]) => songs)

	return (
		<>
			{discEntries.map(([discNumber, songs]) => (
				<View key={discNumber} className='gap-5'>
					<Subtitle className='font-bold'>
						{/* Change title for disc 0 to 'extras' */}
						{Number(discNumber) === 0
							? 'Extras'
							: `${'Disc'} ${discNumber}`}
					</Subtitle>
					<Animated.FlatList
						data={songs}
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							gap: 8,
							paddingHorizontal: 20,
							paddingVertical: 10,
						}}
						renderItem={({ item, index }) => (
							<MusicCard
								key={item.id}
								index={index}
								song={item}
								handlePlaySong={() => {
									if (currentSong && currentSong.id === item.id) {
										setIsExpanded(true)
									} else {
										selectSong(item)
										setIsShown(true)
										setIsExpanded(true)
										setSongQueue(flatList)
									}
								}}
							/>
						)}
					/>
				</View>
			))}
		</>
	)
}

export default SongsList
