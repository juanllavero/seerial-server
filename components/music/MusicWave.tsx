import useMusicStore from '@/context/music.context'
import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'

interface MusicWaveProps {
	width?: number
	color?: string
}

const MusicWave = ({ width = 4, color = '#FFFFFF' }: MusicWaveProps) => {
	const isPlaying = useMusicStore((state) => state.isPlaying)

	const barAnimations = useRef(
		[0, 1, 2, 3].map(() => new Animated.Value(0.2))
	).current

	const delays = [0.3, 0.8, 0.5, 0.1]

	useEffect(() => {
		if (isPlaying) {
			barAnimations.forEach((anim, index) => {
				setTimeout(() => {
					Animated.loop(
						Animated.sequence([
							Animated.timing(anim, {
								toValue: 1,
								duration: 400,
								easing: Easing.inOut(Easing.ease),
								useNativeDriver: false,
							}),
							Animated.timing(anim, {
								toValue: 0,
								duration: 400,
								easing: Easing.inOut(Easing.ease),
								useNativeDriver: false,
							}),
						])
					).start()
				}, delays[index] * 1000)
			})
		} else {
			barAnimations.forEach((anim) => {
				anim.stopAnimation()
				Animated.timing(anim, {
					toValue: 0.2,
					duration: 200,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: false,
				}).start()
			})
		}

		return () => {
			barAnimations.forEach((anim) => anim.stopAnimation())
		}
	}, [isPlaying, barAnimations])

	return (
		<View className='flex-row  items-end justify-center space-x-0.5'>
			{barAnimations.map((anim, index) => {
				const height = anim.interpolate({
					inputRange: [0, 0.2, 1],
					outputRange: [3, 5, 22],
				})

				return (
					<Animated.View
						key={index}
						style={{
							height: height,
							width: width,
							backgroundColor: color,
						}}
					/>
				)
			})}
		</View>
	)
}

export default memo(MusicWave)
