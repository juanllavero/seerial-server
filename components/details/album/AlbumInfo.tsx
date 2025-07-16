import EditIcon from '@/components/svg/EditIcon'
import HorizontalDotsIcon from '@/components/svg/HorizontalDotsIcon'
import PauseIcon from '@/components/svg/player/controls/PauseIcon'
import PlayIcon from '@/components/svg/player/controls/PlayIcon'
import DolbyAtmosIcon from '@/components/svg/player/DolbyAtmosIcon'
import SmallSpinner from '@/components/svg/SmallSpinner'
import AppText from '@/components/text/AppText'
import Secondary from '@/components/text/Secondary'
import Subtitle from '@/components/text/Subtitle'
import Title from '@/components/text/Title'
import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { Album, Song } from '@/data/interfaces/Music'
import { getImageUrl } from '@/utils/utils'
import React from 'react'
import { Dimensions, Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { shallow } from 'zustand/shallow'

interface AlbumInfoProps {
	album: Album | null
	isLoading: boolean
}

function AlbumInfo({ album, isLoading }: AlbumInfoProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { height } = Dimensions.get('window')
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
		<View className='items-center gap-5 justify-center'>
			<Animated.Image
				source={{ uri: getImageUrl(serverUrl, album.coverSrc ?? '') }}
				style={{
					width: height * 0.4,
					height: height * 0.4,
					borderRadius: 10,
				}}
			/>

			<Title>{album.title}</Title>
			<Secondary>
				{album.year ? new Date(album.year).getFullYear() : null}
				{album.genres ? ' • ' + album.genres.join(', ') : ''}
			</Secondary>
			<Secondary>
				{album.songs.length} {'songs'}
				{' • '}
				{getTotalDuration(album.songs) || '0'}
				{` ${'min'}`}
			</Secondary>

			{hasDolbyAtmos() && (
				<DolbyAtmosIcon
					size={25}
					color='lightgray'
					className='w-18 shadow-2xl'
				/>
			)}

			<View className='flex-row justify-center gap-10'>
				<Pressable
					className='rounded-full'
					onPress={() => {
						// if (album) {
						// 	openAlbumDialog(album)
						// }
					}}
				>
					<EditIcon color='#ffffff' size={30} />
				</Pressable>
				<Pressable
					className='h-15 rounded-full'
					onPress={() => {
						if (isShown) {
							togglePlayPause()
						} else if (album && album.songs && album.songs.length > 0) {
							selectSong(album.songs[0])
						}
					}}
				>
					{loadingSong ? (
						<SmallSpinner size={60} />
					) : isPlaying ? (
						<PauseIcon color='#ffffff' size={60} />
					) : (
						<PlayIcon color='#ffffff' size={60} />
					)}
				</Pressable>
				<Pressable
					className='rounded-full'
					// onPress={(e) => {
					//   dispatch(toggleSeasonMenu())
					//   if (!seasonMenuOpen) cm.current?.show(e)
					// }}
				>
					<HorizontalDotsIcon color='#ffffff' size={40} />
				</Pressable>
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
