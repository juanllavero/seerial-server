import { useState, useEffect, useCallback } from 'react'
import * as Keychain from 'react-native-keychain'

/**
 * Hook para almacenar y recuperar pares clave-valor de forma segura utilizando react-native-keychain.
 * Funciona de manera similar a localStorage/AsyncStorage, pero con seguridad adicional.
 *
 * @returns Un objeto con funciones para interactuar con el almacenamiento seguro:
 * - `getItem(key: string)`: Obtiene un valor por su clave.
 * - `setItem(key: string, value: string)`: Almacena un par clave-valor.
 * - `removeItem(key: string)`: Elimina un valor por su clave.
 * - `isLoading`: Booleano que indica si el almacenamiento está inicializando.
 * - `error`: Cualquier error que haya ocurrido durante la inicialización.
 */
export const useSecureStorage = () => {
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	// No necesitamos un estado interno para los valores aquí, ya que el hook es para "consultar" el almacenamiento,
	// no para "mantener" un estado reactivo de todos los valores.

	const initialize = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			// Opcional: Puedes verificar aquí si Keychain está disponible y funcionando.
			// Por ejemplo, intenta guardar y luego eliminar una clave de prueba.
			await Keychain.setGenericPassword(
				'__secure_storage_test_key__',
				'test_value'
			)
			await Keychain.resetGenericPassword()
		} catch (e) {
			console.error('Error initializing Keychain:', e)
			setError(e as Error)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		initialize()
	}, [initialize])

	/**
	 * Obtiene un valor del almacenamiento seguro.
	 * @param key La clave del valor a obtener.
	 * @returns El valor asociado a la clave, o `null` si no se encuentra o hay un error.
	 */
	const getItem = useCallback(async (key: string): Promise<string | null> => {
		try {
			// Keychain.getGenericPassword() no permite una clave directa para "obtener".
			// En su lugar, se asocia un "servicio" o "username" con la contraseña.
			// Para un almacenamiento genérico, usaremos la 'key' como 'service' y una clave fija como 'username'.
			const credentials = await Keychain.getGenericPassword({ service: key })
			if (credentials) {
				return credentials.password
			}
			return null
		} catch (e) {
			console.error(`Error getting item with key "${key}" from Keychain:`, e)
			return null
		}
	}, [])

	/**
	 * Almacena un par clave-valor en el almacenamiento seguro.
	 * @param key La clave del valor a almacenar.
	 * @param value El valor a almacenar.
	 * @returns `true` si la operación fue exitosa, `false` en caso contrario.
	 */
	const setItem = useCallback(
		async (key: string, value: string): Promise<boolean> => {
			try {
				// Usamos la 'key' como 'service' y un 'username' fijo para la contraseña.
				await Keychain.setGenericPassword('secure_storage_user', value, {
					service: key,
				})
				return true
			} catch (e) {
				console.error(
					`Error setting item with key "${key}" in Keychain:`,
					e
				)
				return false
			}
		},
		[]
	)

	/**
	 * Elimina un valor del almacenamiento seguro.
	 * @param key La clave del valor a eliminar.
	 * @returns `true` si la operación fue exitosa, `false` en caso contrario.
	 */
	const removeItem = useCallback(async (key: string): Promise<boolean> => {
		try {
			// Para eliminar, también necesitamos el 'service' (que es nuestra clave).
			await Keychain.resetGenericPassword({ service: key })
			return true
		} catch (e) {
			console.error(
				`Error removing item with key "${key}" from Keychain:`,
				e
			)
			return false
		}
	}, [])

	return {
		getItem,
		setItem,
		removeItem,
		isLoading,
		error,
	}
}
