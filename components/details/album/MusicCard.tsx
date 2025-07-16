import MusicWave from '@/components/music/MusicWave'
import Secondary from '@/components/text/Secondary'
import useMusicStore from '@/context/music.context'
import { Song } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/utils'
import React from 'react'
import { Pressable, View } from 'react-native'
import { shallow } from 'zustand/shallow'

interface MusicCardProps {
	song: Song
	index: number
	handlePlaySong: () => void
}

function MusicCard({ song, index, handlePlaySong }: MusicCardProps) {
	const { isPlaying, currentSong } = useMusicStore(
		(state) => ({
			isPlaying: state.isPlaying,
			currentSong: state.currentSong,
		}),
		shallow
	)
	return (
		<Pressable
			className='p-10 bg-neutral-700 flex-row rounded-md justify-between'
			onPress={handlePlaySong}
		>
			<View className='flex-row items-center justify-start gap-5'>
				<View className='w-10 justify-center items-center'>
					{isPlaying && song.id === currentSong?.id ? (
						<MusicWave />
					) : (
						<Secondary>{index + 1}</Secondary>
					)}
				</View>
				<Secondary className='line-clamp-1 ellipsis max-w-[25dvw]'>
					{song.title}
				</Secondary>
				<MusicWave />
			</View>

			<View>
				<Secondary>{formatTime(song.duration ?? 0 / 60)}</Secondary>
			</View>
		</Pressable>
	)
}

export default MusicCard
