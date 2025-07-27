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
	const getOpacity = () => {
		if (isCurrent) return 'opacity-100'
		if (isPast) return 'opacity-0'
		return 'opacity-50'
	}

	const getBlur = () => (isCurrent ? '' : 'blur-[2px]')
	const getColor = () => (isCurrent ? 'text-white' : 'text-gray-400')

	return (
		<View onLayout={onLayout} className='rounded-lg px-4 py-2 text-center'>
			<Title
				className={`cursor-pointer font-black transition-all duration-300 ease-out ${getOpacity()} ${getBlur()} ${getColor()} hover:text-white hover:opacity-100`}
			>
				{lineText}
			</Title>
		</View>
	)
}

export default memo(LyricLine)
