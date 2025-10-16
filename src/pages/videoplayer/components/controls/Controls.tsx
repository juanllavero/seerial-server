import { memo, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import FlexBox from '@/components/ui/FlexBox'
import TimelineSlider from './TimelineSlider'
import TracksSelectors from './TracksSelectors'
import VolumeSlider from './VolumeSlider'
import { authenticatedFetcher } from '@/lib/auth'
import useSWR from 'swr'
import { useServerStore } from '@/context/server.context'
import { Video, VideoInfo } from '@/data/interfaces/Media'
import { shallow } from 'zustand/shallow'
import VideoInfoComponent from '../VideoInfo'
import NavigationButton from '@/components/navigation/NavigationButton'
import Settings from '../Settings'
import { SettingsIcon } from 'lucide-react'

interface ControlsProps {
	video: Video
	runtime?: number
	mutateVideo: () => void
}

function Controls({ video, runtime, mutateVideo }: ControlsProps) {
	const { user, serverUrl } = useServerStore(
		(state) => ({
			user: state.currentUser,
			serverUrl: state.serverUrl,
		}),
		shallow
	)
	const [duration, setDuration] = useState(runtime ? runtime * 60 : 0)
	const [position, setPosition] = useState(0)

	// Get video info
	const { data: videoInfo } = useSWR<VideoInfo>(
		video.id && serverUrl !== ''
			? `${serverUrl}/api/videoInfo?id=${video.id}`
			: null,
		authenticatedFetcher
	)

	const watchedList = video?.watchLists?.find(
		(list: any) => list.userId === user?.id
	)

	const timeWatched = watchedList?.timeWatched ?? 0

	const [streamStartTime, setStreamStartTime] = useState(timeWatched ?? 0)

	// Controls
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const [showControls, setShowControls] = useState(false)

	const handleMouseMove = () => {
		setShowControls(true)

		// Clear previous timeout if exists
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		// Create new timeout to hide controls after 2 seconds
		timeoutRef.current = setTimeout(() => {
			if (!showControls) setShowControls(false)
		}, 2000)
	}

	useEffect(() => {
		if (!video) return

		initializePosition()
		setStreamStartTime(timeWatched && timeWatched > 0 ? timeWatched : 0)
	}, [video.id])

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === ' ') {
				e.preventDefault()
				handlePlayPause()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const initializePosition = async () => {
		let attempts = 0
		const maxAttempts = 10
		const retryInterval = 500 // 500ms

		const tryGetDuration = async (): Promise<number> => {
			while (attempts < maxAttempts) {
				try {
					const dur = await invoke<number>('get_duration')
					if (typeof dur === 'number') {
						return dur
					}
				} catch (error) {
					console.warn(
						`Attempt ${attempts + 1} failed to get duration:`,
						error
					)
				}
				attempts++
				await new Promise((resolve) => setTimeout(resolve, retryInterval))
			}
			return 0 // Fallback if no valid number after max attempts
		}

		const dur = await tryGetDuration()
		console.log('Video duration from MPV:', dur)
		setDuration(dur > 0 ? dur : video?.runtime ? video.runtime * 60 || 0 : 0)
		setPosition(streamStartTime ?? 0)
	}

	const handlePlayPause = async () => {
		invoke('toggle_play_pause').catch(console.error)
	}

	return (
		<FlexBox
			direction='column'
			gap={1.5}
			width={'90%'}
			padding='0 0 3rem 0'
			className='max-w-[170dvh]'
		>
			<FlexBox justify='space-between' gap={2} align='end' width={'100%'}>
				<VideoInfoComponent videoInfo={videoInfo} duration={duration} />
				<FlexBox align='center' justify='end' gap={0.5}>
					<NavigationButton transparent className='p-2'>
						<SettingsIcon />
					</NavigationButton>
					<TracksSelectors
						video={video}
						videoInfo={videoInfo}
						mutateVideo={mutateVideo}
					/>

					<FlexBox>
						<VolumeSlider />
					</FlexBox>
				</FlexBox>
			</FlexBox>
			<FlexBox
				direction='column'
				width={'100%'}
				justify='center'
				align='center'
				gap={1}
			>
				<TimelineSlider
					duration={duration}
					setDuration={setDuration}
					position={position}
					setPosition={setPosition}
				/>
			</FlexBox>
		</FlexBox>
	)
}

export default memo(Controls)
