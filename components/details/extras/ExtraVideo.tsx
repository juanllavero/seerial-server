import Tertiary from '@/components/text/Tertiary'
import React, { useState } from 'react'
import { Dimensions, TouchableOpacity, View } from 'react-native'
import VideoThumbnail from './VideoThumbnail'
import { MusicExtra } from '@/data/interfaces/Music'
import { useServerStore } from '@/context/server.context'

interface ExtrasListProps {
	item: MusicExtra
}

function ExtraVideo({ item }: ExtrasListProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { height } = Dimensions.get('window')
	const [isFocused, setIsFocused] = useState(false)

	const getExtraTypeTranslation = (type: string) => {
		switch (type) {
			case 'lyrics':
				return 'Lyrics Video'
			case 'video':
				return 'Music Video'
			case 'behindTheScenes':
				return 'Behind the scenes'
			case 'live':
				return 'Live'
			case 'interview':
				return 'Interview'
			case 'concert':
				return 'Concert'
			default:
				return ''
		}
	}

	return (
		<TouchableOpacity
			focusable
			style={{
				width: height * 0.2 * 1.7,
				outline: 'none',
				transform: isFocused ? 'scale(1.05)' : 'scale(1)',
			}}
			className='space-y-2'
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
		>
			<VideoThumbnail
				height={height * 0.2}
				style={{
					borderColor: isFocused ? 'white' : 'transparent',
				}}
				videoUrl={`${serverUrl}/video-file?path=${item.src}`}
			/>
			<View className='flex flex-col'>
				<Tertiary className='line-clamp-1 ellipsis'>{item.title}</Tertiary>
				<Tertiary className='text-xl sm:text-md md:text-lg lg:text-xl'>
					{getExtraTypeTranslation(item.type)}
				</Tertiary>
			</View>
		</TouchableOpacity>
	)
}

export default ExtraVideo
