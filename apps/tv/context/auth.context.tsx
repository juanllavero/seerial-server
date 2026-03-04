import { CENTRAL_SERVER } from '@/constants/Server'
import { User } from '@/data/interfaces/Users'
import { createWithEqualityFn } from 'zustand/traditional'
import * as Keychain from 'react-native-keychain'

// Define una variable de entorno para controlar el mock
// En un entorno real, esto se manejaría con .env o similar.
// Para propósitos de demostración, lo definimos aquí.
const IS_DEVELOPMENT_MOCK_USER = true // Cambia a 'false' para deshabilitar el mock

// Usuario mockeado
const MOCKED_USER: User = {
	id: '1',
	email: 'juanllavero3314@gmail.com',
	name: 'SirJohn',
	image: 'https://yt3.ggpht.com/oVBuu4F-kVVZ9AafDCN8T42OE6wcNjwnX-yQWZ8no6WAYgvNXbMenk63o-OVjfhWM7Cnaq_WGQ=s88-c-k-c0x00ffffff-no-rj',
	servers: [
		{
			id: '1',
			ip: '192.168.100.27',
			publicIp: '85.48.147.211',
			port: 34200,
			ownerId: '1',
			name: 'SIRJOHN-SERVER',
		},
	],
}

// Define el tipo para tu estado
type AuthState = {
	token: string | null
	user: User | null
	isLoading: boolean
	isInitialized: boolean
}

// Define el tipo para las acciones
type AuthActions = {
	setToken: (token: string | null) => Promise<void>
	login: (token: string) => Promise<void>
	logout: () => Promise<void>
	fetchUser: (token: string) => Promise<void>
	initializeAuth: () => Promise<void>
	_keychainGetItem: (key: string) => Promise<string | null>
	_keychainSetItem: (key: string, value: string) => Promise<boolean>
	_keychainRemoveItem: (key: string) => Promise<boolean>
}

// Combina los tipos de estado y acciones para el tipo de tu store
type AuthStore = AuthState & AuthActions

export const useAuth = createWithEqualityFn<AuthStore>((set, get) => ({
	// Estado inicial
	token: null,
	user: null,
	isLoading: true,
	isInitialized: false,

	// Funciones de Keychain directamente integradas
	_keychainGetItem: async (key: string): Promise<string | null> => {
		try {
			const credentials = await Keychain.getGenericPassword({ service: key })
			if (credentials) {
				return credentials.password
			}
			return null
		} catch (e) {
			console.error(`Error getting item with key "${key}" from Keychain:`, e)
			return null
		}
	},

	_keychainSetItem: async (key: string, value: string): Promise<boolean> => {
		try {
			await Keychain.setGenericPassword('secure_storage_user', value, {
				service: key,
			})
			return true
		} catch (e) {
			console.error(`Error setting item with key "${key}" in Keychain:`, e)
			return false
		}
	},

	_keychainRemoveItem: async (key: string): Promise<boolean> => {
		try {
			await Keychain.resetGenericPassword({ service: key })
			return true
		} catch (e) {
			console.error(
				`Error removing item with key "${key}" from Keychain:`,
				e
			)
			return false
		}
	},

	// Acciones
	setToken: async (newToken) => {
		console.log(
			'useAuth: setToken llamado. Nuevo token:',
			newToken ? 'presente' : 'nulo'
		)
		set({ token: newToken })

		if (newToken) {
			await get()._keychainSetItem('token', newToken)
			console.log('useAuth: Token almacenado en Keychain.')
		} else {
			await get()._keychainRemoveItem('token')
			console.log('useAuth: Token eliminado de Keychain.')
		}
		console.log(
			'useAuth: setToken finalizado. Current isLoading:',
			get().isLoading
		)
	},

	login: async (newToken: string) => {
		console.log('useAuth: login llamado.')
		set({ isLoading: true })
		console.log('useAuth: isLoading puesto a true en login.')

		if (IS_DEVELOPMENT_MOCK_USER) {
			console.log(
				'useAuth: Modo de desarrollo activo. Estableciendo usuario mockeado.'
			)
			set({ user: MOCKED_USER, token: 'mock-token-123', isLoading: false })
			return
		}

		await get().setToken(newToken)
		await get().fetchUser(newToken)
		console.log(
			'useAuth: login finalizado. Current isLoading:',
			get().isLoading
		)
	},

	logout: async () => {
		console.log('useAuth: logout llamado.')
		await get().setToken(null)
		set({ user: null, isLoading: false })
		console.log('useAuth: logout finalizado. isLoading puesto a false.')
	},

	fetchUser: async (token: string) => {
		console.log('useAuth: fetchUser llamado. Token presente:', !!token)
		set({ isLoading: true })
		console.log('useAuth: isLoading puesto a true en fetchUser.')

		if (IS_DEVELOPMENT_MOCK_USER) {
			console.log(
				'useAuth: Modo de desarrollo activo. Devolviendo usuario mockeado.'
			)
			set({ user: MOCKED_USER, isLoading: false })
			return
		}

		try {
			const res = await fetch(`https://${CENTRAL_SERVER}/users/me`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				const data = await res.json()
				set({ user: data })
				console.log('useAuth: Usuario obtenido y establecido.', data)
			} else {
				const errorText = await res.text()
				console.error(
					'useAuth: Error al obtener el usuario. Estado HTTP:',
					res.status,
					'Respuesta:',
					errorText
				)
				throw new Error(`Failed to fetch user: ${res.status} ${errorText}`)
			}
		} catch (error) {
			console.error('useAuth: Excepción en fetchUser:', error)
			get().logout()
			console.log(
				'useAuth: Se llamó a logout debido a un error en fetchUser.'
			)
		} finally {
			set({ isLoading: false })
			console.log(
				'useAuth: fetchUser finalizado (finally). isLoading puesto a false.'
			)
		}
	},

	initializeAuth: async () => {
		if (get().isInitialized) {
			console.log(
				'useAuth: initializeAuth llamado, pero ya inicializado. Ignorando.'
			)
			return
		}

		console.log('useAuth: initializeAuth llamado.')
		set({ isLoading: true })
		console.log('useAuth: isLoading puesto a true en initializeAuth.')

		if (IS_DEVELOPMENT_MOCK_USER) {
			console.log(
				'useAuth: Modo de desarrollo activo. Inicializando con usuario mockeado.'
			)
			set({
				user: MOCKED_USER,
				token: 'mock-token-123',
				isLoading: false,
				isInitialized: true,
			})
			return
		}

		try {
			const storedToken = await get()._keychainGetItem('token')
			console.log(
				'useAuth: Token recuperado de Keychain:',
				storedToken ? 'presente' : 'nulo'
			)

			if (storedToken) {
				set({ token: storedToken })
				console.log('useAuth: Token establecido en el estado.')
				await get().fetchUser(storedToken)
				console.log('useAuth: initializeAuth llamó a fetchUser.')
			} else {
				set({ user: null })
				console.log('useAuth: No se encontró token. user puesto a null.')
			}
		} catch (error) {
			console.error(
				'useAuth: Excepción en initializeAuth desde Keychain:',
				error
			)
			get().logout()
			console.log('useAuth: Error en initializeAuth. Se llamó a logout.')
		} finally {
			set({ isInitialized: true, isLoading: false })
			console.log(
				'useAuth: initializeAuth finalizado (finally). isLoading puesto a false.'
			)
		}
	},
}))
