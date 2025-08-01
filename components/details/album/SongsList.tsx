import { Album, Song } from '@/data/interfaces/Music'
import useMusicStore from '@/context/music.context'
import { shallow } from 'zustand/shallow'
import { View } from 'react-native'
import MusicCard from './MusicCard'
import Subtitle from '@/components/text/Subtitle'
import { memo, useMemo } from 'react'

interface SongsListProps {
	album: Album
}

const SongsList = memo(function SongsList({ album }: SongsListProps) {
	const { currentSong, selectSong, setSongQueue, setIsShown, setIsExpanded } =
		useMusicStore(
			(state) => ({
				currentSong: state.currentSong,
				selectSong: state.selectSong,
				setSongQueue: state.initializeQueue,
				setIsShown: state.setIsShown,
				setIsExpanded: state.setIsExpanded,
			}),
			shallow
		)

	const { hasDiscs, discEntries, flatListForQueue } = useMemo(() => {
		const localHasDiscs = album.songs.some((song) => song.discNumber > 0)

		if (!localHasDiscs) {
			return {
				hasDiscs: false,
				discEntries: [],
				flatListForQueue: album.songs,
			}
		}

		const groupedByDisc = album.songs.reduce(
			(acc: { [key: number]: Song[] }, song) => {
				const discNumber = song.discNumber || 0
				if (!acc[discNumber]) acc[discNumber] = []
				acc[discNumber].push(song)
				return acc
			},
			{}
		)

		const localDiscEntries = Object.entries(groupedByDisc).sort(
			([a], [b]) => {
				const numA = Number(a)
				const numB = Number(b)
				if (numA === 0) return 1
				if (numB === 0) return -1
				return numA - numB
			}
		)

		const localFlatList = localDiscEntries.flatMap(([, songs]) => songs)

		return {
			hasDiscs: true,
			discEntries: localDiscEntries,
			flatListForQueue: localFlatList,
		}
	}, [album.songs])

	if (!hasDiscs) {
		return (
			<View className='gap-5'>
				{album.songs.map((song, index) => {
					const handlePlaySong = () => {
						if (currentSong?.id === song.id) {
							setIsExpanded(true)
						} else {
							selectSong(song)
							setIsShown(true)
							setIsExpanded(true)
							setSongQueue(flatListForQueue)
						}
					}
					return (
						<MusicCard
							key={song.id}
							index={index}
							song={song}
							handlePlaySong={handlePlaySong}
						/>
					)
				})}
			</View>
		)
	}

	return (
		<>
			{discEntries.map(([discNumber, songs]) => (
				<View key={discNumber} className='gap-5 mb-10'>
					<Subtitle className='font-bold'>
						{Number(discNumber) === 0 ? 'Extras' : `Disc ${discNumber}`}
					</Subtitle>
					{songs.map((song, index) => {
						const handlePlaySong = () => {
							if (currentSong?.id === song.id) {
								setIsExpanded(true)
							} else {
								selectSong(song)
								setIsShown(true)
								setIsExpanded(true)
								setSongQueue(flatListForQueue)
							}
						}
						return (
							<MusicCard
								key={song.id}
								index={index}
								song={song}
								handlePlaySong={handlePlaySong}
							/>
						)
					})}
				</View>
			))}
		</>
	)
})

export default SongsList
