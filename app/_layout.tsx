import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { shallow } from 'zustand/shallow'
import { memo, useEffect, useRef } from 'react'
import {
	configureReanimatedLogger,
	ReanimatedLogLevel,
} from 'react-native-reanimated'
import '../global.css'
import {
	TVEventHandler,
	Platform,
	HWEvent,
	EventSubscription,
} from 'react-native'
import { useAuth } from '@/context/auth.context'
import AudioPlayer from '@/components/music/AudioPlayer'
import MusicPlayer from '@/components/music/MusicPlayer'
import { SpatialNavigationRoot } from 'react-tv-space-navigation'
import { useTVRemoteHandler } from '@/hooks/useTVRemoteHandler'

SplashScreen.preventAutoHideAsync()

configureReanimatedLogger({
	level: ReanimatedLogLevel.warn,
	strict: false,
})

// --- Nuevo Componente para Manejar Eventos del Mando ---
// Este componente encapsula la lógica para escuchar los eventos del mando a distancia.
function TVEventHandlerComponent() {
	// Usamos useRef para mantener una referencia a la suscripción del evento,
	// para poder eliminarla cuando el componente se desmonte.
	const eventSubscription = useRef<EventSubscription | undefined>(undefined)

	// La función que se ejecutará cada vez que se reciba un evento del mando.
	// Añadimos el tipo HWEvent para mayor seguridad con TypeScript.
	const handleTVRemoteEvent = (event: HWEvent) => {
		// `event` es un objeto que contiene detalles sobre la pulsación.
		// - eventType: El tipo de evento (e.g., 'select', 'playPause', 'up', 'down', 'left', 'right').
		// - eventKeyAction: (Solo para Android) La acción del teclado (0 para key-down, 1 para key-up, 2 para key-long-press).
		// - body: Contiene información adicional si es necesario.
		console.log('Evento del Mando Recibido:', {
			eventType: event.eventType,
			eventKeyAction: event.eventKeyAction, // Muy útil para diferenciar entre pulsación y liberación
			tag: event.tag, // El tag del componente enfocado
		})
	}

	useEffect(() => {
		// Este efecto se ejecuta solo una vez, cuando el componente se monta.

		// Verificamos si la plataforma es Android TV o Apple TV.
		if (Platform.isTV) {
			console.log(
				'Plataforma de TV detectada. Adjuntando listener de eventos...'
			)

			// La API moderna no usa 'new'. Se llama directamente a addListener.
			// Esto devuelve un objeto de suscripción que usamos para limpiar.
			eventSubscription.current =
				TVEventHandler.addListener(handleTVRemoteEvent)
			console.log('Listener de TVEventHandler adjuntado.')
		}

		// La función de limpieza de useEffect es crucial.
		// Se ejecuta cuando el componente se desmonta.
		return () => {
			console.log(
				'Desmontando el componente. Eliminando suscripción de eventos...'
			)
			// Si la suscripción existe, la eliminamos para liberar recursos
			// y evitar fugas de memoria.
			eventSubscription.current?.remove()
			console.log('Suscripción de TVEventHandler eliminada.')
		}
	}, []) // El array de dependencias vacío asegura que se ejecute solo al montar/desmontar.

	// Este componente no renderiza nada en la interfaz de usuario.
	return null
}

function TVNavigationSetup() {
	useTVRemoteHandler()
	return null
}

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

function AppLayout() {
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
			<TVNavigationSetup />

			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: 'trasnparent' },
				}}
			>
				<Stack.Screen
					name='(app)/(tabs)'
					options={{ headerShown: false }}
				/>
				{/* <Stack.Screen name='(auth)' options={{ headerShown: false }} /> */}
				<Stack.Screen
					name='(app)/(no-tabs)'
					options={{ headerShown: false }}
				/>
			</Stack>

			{/* Audio Player and Music Player UI */}
			<AudioPlayer />
			<MusicPlayer />
		</>
	)
}

export default memo(AppLayout)
