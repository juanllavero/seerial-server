import MusicWave from '@/components/music/MusicWave'
import Secondary from '@/components/text/Secondary'
import { Song } from '@/data/interfaces/Music'
import React from 'react'
import { View } from 'react-native'

interface MusicCardProps {
	song: Song
	index: number
	handlePlaySong: () => void
}

function MusicCard({ song, index, handlePlaySong }: MusicCardProps) {
	return (
		<View>
			<View>
				<Secondary>
					{index + 1}. {song.title}
				</Secondary>
				<MusicWave />
			</View>
		</View>
	)
}

export default MusicCard
