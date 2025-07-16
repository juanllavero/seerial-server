import { Album, Song } from '@/data/interfaces/Music'
import useMusicStore from '@/context/music.context'
import { shallow } from 'zustand/shallow'
import { View } from 'react-native'
import Secondary from '@/components/text/Secondary'
import MusicCard from './MusicCard'
import Subtitle from '@/components/text/Subtitle'

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
	} = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			selectSong: state.selectSong,
			setSongQueue: state.setSongQueue,
			togglePlayPause: state.togglePlayPause,
			setIsShown: state.setIsShown,
		}),
		shallow
	)

	const hasDiscs = album.songs.some((song) => song.discNumber > 0)

	// Show all songs if there are no discs
	if (!hasDiscs) {
		return (
			<View className='gap-5'>
				<Subtitle className='font-bold'>{'Tracks'}</Subtitle>
				{album.songs.map((song, index) => (
					<MusicCard
						index={index}
						song={song}
						handlePlaySong={() => {
							if (currentSong === song) {
								togglePlayPause()
							} else {
								selectSong(song)
								setIsShown(true)
								setSongQueue(album.songs)
							}
						}}
					/>
				))}
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
					{songs.map((song, index) => (
						<MusicCard
							key={song.id}
							index={index}
							song={song}
							handlePlaySong={() => {
								if (currentSong === song) {
									togglePlayPause()
								} else {
									selectSong(song)
									setIsShown(true)
									setSongQueue(flatList) // Use the correctly ordered flatList
								}
							}}
						/>
					))}
				</View>
			))}
		</>
	)
}

export default SongsList
