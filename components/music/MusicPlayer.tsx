import React, { useEffect, useRef, useState } from 'react'
import {
	Dimensions,
	View,
	Platform,
	BackHandler,
	Pressable,
	StyleSheet,
	TouchableOpacity,
} from 'react-native'
import MusicGradient from './MusicGradient'
import { shallow } from 'zustand/shallow'
import useMusicStore from '@/context/music.context'
import Animated from 'react-native-reanimated'
import { formatTime, getImageUrl } from '@/utils/utils'
import { useServerStore } from '@/context/server.context'
import MusicWave from './MusicWave'
import Subtitle from '../text/Subtitle'
import Secondary from '../text/Secondary'
import { appColor } from '@/constants/Colors'
import Tertiary from '../text/Tertiary'
import { MessageSquareQuote } from 'lucide-react-native'
import StopIcon from '../svg/player/controls/StopIcon'
import LRCVisualizer from './lyrics/LRCVisualizer'

function MusicPlayer() {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { height } = Dimensions.get('window')
	const {
		currentSong,
		album,
		showLyrics,
		isShown,
		isExpanded,
		currentTime,
		duration,
		sliderFocused,
		skipForward,
		skipBackward,
		setFocusSlider,
		resetPlayerState,
		setShowLyrics,
		togglePlayPause,
		setIsShown,
		setIsExpanded,
	} = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			album: state.album,
			showLyrics: state.showLyrics,
			isShown: state.isShown,
			isExpanded: state.isExpanded,
			currentTime: state.currentTime,
			duration: state.duration,
			sliderFocused: state.sliderFocused,
			skipForward: state.skipForward,
			skipBackward: state.skipBackward,
			setFocusSlider: state.setFocusSlider,
			resetPlayerState: state.resetPlayerState,
			setShowLyrics: state.setShowLyrics,
			togglePlayPause: state.togglePlayPause,
			setIsShown: state.setIsShown,
			setIsExpanded: state.setIsExpanded,
		}),
		shallow
	)

	// Refs para los botones para poder enfocarlos
	const lyricsButtonRef = useRef<View>(null)
	const stopButtonRef = useRef<View>(null)

	// Nuevo estado para saber qué botón está enfocado
	const [focusedButton, setFocusedButton] = useState<'lyrics' | 'stop' | null>(
		null
	)

	//#region Event Handlers
	useEffect(() => {
		// La lógica de eventos solo se aplica en la plataforma web
		if (Platform.OS !== 'web') {
			const onAndroidBackPress = () => {
				if (isExpanded) {
					setIsExpanded(false)
					return true // Evento manejado
				}
				return false // Dejar que el sistema maneje el botón de retroceso
			}
			const subscription = BackHandler.addEventListener(
				'hardwareBackPress',
				onAndroidBackPress
			)
			return () => subscription.remove()
		}

		const onKeyDown = (e: KeyboardEvent) => {
			// Si el reproductor no está expandido, no hacer nada.
			if (!isExpanded) {
				return
			}

			e.preventDefault() // Prevenir comportamiento por defecto como el scroll

			switch (e.key) {
				case 'ArrowDown':
					if (!isShown) {
						setIsShown(true)
						setFocusedButton(null)
						setFocusSlider(true)
					} else if (sliderFocused) {
						setFocusSlider(false)
						// Enfocar el primer botón (letras) por defecto
						setFocusedButton('lyrics')
					}
					break

				case 'ArrowUp':
					if (sliderFocused || !isShown) {
						setIsShown(!isShown)
						setFocusedButton(null)
						setFocusSlider(true)
					} else if (focusedButton) {
						setFocusedButton(null)
						setFocusSlider(true)
					}
					break

				case 'ArrowRight':
					// Si el slider está enfocado o los controles no se muestran, adelantar
					if (sliderFocused || !isShown) {
						skipForward()
					}
					// Si el botón de letras está enfocado, pasar al de stop
					else if (focusedButton === 'lyrics') {
						setFocusedButton('stop')
					}
					break

				case 'ArrowLeft':
					// Si el slider está enfocado o los controles no se muestran, retroceder
					if (sliderFocused || !isShown) {
						skipBackward()
					}
					// Si el botón de stop está enfocado, pasar al de letras
					else if (focusedButton === 'stop') {
						setFocusedButton('lyrics')
					}
					break

				case 'Space':
					// Si el slider está enfocado o los controles no se muestran, play/pausa
					if (sliderFocused || !isShown) {
						togglePlayPause()
					}
					// Activar la acción del botón enfocado
					else if (focusedButton === 'lyrics') {
						setShowLyrics(!showLyrics)
					} else if (focusedButton === 'stop') {
						resetPlayerState()
					}
					break

				case 'Escape':
				case 'Backspace':
					// Cerrar la vista expandida
					setIsExpanded(false)
					break
			}
		}

		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [
		isExpanded,
		sliderFocused,
		focusedButton,
		isShown,
		skipForward,
		skipBackward,
		togglePlayPause,
		setIsShown,
		setFocusSlider,
		setShowLyrics,
		resetPlayerState,
		setIsExpanded,
	])
	//#endregion

	// Minimized slider progress calculation
	const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

	if (!album || !currentSong) return null

	if (!isExpanded)
		return (
			<View className='absolute top-10 right-10'>
				<TouchableOpacity
					focusable
					className='relative'
					onPress={() => setIsExpanded(true)}
				>
					<Animated.Image
						source={{ uri: getImageUrl(serverUrl, album.coverSrc) }}
						style={{
							width: height * 0.1,
							height: height * 0.1,
							borderRadius: 10,
						}}
					/>

					<View className='absolute top-10 right-10'>
						<MusicWave width={5} color={appColor} />
					</View>

					{/* Slider Background */}
					<View className='absolute bottom-0 h-3 w-full bg-black/70' />

					{/* Slider Progress */}
					<View
						className='absolute bottom-0 h-3'
						style={{
							width: `${progressPercentage}%`,
							backgroundColor: appColor,
						}}
					/>
				</TouchableOpacity>
			</View>
		)

	return (
		<View className='w-screen h-screen bg-black'>
			<MusicGradient imageUrl={album.coverSrc ?? ''} />

			<View className='flex-row justify-center items-center h-[82dvh] gap-6 pb-20'>
				<View className='justify-end items-center bg-black h-[82dvh] w-fit gap-6 pb-5 px-64'>
					<Animated.Image
						source={{ uri: getImageUrl(serverUrl, album.coverSrc) }}
						style={{
							width: height * 0.55,
							height: height * 0.55,
							borderRadius: 10,
						}}
					/>

					<View className='justify-center items-center gap-0'>
						<View className='flex-row justify-center items-center gap-5'>
							<MusicWave width={8} color='lightgray' />
							<Subtitle>{currentSong.title}</Subtitle>
						</View>
						<Secondary>{album.title}</Secondary>
					</View>
				</View>

				<LRCVisualizer />
			</View>

			{/* Controls */}
			<View
				className={`justify-start items-center gap-5 w-screen h-[17dvh] bg-transparent transition-all duration-200 ease-in-out ${isShown ? '' : 'translate-y-[100%]'}`}
			>
				{/* Progress Slider */}
				<View className='w-screen justify-end h-[7dvh] items-center gap-5 px-20'>
					{/* Slider Container */}
					<View
						className={`${
							sliderFocused ? 'h-[2dvh]' : 'h-[1dvh]'
						} relative w-full bg-neutral-500/80 drop-shadow-lg rounded-xl`}
					>
						{/* Slider Progress */}
						<View
							className={`${
								sliderFocused ? 'h-[2dvh]' : 'h-[1dvh]'
							} absolute bottom-0 h-[2dvh] rounded-xl`}
							style={{
								width: `${progressPercentage}%`,
								backgroundColor: appColor,
							}}
						/>
					</View>
					<View className='flex-row justify-between items-center w-full'>
						<Tertiary>{formatTime(currentTime)}</Tertiary>
						<Tertiary>{formatTime(duration)}</Tertiary>
					</View>
				</View>

				<View className='flex-row justify-between items-center gap-5 w-full bg-transparent px-20'>
					<View></View>
					<View className='flex-row justify-between items-center gap-5'>
						<Pressable
							ref={lyricsButtonRef}
							onPress={() => setShowLyrics(!showLyrics)}
							// Aplicar estilo de foco condicional
							style={[
								styles.buttonBase,
								{
									width: height * 0.05,
									height: height * 0.05,
								},
								focusedButton === 'lyrics' && styles.focused,
							]}
						>
							<MessageSquareQuote
								size={height * 0.03}
								color={showLyrics ? 'black' : 'white'}
								fill={showLyrics ? appColor : 'none'}
							/>
						</Pressable>
						<Pressable
							ref={stopButtonRef}
							onPress={resetPlayerState}
							// Aplicar estilo de foco condicional
							style={[
								styles.buttonBase,
								{
									width: height * 0.05,
									height: height * 0.05,
								},
								focusedButton === 'stop' && styles.focused,
							]}
						>
							<StopIcon size={height * 0.04} />
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	)
}

// Estilos para los botones, incluyendo el estado de foco
const styles = StyleSheet.create({
	buttonBase: {
		backgroundColor: 'rgba(75, 85, 99, 0.8)', // bg-neutral-500/80
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 10,
	},
	focused: {
		borderColor: appColor,
		borderWidth: 2,
		transform: [{ scale: 1.1 }], // Agrandar ligeramente para dar feedback
	},
})

export default MusicPlayer
