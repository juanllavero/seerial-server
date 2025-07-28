import React, { createContext, useContext, useEffect, useRef } from 'react'
import { BackHandler } from 'react-native'
import CustomEventEmitter from './CustomEventEmitter' // Reutilizamos tu emisor
import { SupportedKeys } from './SupportedKeys'

// 1. Creamos una única instancia del emisor de eventos (similar al singleton)
const remoteControlEmitter = new CustomEventEmitter<{
	keyDown: SupportedKeys
}>()

// 2. Creamos el contexto de React
const RemoteControlContext = createContext(remoteControlEmitter)

// 3. Creamos el Hook principal
export const useRemoteControl = () => {
	const emitter = useContext(RemoteControlContext)

	// Efecto para gestionar el listener del botón "Atrás"
	useEffect(() => {
		const onBackPress = () => {
			// Emitimos el evento y devolvemos `true` para indicar que lo hemos manejado
			emitter.emit('keyDown', SupportedKeys.Back)
			return true
		}

		const subscription = BackHandler.addEventListener(
			'hardwareBackPress',
			onBackPress
		)

		// Limpieza: eliminamos el listener cuando el componente se desmonta
		return () => subscription.remove()
	}, [emitter]) // Se ejecuta solo una vez

	// Devolvemos los métodos para interactuar con el emisor
	return {
		/**
		 * Escucha un evento de tecla.
		 * El listener DEBE devolver un booleano.
		 */
		addKeydownListener: (listener: (event: SupportedKeys) => boolean) => {
			// 👈 CAMBIO AQUÍ
			emitter.on('keyDown', listener)
			return listener
		},
		/**
		 * Deja de escuchar un evento de tecla.
		 */
		removeKeydownListener: (listener: (event: SupportedKeys) => boolean) => {
			// 👈 CAMBIO AQUÍ
			emitter.off('keyDown', listener)
		},
		/**
		 * Emite un evento manualmente.
		 */
		emitKeyDown: (key: SupportedKeys) => {
			emitter.emit('keyDown', key)
		},
		/**
		 * Props para añadir a un componente `Pressable` para gestionar
		 * el click normal y el click largo.
		 */
		pressableProps: {
			onPress: () => emitter.emit('keyDown', SupportedKeys.Enter),
			onLongPress: () => emitter.emit('keyDown', SupportedKeys.LongEnter),
		},
	}
}
