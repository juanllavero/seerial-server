import AppText from '@/components/text/AppText'
import Subtitle from '@/components/text/Subtitle'
import Title from '@/components/text/Title'
import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { LRCFile, LRCLine } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import { useState, useEffect, useRef, memo } from 'react'
import { ScrollView, View, LayoutChangeEvent } from 'react-native' // Importa LayoutChangeEvent
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'

// Interfaz para el layout de cada línea
interface LineLayout {
	y: number
	height: number
}

const LRCVisualizer = () => {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { currentSong, currentTime, seekTo } = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			currentTime: state.currentTime,
			seekTo: state.seekTo,
		}),
		shallow
	)
	const [selectedLRCFile, setSelectedLRCFile] = useState<LRCFile | null>(null)
	const [lines, setLines] = useState<LRCLine[]>([])
	const [currentLineIndex, setCurrentLineIndex] = useState(0)

	// ---- CAMBIOS PRINCIPALES ----

	// 1. Ref para el ScrollView de React Native
	const scrollViewRef = useRef<ScrollView>(null)

	// 2. Ref para guardar las medidas (layout) de cada línea sin causar re-renders
	const lineLayouts = useRef(new Map<number, LineLayout>())

	// 3. Estado para guardar la altura del ScrollView
	const [scrollViewHeight, setScrollViewHeight] = useState(0)

	// ----------------------------

	const { data: lyrics, isLoading } = useSWR<LRCFile[]>(
		serverUrl !== '' && currentSong
			? `${serverUrl}/lyrics?id=${currentSong.id}`
			: null,
		fetcher
	)

	useEffect(() => {
		if (lyrics && lyrics.length > 0) setSelectedLRCFile(lyrics[0])
	}, [lyrics])

	useEffect(() => {
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

		if (selectedLRCFile) {
			setLines(parseLrc(selectedLRCFile.content))
		}
	}, [selectedLRCFile])

	useEffect(() => {
		let newCurrentIndex = 0
		for (let i = lines.length - 1; i >= 0; i--) {
			if (currentTime >= lines[i].time) {
				newCurrentIndex = i
				break
			}
		}
		setCurrentLineIndex(newCurrentIndex)
	}, [currentTime, lines])

	// ---- NUEVO useEffect PARA EL SCROLL ----
	useEffect(() => {
		// Asegurarnos de que tenemos todo lo necesario
		if (
			!scrollViewRef.current ||
			lines.length === 0 ||
			scrollViewHeight === 0
		) {
			return
		}

		// Obtener el layout de la línea actual del Map
		const lineLayout = lineLayouts.current.get(currentLineIndex)
		if (!lineLayout) return

		// La misma lógica de cálculo que tenías, pero con las variables correctas
		const targetScrollY =
			lineLayout.y - scrollViewHeight / 2 + lineLayout.height / 2

		// Usamos el método `scrollTo` del ScrollView de React Native
		scrollViewRef.current.scrollTo({
			y: Math.max(0, targetScrollY), // Aseguramos que no sea un valor negativo
			animated: true,
		})
	}, [currentLineIndex, lines, scrollViewHeight]) // Depende del índice y la altura del contenedor

	const getLineOpacity = (index: number) => {
		if (index === currentLineIndex) return 'opacity-100'
		if (index < currentLineIndex) return 'opacity-0'
		return 'opacity-50'
	}
	const getLineScale = (index: number) =>
		index === currentLineIndex ? 'scale-100' : 'scale-100'
	const getLineBlur = (index: number) => {
		return index === currentLineIndex ? '' : 'blur-[2px]'
	}

	if (isLoading) return <AppText>Loading...</AppText>

	return (
		<View className='p-x-[0.5rem] @container flex h-full bg-black flex-col gap-1 rounded-lg'>
			{/* ---- COMPONENTE SCROLLVIEW MODIFICADO ---- */}
			<ScrollView
				ref={scrollViewRef}
				showsHorizontalScrollIndicator={false}
				onLayout={(event: LayoutChangeEvent) => {
					// 4. Guardamos la altura del ScrollView cuando se renderiza
					setScrollViewHeight(event.nativeEvent.layout.height)
				}}
				className='no-scrollbar w-full flex-grow overflow-x-hidden overflow-y-auto'
				scrollEventThrottle={16} // Buena práctica para eventos de scroll
			>
				<View className='space-y-10 px-6 py-8'>
					{lyrics && lyrics.length > 0 ? (
						lines.map((line, index) => {
							const isCurrentLine = index === currentLineIndex
							const lineClasses = isCurrentLine
								? 'text-white'
								: 'text-gray-400'
							return (
								<View
									key={index}
									// 5. Medimos cada línea y guardamos su layout
									onLayout={(event: LayoutChangeEvent) => {
										const layout = event.nativeEvent.layout
										lineLayouts.current.set(index, {
											y: layout.y,
											height: layout.height,
										})
									}}
									className='rounded-lg px-4 py-2 text-center'
								>
									<Title
										className={`cursor-pointer font-black transition-all duration-300 ease-out ${getLineOpacity(index)} ${getLineScale(index)} ${getLineBlur(
											index
										)} ${lineClasses} hover:text-white hover:opacity-100`}
									>
										{line.text}
									</Title>
								</View>
							)
						})
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
