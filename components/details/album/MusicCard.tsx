import AnimatedCard from '@/components/cards/AnimatedCard'
import MusicWave from '@/components/music/MusicWave'
import Secondary from '@/components/text/Secondary'
import { greyButtonColor, greyButtonColorTransparent } from '@/constants/Colors'
import useMusicStore from '@/context/music.context'
import { Song } from '@/data/interfaces/Music'
import { scaledPixels } from '@/hooks/useScale'
import { formatTime } from '@/utils/utils'
import React, { memo, useCallback } from 'react'
import { Pressable, View } from 'react-native'
import {
	SpatialNavigationNode,
	SpatialNavigationFocusableView,
} from 'react-tv-space-navigation'
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
		<SpatialNavigationNode>
			<SpatialNavigationFocusableView onSelect={handlePlaySong}>
				{({ isFocused }) => (
					<AnimatedCard isFocused={isFocused} width={scaledPixels(480)}>
						<View
							style={{
								backgroundColor: isFocused
									? 'white'
									: greyButtonColorTransparent,
								outline: 'none',
								borderRadius: 5,
							}}
							className={`p-7 pl-5 w-full flex-row  justify-between`}
						>
							<View className='flex-row items-center justify-start gap-5'>
								<View className='w-8 justify-center items-center'>
									{isPlaying && song.id === currentSong?.id ? (
										<MusicWave />
									) : (
										<Secondary
											style={{
												color: isFocused ? 'black' : 'white',
											}}
										>
											{index + 1}
										</Secondary>
									)}
								</View>
								<Secondary
									className='line-clamp-1 ellipsis max-w-[25dvw]'
									style={{ color: isFocused ? 'black' : 'white' }}
								>
									{song.title}
								</Secondary>
							</View>

							<View>
								<Secondary
									style={{ color: isFocused ? 'black' : 'white' }}
								>
									{formatTime(song.duration ?? 0 / 60)}
								</Secondary>
							</View>
						</View>
					</AnimatedCard>
				)}
			</SpatialNavigationFocusableView>
		</SpatialNavigationNode>
	)
}

export default memo(MusicCard)
