import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { shallow } from 'zustand/shallow'
import { useEffect } from 'react'
import {
	configureReanimatedLogger,
	ReanimatedLogLevel,
} from 'react-native-reanimated'
import '../global.css'

import { useAuth } from '@/context/auth.context'
import AudioPlayer from '@/components/music/AudioPlayer'
import MusicPlayer from '@/components/music/MusicPlayer'

SplashScreen.preventAutoHideAsync()

configureReanimatedLogger({
	level: ReanimatedLogLevel.warn,
	strict: false,
})

function AuthRedirectController() {
	const { user, isInitialized } = useAuth(
		(state) => ({
			user: state.user,
			isInitialized: state.isInitialized,
		}),
		shallow
	)
	const segments = useSegments()
	const router = useRouter()

	useEffect(() => {
		if (!isInitialized) {
			console.log('AuthRedirectController: No inicializado, esperando...')
			return
		}

		const inAuthGroup = segments[0] === '(auth)'

		if (isInitialized) {
			// Solo actuamos si la autenticación ya ha terminado de cargar.
			if (user && inAuthGroup) {
				// Si ya hay usuario Y estamos en el grupo de autenticación (ej: /login),
				// redirigimos a la aplicación principal (tabs)
				console.log(
					'AuthRedirectController: Usuario autenticado en ruta de auth. Redirigiendo a /.'
				)
				router.replace('/') // Redirige sin añadir al historial de navegación
			} else if (!user && !inAuthGroup) {
				// Si NO hay usuario Y NO estamos en el grupo de autenticación (ej: /tabs/home),
				// redirigimos al login.
				console.log(
					'AuthRedirectController: Usuario NO autenticado fuera de ruta de auth. Redirigiendo a /login.'
				)
				router.replace('/(auth)/login') // Redirige al login
			}
		}
	}, [user, isInitialized, segments]) // Dependencias: el estado de auth y los segmentos de la ruta

	return null // Este componente no renderiza nada visible, solo maneja la redirección.
}

export default function AppLayout() {
	const { initializeAuth, isInitialized } = useAuth(
		(state) => ({
			initializeAuth: state.initializeAuth,
			isInitialized: state.isInitialized,
		}),
		shallow
	)

	const [loadedFonts, fontError] = useFonts({
		Satoshi: require('@/assets/fonts/Satoshi-Variable.ttf'),
	})

	// Asegura que initializeAuth se llame solo una vez al inicio del ciclo de vida de la app.
	useEffect(() => {
		if (!isInitialized) {
			console.log(
				'AppLayout: useEffect [initializeAuth] -> Llamando initializeAuth() por primera vez.'
			)
			initializeAuth()
		} else {
			console.log(
				'AppLayout: useEffect [initializeAuth] -> Ya inicializado, no se llama de nuevo.'
			)
		}
	}, [initializeAuth, isInitialized])

	// Efecto para ocultar la splash screen
	useEffect(() => {
		if ((loadedFonts || fontError) && isInitialized) {
			// Espera que isInitialized sea true
			SplashScreen.hideAsync()
			if (fontError) {
				console.warn(`Error in loading fonts: ${fontError}`)
			}
			console.log('AppLayout: Splash screen oculta. Carga inicial completa.')
		}
	}, [loadedFonts, fontError, isInitialized])

	if ((!loadedFonts && !fontError) || !isInitialized) {
		return null
	}

	return (
		<>
			<AuthRedirectController />

			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: 'trasnparent' },
				}}
			>
				<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
				<Stack.Screen name='(auth)' options={{ headerShown: false }} />
				<Stack.Screen name='(no-tabs)' options={{ headerShown: false }} />
			</Stack>

			{/* Audio Player and Music Player UI */}
			<AudioPlayer />
			<MusicPlayer />
		</>
	)
}
