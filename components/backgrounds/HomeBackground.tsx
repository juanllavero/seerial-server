import { useServerStore } from '@/context/server.context'
import { isAbsolutePath } from '@/utils/utils'
import React, { memo } from 'react'
import { Dimensions, ImageBackground, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import ColorGradient from './ColorGradient'

interface HomeBackgroundProps {
	background: string
}

function HomeBackground({ background }: HomeBackgroundProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { width } = Dimensions.get('window')

	const url = background
		? background.startsWith('http')
			? background
			: background.startsWith('local')
				? background.replace('local', '')
				: isAbsolutePath(background)
					? `${serverUrl}/image?path=${encodeURIComponent(background)}`
					: `${serverUrl}/${background.replace('resources/img', 'img')}`
		: ''

	const imageWidth = width * 0.55
	const imageHeight = (9 / 16) * imageWidth

	// El color que usaremos para el desvanecido (debe ser el color de fondo de tu app)
	const FADE_COLOR = 'black'

	return (
		<View className='absolute top-0 w-screen flex-row h-screen items-start justify-end'>
			{/* <ColorGradient imageUrl={url} /> */}
			<ImageBackground
				source={{ uri: url }}
				resizeMode='cover'
				style={{
					width: imageWidth,
					height: imageHeight,
				}}
			>
				<View style={StyleSheet.absoluteFill}>
					<LinearGradient
						colors={[FADE_COLOR, 'transparent']}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 0.6, y: 0.5 }} // Vanish from left to right (60% of the width)
						style={StyleSheet.absoluteFill}
					/>
					<LinearGradient
						colors={['transparent', FADE_COLOR]}
						start={{ x: 0.5, y: 0.4 }} // Vanish from top to bottom (40% of the height)
						end={{ x: 0.5, y: 1 }}
						style={StyleSheet.absoluteFill}
					/>
				</View>
			</ImageBackground>
		</View>
	)
}

export default memo(HomeBackground)
