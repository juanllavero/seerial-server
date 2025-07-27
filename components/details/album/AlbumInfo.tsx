import Button from '@/components/buttons/Button'
import PauseIcon from '@/components/svg/player/controls/PauseIcon'
import PlayIcon from '@/components/svg/player/controls/PlayIcon'
import DolbyAtmosIcon from '@/components/svg/player/DolbyAtmosIcon'
import SmallSpinner from '@/components/svg/SmallSpinner'
import AppText from '@/components/text/AppText'
import Secondary from '@/components/text/Secondary'
import Title from '@/components/text/Title'
import useMusicStore from '@/context/music.context'
import { Album } from '@/data/interfaces/Music'
import { Ellipsis, ShuffleIcon } from 'lucide-react-native'
import React, { memo, useCallback, useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { shallow } from 'zustand/shallow'

interface AlbumInfoProps {
	album: Album | null
	isLoading: boolean
}

const AlbumInfo = memo(function AlbumInfo({
	album,
	isLoading,
}: AlbumInfoProps) {
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

	const totalDuration = useMemo(() => {
		if (!album?.songs) return '0'
		return album.songs
			.reduce((acc, song) => acc + song.duration / 60, 0)
			.toFixed(0)
	}, [album?.songs])

	const dolbyAtmosAvailable = useMemo(
		() => album?.songs.some((song) => song.hasDolbyAtmos),
		[album?.songs]
	)

	const handlePlayPause = useCallback(() => {
		if (isShown) {
			togglePlayPause()
		} else if (album?.songs?.length) {
			selectSong(album.songs[0])
		}
	}, [isShown, togglePlayPause, selectSong, album?.songs])

	const handleShuffle = useCallback(() => {
		if (isShown) {
			togglePlayPause()
		} else if (album?.songs?.length) {
			selectSong(album.songs[0])
		}
	}, [isShown, togglePlayPause, selectSong, album?.songs])

	const handleMoreOptions = useCallback(() => {}, [])

	if (!album) return null

	return (
		<View className='items-start gap-5 justify-center'>
			<Title>{album.title}</Title>
			<View className='flex-row items-center justify-center'>
				<Secondary>
					{album.year ? new Date(album.year).getFullYear() : null}
					{album.genres ? ' • ' + album.genres.join(', ') : ''}
					{dolbyAtmosAvailable ? ' • ' : ''}
				</Secondary>

				{dolbyAtmosAvailable && (
					<DolbyAtmosIcon
						size={25}
						color='lightgray'
						className='w-18 shadow-2xl translate-y-1 pl-2'
					/>
				)}
			</View>
			<Secondary>
				{album.songs.length} {'songs'}
				{' • '}
				{totalDuration}
				{` ${'min'}`}
			</Secondary>

			{album.description && (
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
					onPress={handlePlayPause}
				/>
				<Button
					text={'Shuffle'}
					icon={ShuffleIcon}
					onPress={handleShuffle}
				/>
				<Button icon={Ellipsis} iconSize={40} onPress={handleMoreOptions} />
			</View>
			<View>
				<AppText className='font-semibold'>
					{isLoading || !album ? 'Loading...' : album.description || ''}
				</AppText>
			</View>
		</View>
	)
})

export default AlbumInfo
