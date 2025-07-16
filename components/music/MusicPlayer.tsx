import React, { useCallback, useEffect } from 'react'
import { Dimensions, View, Platform, BackHandler } from 'react-native'
import MusicGradient from './MusicGradient'
import { shallow } from 'zustand/shallow'
import useMusicStore from '@/context/music.context'
import Animated from 'react-native-reanimated'
import { getImageUrl } from '@/utils/utils'
import { useServerStore } from '@/context/server.context'
import MusicWave from './MusicWave'
import Subtitle from '../text/Subtitle'
import Secondary from '../text/Secondary'

function MusicPlayer() {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { height } = Dimensions.get('window')
	const {
		currentSong,
		album,
		isShown,
		isExpanded,
		togglePlayPause,
		setIsShown,
		setIsExpanded,
	} = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			album: state.album,
			isShown: state.isShown,
			isExpanded: state.isExpanded,
			togglePlayPause: state.togglePlayPause,
			setIsShown: state.setIsShown,
			setIsExpanded: state.setIsExpanded,
		}),
		shallow
	)

	// --- LÓGICA DE DETECCIÓN DE PULSACIONES ---

	// 1. Se crea una función `handleKeyPress` usando `useCallback` para memorizarla.
	// Esto asegura que la función no se recree en cada render a menos que sus dependencias cambien.
	const handleKeyPress = useCallback(
		(keyType: 'select' | 'back' | 'any') => {
			// Regla: Si se pulsa atrás, poner isExpanded en false
			if (keyType === 'back') {
				setIsExpanded(false)
				return // Se detiene la ejecución para no afectar otras reglas
			}

			// Regla: Si la UI está oculta y se pulsa cualquier otra tecla, mostrarla
			if (!isShown) {
				setIsShown(true)
				return
			}

			// Regla: Si la UI está visible y se pulsa OK/Espacio, hacer toggle
			if (isShown && keyType === 'select') {
				togglePlayPause()
			}
		},
		[isShown, isExpanded, setIsShown, setIsExpanded, togglePlayPause]
	)

	// 2. Hook para el mando de la TV (se ejecuta solo en plataformas de TV)
	// useTVEventHandler((evt) => {
	// 	// evt puede ser null, por eso se comprueba
	// 	if (evt) {
	// 		const { eventType } = evt
	// 		if (eventType === 'select' || eventType === 'playPause') {
	// 			handleKeyPress('select') // OK, D-Pad Center, Play/Pause
	// 		} else if (eventType === 'back') {
	// 			handleKeyPress('back') // Botón Atrás
	// 		} else {
	// 			handleKeyPress('any') // Cualquier otro botón (flechas, etc.)
	// 		}
	// 	}
	// })

	// 3. Hook para el teclado en la web (y el botón atrás en Android)
	useEffect(() => {
		// Lógica para el teclado en la web
		if (Platform.OS === 'web') {
			const onKeyDown = (e: KeyboardEvent) => {
				if (e.code === 'Space' || e.code === 'Enter') {
					e.preventDefault() // Evita que la barra espaciadora haga scroll
					handleKeyPress('select')
				} else if (e.key === 'Escape' || e.key === 'Backspace') {
					handleKeyPress('back')
				} else {
					handleKeyPress('any')
				}
			}
			window.addEventListener('keydown', onKeyDown)
			return () => window.removeEventListener('keydown', onKeyDown)
		}

		// Lógica para el botón físico "atrás" en Android
		const onAndroidBackPress = () => {
			handleKeyPress('back')
			// Devolvemos `true` para indicar que hemos manejado el evento
			// y evitar que la app se cierre.
			return true
		}

		const subscription = BackHandler.addEventListener(
			'hardwareBackPress',
			onAndroidBackPress
		)

		return () => subscription.remove()
	}, [handleKeyPress]) // El hook depende de la función memorizada

	// --- FIN DE LA LÓGICA ---

	if (!album || !currentSong) return null

	return (
		<View className='w-screen h-screen bg-black'>
			<MusicGradient imageUrl={album.coverSrc ?? ''} />

			<View className='justify-center items-center h-screen gap-6'>
				<Animated.Image
					source={{ uri: getImageUrl(serverUrl, album.coverSrc) }}
					style={{
						width: isShown ? height * 0.5 : height * 0.7,
						height: isShown ? height * 0.5 : height * 0.7,
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

			<View></View>
		</View>
	)
}

export default MusicPlayer
