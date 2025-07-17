import { useServerStore } from '@/context/server.context'
import { getImageUrl } from '@/utils/utils'
import React, { memo, useState, useEffect, useRef } from 'react'
import { Dimensions, View, Animated } from 'react-native'
import ColorGradient from './ColorGradient'

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

			const timeout = setTimeout(() => {
				setUrl(getImageUrl(serverUrl, background))
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

	const [imageLoaded, setImageLoaded] = useState(false)

	const opacityAnim = useRef(new Animated.Value(0)).current

	useEffect(() => {
		if (imageLoaded) {
			Animated.timing(opacityAnim, {
				toValue: 0.8,
				duration: 500,
				useNativeDriver: true,
			}).start()
		}
	}, [imageLoaded, opacityAnim])

	return (
		<View className='absolute top-0 w-screen flex-row h-screen items-start justify-end'>
			<ColorGradient showGradient imageSrc={url} />

			<Animated.Image
				source={{ uri: processedImageUrl }}
				resizeMode='cover'
				onLoad={() => setImageLoaded(true)}
				style={{
					width: imageWidth,
					height: imageHeight,
					opacity: opacityAnim,
				}}
			/>
		</View>
	)
}

export default memo(HomeBackground)
