import MusicWave from '@/components/music/MusicWave'
import Secondary from '@/components/text/Secondary'
import useMusicStore from '@/context/music.context'
import { Song } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/utils'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { shallow } from 'zustand/shallow'

interface MusicCardProps {
	song: Song
	index: number
	handlePlaySong: () => void
}

function MusicCard({ song, index, handlePlaySong }: MusicCardProps) {
	const [focused, setFocused] = React.useState(false)
	const { isPlaying, currentSong } = useMusicStore(
		(state) => ({
			isPlaying: state.isPlaying,
			currentSong: state.currentSong,
		}),
		shallow
	)
	return (
		<TouchableOpacity
			focusable
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			style={{
				backgroundColor: focused ? 'white' : '',
				outline: 'none',
				transform: focused ? 'scale(1.03)' : 'scale(1)',
			}}
			className={`p-7 bg-neutral-500/30 flex-row rounded-lg justify-between`}
			onPress={handlePlaySong}
		>
			<View className='flex-row items-center justify-start gap-5'>
				<View className='w-10 justify-center items-center'>
					{isPlaying && song.id === currentSong?.id ? (
						<MusicWave />
					) : (
						<Secondary style={{ color: focused ? 'black' : 'white' }}>
							{index + 1}
						</Secondary>
					)}
				</View>
				<Secondary
					className='line-clamp-1 ellipsis max-w-[25dvw]'
					style={{ color: focused ? 'black' : 'white' }}
				>
					{song.title}
				</Secondary>
			</View>

			<View>
				<Secondary style={{ color: focused ? 'black' : 'white' }}>
					{formatTime(song.duration ?? 0 / 60)}
				</Secondary>
			</View>
		</TouchableOpacity>
	)
}

export default MusicCard
