import FlexBox from '@/components/ui/FlexBox'
import { formatTime } from '@/utils/utils'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useRef, useState } from 'react'
import SeekIndicator from './SeekIndicator'

interface TimelineSliderProps {
	position: number
	setPosition: (pos: number) => void
	duration: number
	setDuration: (dur: number) => void
}

function TimelineSlider({
	position,
	setPosition,
	duration,
	setDuration,
}: TimelineSliderProps) {
	const seeking = useRef<boolean>(false)
	const sliderRef = useRef<HTMLInputElement>(null)
	const [seekDirection, setSeekDirection] = useState<'left' | 'right' | null>(
		null
	)

	const handleSeekStart = () => {
		seeking.current = true
	}

	const handleSeekChange = (value: number) => {
		setPosition(value)
	}

	const handleSeekEnd = async (value: number) => {
		seeking.current = false
		try {
			const currentDur = await invoke<number>('get_duration')
			const clamped = Math.max(0, Math.min(currentDur, value))
			await invoke('set_position', { position: clamped })
			setPosition(clamped)
			setDuration(currentDur)
		} catch (error) {
			console.error('Seek set failed:', error)
		}
	}

	const seekRelative = async (delta: number) => {
		// Show visual indicator
		setSeekDirection(delta < 0 ? 'left' : 'right')

		try {
			const currentPos = await invoke<number>('get_position')
			const currentDur = await invoke<number>('get_duration')

			const newPos = Math.max(0, Math.min(currentDur, currentPos + delta))
			await invoke('set_position', { position: newPos })
			setPosition(newPos)
			setDuration(currentDur)
		} catch (error) {
			console.error('Seek failed:', error)
		}
	}

	// Calculate knob position as a percentage
	const getKnobPosition = () => {
		if (duration === 0) return 0
		const percentage = (position / duration) * 100
		return percentage
	}

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				seekRelative(-10)
			} else if (e.key === 'ArrowRight') {
				e.preventDefault()
				seekRelative(10)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	// Update position every 500ms if not seeking
	useEffect(() => {
		const interval = setInterval(() => {
			if (!seeking.current) {
				invoke<number>('get_position')
					.then(setPosition)
					.catch(console.error)
			}
		}, 500)
		return () => clearInterval(interval)
	}, [])

	// Update slider color on position change
	useEffect(() => {
		if (sliderRef.current) {
			const min = Number(sliderRef.current.min)
			const max = Number(sliderRef.current.max)
			const value = Number(sliderRef.current.value)

			const percentage = ((value - min) / (max - min)) * 100

			sliderRef.current.style.setProperty(
				'--value-percent',
				`${percentage}%`
			)
		}
	}, [position])

	return (
		<FlexBox direction='column' width={'100%'} gap={0.5}>
			<SeekIndicator
				direction={seekDirection}
				onAnimationEnd={() => setSeekDirection(null)}
			/>
			<div style={{ position: 'relative', width: '100%' }}>
				<input
					ref={sliderRef}
					type='range'
					min={0}
					max={duration}
					step={0.1}
					value={position}
					onMouseDown={handleSeekStart}
					onChange={(e) => handleSeekChange(parseFloat(e.target.value))}
					onMouseUp={(e) =>
						handleSeekEnd(
							parseFloat((e.target as HTMLInputElement).value)
						)
					}
					onTouchEnd={() => handleSeekEnd(position)}
					className={`
        w-full h-3 rounded-lg appearance-none cursor-pointer outline-none ring-0
        bg-gray-500/60
        bg-[linear-gradient(to_right,var(--app-color)_0%,var(--app-color)_var(--value-percent),theme(colors.gray.600)_var(--value-percent),theme(colors.gray.600)_100%)]

        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-1.5 
        [&::-webkit-slider-thumb]:h-5  
        [&::-webkit-slider-thumb]:bg-white
        [&::-webkit-slider-thumb]:rounded-sm 
        [&::-webkit-slider-thumb]:shadow-md
        [&::-webkit-slider-thumb]:transition-all 
        [&::-webkit-slider-thumb]:duration-200 

        hover:[&::-webkit-slider-thumb]:-translate-x-1/3
        hover:[&::-webkit-slider-thumb]:w-5       
        hover:[&::-webkit-slider-thumb]:h-5       
        hover:[&::-webkit-slider-thumb]:rounded-full 
      hover:[&::-webkit-slider-thumb]:bg-white 

        [&::-moz-range-progress]:bg-white 
        [&::-moz-range-track]:bg-gray-600
      `}
				/>

				{/* Current time indicator */}
				<div
					style={{
						position: 'absolute',
						left: `${getKnobPosition()}%`,
						transform: 'translateX(-35%)',
						top: '100%',
						whiteSpace: 'nowrap',
						fontSize: '0.875rem',
						fontWeight: '500',
						pointerEvents: 'none',
					}}
				>
					{formatTime(position)}
				</div>
			</div>
			<FlexBox width={'100%'} justify='end'>
				<span>{formatTime(duration - position)}</span>
			</FlexBox>
		</FlexBox>
	)
}

export default TimelineSlider
