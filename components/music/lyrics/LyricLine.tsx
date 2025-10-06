import Title from '@/components/text/Title'
import React, { memo } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

interface LyricLineProps {
	lineText: string
	isCurrent: boolean
	isPast: boolean
	onLayout: (event: LayoutChangeEvent) => void
}

const LyricLine = ({
	lineText,
	isCurrent,
	isPast,
	onLayout,
}: LyricLineProps) => {
	return (
		<View onLayout={onLayout} className='rounded-lg px-4 py-2 text-center'>
			<Title
				className={`cursor-pointer font-black transition-all duration-300 ease-out`}
				style={{
					color: isCurrent ? 'white' : 'black',
					opacity: isCurrent ? 1 : isPast ? 0 : 0.5,
				}}
			>
				{lineText}
			</Title>
		</View>
	)
}

export default memo(LyricLine)
