import { useServerStore } from '@/context/server.context'
import { getImageUrl } from '@/utils/utils'
import React, { memo, useState, useEffect } from 'react'
import { Dimensions, View } from 'react-native'
import ColorGradient from './ColorGradient'
import { AnimatedImage } from '../images/AnimatedImage'

interface HomeBackgroundProps {
	background: string
}

function HomeBackground({ background }: HomeBackgroundProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { width } = Dimensions.get('window')
	const [url, setUrl] = useState('')
	const [processedImageUrl, setProcessedImageUrl] = useState('')

	const imageWidth = width * 0.65
	const imageHeight = (9 / 16) * imageWidth

	useEffect(() => {
		if (background) {
			const originalUrl = getImageUrl(serverUrl, background)
			setUrl(originalUrl)

			const processedUrl = `${serverUrl}/transparent-image-effect?${
				background.startsWith('http')
					? `url=${encodeURIComponent(background)}`
					: `localPath=${background}`
			}&width=${Math.round(imageWidth * 2)}&height=${Math.round(imageHeight * 2)}`
			setProcessedImageUrl(processedUrl)
		} else {
			setUrl('')
			setProcessedImageUrl('')
		}
	}, [background, serverUrl, imageWidth, imageHeight])

	return (
		<View className='absolute top-0 w-screen flex-row h-screen items-start justify-end'>
			<ColorGradient showGradient imageSrc={url} />

			<AnimatedImage
				uri={processedImageUrl}
				resizeMode='cover'
				toValue={0.7}
				style={{
					width: imageWidth,
					height: imageHeight,
				}}
			/>
		</View>
	)
}

export default memo(HomeBackground)
