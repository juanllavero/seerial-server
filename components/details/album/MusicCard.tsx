import MusicWave from '@/components/music/MusicWave'
import Secondary from '@/components/text/Secondary'
import useMusicStore from '@/context/music.context'
import { Song } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/utils'
import React, { memo, useCallback } from 'react'
import { Pressable, View } from 'react-native'
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

	const handleFocus = useCallback(() => setFocused(true), [])
	const handleBlur = useCallback(() => setFocused(false), [])

	return (
		<Pressable
			onFocus={handleFocus}
			onBlur={handleBlur}
			style={{
				backgroundColor: focused ? 'white' : 'transparent',
				outline: 'none',
				transform: focused ? [{ scale: 1.03 }] : [{ scale: 1 }],
			}}
			className={`p-7 flex-row rounded-lg justify-between`}
			onPress={handlePlaySong}
		>
			<View className='flex-row items-center justify-start gap-5'>
				<View className='w-8 justify-center items-center'>
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
		</Pressable>
	)
}

export default memo(MusicCard)
