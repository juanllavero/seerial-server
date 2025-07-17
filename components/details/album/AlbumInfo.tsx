import Button from '@/components/buttons/Button'
import EditIcon from '@/components/svg/EditIcon'
import HorizontalDotsIcon from '@/components/svg/HorizontalDotsIcon'
import PauseIcon from '@/components/svg/player/controls/PauseIcon'
import PlayIcon from '@/components/svg/player/controls/PlayIcon'
import DolbyAtmosIcon from '@/components/svg/player/DolbyAtmosIcon'
import SmallSpinner from '@/components/svg/SmallSpinner'
import AppText from '@/components/text/AppText'
import Secondary from '@/components/text/Secondary'
import Tertiary from '@/components/text/Tertiary'
import Title from '@/components/text/Title'
import useMusicStore from '@/context/music.context'
import { Album, Song } from '@/data/interfaces/Music'
import { Ellipsis, Shuffle, ShuffleIcon } from 'lucide-react-native'
import React from 'react'
import { Pressable, TouchableOpacity, View } from 'react-native'
import { shallow } from 'zustand/shallow'

interface AlbumInfoProps {
	album: Album | null
	isLoading: boolean
}

function AlbumInfo({ album, isLoading }: AlbumInfoProps) {
	const {
		isPlaying,
		isLoaidng: loadingSong,
		isShown,
		togglePlayPause,
		selectSong,
	} = useMusicStore(
		(state) => ({
			isPlaying: state.isPlaying,
			isLoaidng: state.isLoading,
			isShown: state.isShown,
			togglePlayPause: state.togglePlayPause,
			selectSong: state.selectSong,
		}),
		shallow
	)

	const getTotalDuration = (songs: Song[]) => {
		return songs.reduce((acc, song) => acc + song.duration / 60, 0).toFixed(0)
	}

	const hasDolbyAtmos = () => {
		return album?.songs.some((song) => song.hasDolbyAtmos)
	}

	if (!album) return null

	return (
		<View className='items-start gap-5 justify-center'>
			<Title>{album.title}</Title>
			<View className='flex-row items-center justify-center'>
				<Secondary>
					{album.year ? new Date(album.year).getFullYear() : null}
					{album.genres ? ' • ' + album.genres.join(', ') : ''}
				</Secondary>

				{hasDolbyAtmos() && (
					<>
						<Secondary> • </Secondary>
						<DolbyAtmosIcon
							size={25}
							color='lightgray'
							className='w-18 shadow-2xl translate-y-1 pl-2'
						/>
					</>
				)}
			</View>
			<Secondary>
				{album.songs.length} {'songs'}
				{' • '}
				{getTotalDuration(album.songs) || '0'}
				{` ${'min'}`}
			</Secondary>

			{album.description && album.description !== '' && (
				<TouchableOpacity focusable={true}>
					<Secondary className='line-clamp-3'>
						{album.description}
					</Secondary>
				</TouchableOpacity>
			)}

			<View className='flex-row justify-center pt-5 gap-10'>
				<Button
					text={isPlaying ? 'Pause' : 'Play'}
					icon={
						loadingSong ? SmallSpinner : isPlaying ? PauseIcon : PlayIcon
					}
					onPress={() => {
						if (isShown) {
							togglePlayPause()
						} else if (album && album.songs && album.songs.length > 0) {
							selectSong(album.songs[0])
						}
					}}
				/>
				<Button
					text={'Shuffle'}
					icon={ShuffleIcon}
					onPress={() => {
						if (isShown) {
							togglePlayPause()
						} else if (album && album.songs && album.songs.length > 0) {
							selectSong(album.songs[0])
						}
					}}
				/>
				<Button icon={Ellipsis} iconSize={40} onPress={() => {}} />
			</View>
			<View>
				<span className='font-semibold'>
					{isLoading || !album ? (
						<AppText>Loading...</AppText>
					) : (
						album.description || ''
					)}
				</span>
			</View>
		</View>
	)
}

export default AlbumInfo
