import { useServerStore } from '@/context/server.context'
import { getImageUrl } from '@/utils/utils'
import React, { memo, useState, useEffect } from 'react'
import { Dimensions, View } from 'react-native'
import ColorGradient from './ColorGradient'
import OptimizedImage from '../images/OptimizedImage'

interface HomeBackgroundProps {
	background: string
}

function HomeBackground({ background }: HomeBackgroundProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { width } = Dimensions.get('window')
	const [url, setUrl] = useState('')
	const [processedImageUrl, setProcessedImageUrl] = useState('')

	useEffect(() => {
		if (background) {
			setProcessedImageUrl('')
			setUrl(getImageUrl(serverUrl, background))

			const timeout = setTimeout(() => {
				setProcessedImageUrl(
					`${serverUrl}/transparent-image-effect?${background.startsWith('http') ? `url=${encodeURIComponent(background)}` : `localPath=${background}`}&width=${imageWidth}&height=${imageHeight}`
				)
			}, 500)

			return () => clearTimeout(timeout)
		} else {
			setUrl('')
			setProcessedImageUrl('')
		}
	}, [background])

	const imageWidth = width * 0.55
	const imageHeight = (9 / 16) * imageWidth

	return (
		<View className='absolute top-0 w-screen flex-row h-screen items-start justify-end'>
			{/* <ColorGradient showGradient imageSrc={url} /> */}

			{processedImageUrl && processedImageUrl !== '' && (
				<OptimizedImage
					source={
						processedImageUrl && processedImageUrl !== ''
							? { uri: processedImageUrl }
							: undefined
					}
					resizeMode='cover'
					style={{
						width: imageWidth,
						height: imageHeight,
					}}
				/>
			)}
		</View>
	)
}

export default memo(HomeBackground)
