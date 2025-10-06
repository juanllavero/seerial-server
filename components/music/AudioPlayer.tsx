import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import React, { useRef, useEffect, memo, useCallback } from 'react'
import Video, { VideoRef } from 'react-native-video'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'

const AudioPlayer = () => {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const playerRef = useRef<VideoRef>(null)

	const {
		currentSong,
		isPlaying,
		volume,
		setAlbum,
		setPlayerRef,
		handleOnLoad,
		handleOnProgress,
		handleOnEnd,
	} = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			isPlaying: state.isPlaying,
			volume: state.volume,
			setAlbum: state.setAlbum,
			setPlayerRef: state.setPlayerRef,
			handleOnLoad: state.handleOnLoad,
			handleOnProgress: state.handleOnProgress,
			handleOnEnd: state.handleOnEnd,
		}),
		shallow
	)

	// Get Album details
	const { data: album } = useSWR<Album>(
		currentSong && currentSong.albumId && serverUrl !== ''
			? `${serverUrl}/details/album?id=${currentSong.albumId}`
			: null,
		fetcher
	)

	useEffect(() => {
		if (album && serverUrl !== '') {
			setAlbum(album)
		}
	}, [album, serverUrl])

	useEffect(() => {
		setPlayerRef(playerRef)
	}, [setPlayerRef])

	const handleError = useCallback((error: any) => {
		console.log(error)
	}, [])

	if (!currentSong) {
		return null
	}

	return (
		<Video
			ref={playerRef}
			source={{
				uri: `${serverUrl}/audio-stream?path=${currentSong.fileSrc}&isWeb=false`,
			}}
			paused={!isPlaying}
			volume={volume}
			style={{
				position: 'absolute',
				top: '-100%',
				display: 'none',
			}}
			playInBackground={true}
			onLoad={handleOnLoad}
			onProgress={handleOnProgress}
			onEnd={handleOnEnd}
			onError={handleError}
		/>
	)
}

export default memo(AudioPlayer)
