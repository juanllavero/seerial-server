import AppText from '@/components/text/AppText'
import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { LRCFile, LRCLine } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, ScrollView, View } from 'react-native'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import LyricLine from './LyricLine'

const parseLrc = (content: string): LRCLine[] => {
	const lines = content.split(/\r\n?|\n/)
	const lrcLines: LRCLine[] = []
	lines.forEach((line) => {
		const trimmedLine = line.trim()
		if (!trimmedLine) return
		const metadataMatch = trimmedLine.match(/^\[([a-zA-Z]+):(.*)\]$/)
		if (metadataMatch) {
			return
		}
		const timeMatch = trimmedLine.match(
			/\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/
		)
		if (timeMatch) {
			const minutes = parseInt(timeMatch[1])
			const seconds = parseInt(timeMatch[2])
			const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'))
			const time = minutes * 60 + seconds + milliseconds / 1000
			const text = timeMatch[4].trim()
			lrcLines.push({ time, text: text || '♪', originalLine: line })
		}
	})
	return lrcLines.sort((a, b) => a.time - b.time)
}

interface LineLayout {
	y: number
	height: number
}

function LRCVisualizer() {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { currentSong, currentTime } = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			currentTime: state.currentTime,
		}),
		shallow
	)
	const [selectedLRCFile, setSelectedLRCFile] = useState<LRCFile | null>(null)
	const [lines, setLines] = useState<LRCLine[]>([])
	const [currentLineIndex, setCurrentLineIndex] = useState(0)
	const scrollViewRef = useRef<ScrollView>(null)
	const lineLayouts = useRef(new Map<number, LineLayout>())
	const [scrollViewHeight, setScrollViewHeight] = useState(0)

	const { data: lyrics, isLoading } = useSWR<LRCFile[]>(
		serverUrl && currentSong
			? `${serverUrl}/lyrics?id=${currentSong.id}`
			: null,
		fetcher
	)

	useEffect(() => {
		if (lyrics && lyrics.length > 0) setSelectedLRCFile(lyrics[0])
	}, [lyrics])

	useEffect(() => {
		if (selectedLRCFile) {
			setLines(parseLrc(selectedLRCFile.content))
		}
	}, [selectedLRCFile])

	useEffect(() => {
		const newCurrentIndex = lines.findIndex(
			(line, index) =>
				currentTime >= line.time &&
				(index === lines.length - 1 || currentTime < lines[index + 1].time)
		)
		if (newCurrentIndex !== -1) {
			setCurrentLineIndex(newCurrentIndex)
		}
	}, [currentTime, lines])

	useEffect(() => {
		if (
			!scrollViewRef.current ||
			lines.length === 0 ||
			scrollViewHeight === 0
		) {
			return
		}
		const lineLayout = lineLayouts.current.get(currentLineIndex)
		if (!lineLayout) return

		const targetScrollY =
			lineLayout.y - scrollViewHeight / 2 + lineLayout.height / 2

		scrollViewRef.current.scrollTo({
			y: Math.max(0, targetScrollY),
			animated: true,
		})
	}, [currentLineIndex, scrollViewHeight, lines.length])

	const handleScrollViewLayout = useCallback((event: LayoutChangeEvent) => {
		setScrollViewHeight(event.nativeEvent.layout.height)
	}, [])

	const createLineLayoutHandler = useCallback((index: number) => {
		return (event: LayoutChangeEvent) => {
			const { y, height } = event.nativeEvent.layout
			lineLayouts.current.set(index, { y, height })
		}
	}, [])

	if (isLoading) return <AppText>Loading...</AppText>

	if (!lyrics || lyrics.length === 0) return null

	return (
		<View className='p-x-[0.5rem] @container flex h-full flex-col gap-1 rounded-lg'>
			<ScrollView
				ref={scrollViewRef}
				showsHorizontalScrollIndicator={false}
				onLayout={handleScrollViewLayout}
				className='w-full flex-grow overflow-x-hidden overflow-y-auto'
				scrollEventThrottle={16}
			>
				<View className='space-y-10 px-6 py-8'>
					{lyrics && lyrics.length > 0 ? (
						lines.map((line, index) => (
							<LyricLine
								key={index}
								lineText={line.text}
								isCurrent={index === currentLineIndex}
								isPast={index < currentLineIndex}
								onLayout={createLineLayoutHandler(index)}
							/>
						))
					) : (
						<View className='flex h-full min-h-[300px] w-full items-center justify-center'>
							<AppText>{'No Lyrics Found'}</AppText>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	)
}

export default memo(LRCVisualizer)
