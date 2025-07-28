import { useEffect } from 'react'
// Importamos el objeto TVEventHandler y el tipo para la suscripción
import {
	TVEventHandler,
	Platform,
	HWEvent,
	EventSubscription,
} from 'react-native'
import { SpatialNavigation, Directions } from 'react-tv-space-navigation'

export const useTVRemoteHandler = () => {
	useEffect(() => {
		// Solo ejecutamos esta configuración si estamos en una plataforma de TV.
		if (!Platform.isTV) {
			return
		}

		SpatialNavigation.configureRemoteControl({
			// remoteControlSubscriber se encarga de "suscribir" nuestra lógica de eventos.
			// Recibe un callback que debemos llamar con la dirección correcta.
			remoteControlSubscriber: (callback) => {
				// CORRECCIÓN: Añadimos una firma de índice al objeto mapping.
				// Esto le dice a TypeScript que este objeto puede ser indexado por cualquier string,
				// y que el valor resultante será de tipo Directions.
				const mapping: { [key: string]: Directions } = {
					right: Directions.RIGHT,
					left: Directions.LEFT,
					up: Directions.UP,
					down: Directions.DOWN,
					select: Directions.ENTER,
					playPause: Directions.ENTER, // A menudo, play/pause también funciona como "Enter".
				}

				const tvEventHandler = (event: HWEvent) => {
					// La comprobación ahora funciona sin errores de tipo.
					if (event && event.eventType && mapping[event.eventType]) {
						// CORRECCIÓN: Cambiado de 0 a 1 para que coincida con los logs (key-up).
						// El mando del emulador/dispositivo está enviando el evento al soltar la tecla.
						if (event.eventKeyAction === 1) {
							callback(mapping[event.eventType])
						}
					}
				}

				// Adjuntamos nuestro listener y devolvemos la suscripción.
				// La librería se encargará de guardarla para poder anularla después.
				const subscription = TVEventHandler.addListener(tvEventHandler)
				return subscription
			},

			// remoteControlUnsubscriber se encarga de "anular la suscripción".
			// Recibe la suscripción que devolvimos antes para poder limpiarla.
			remoteControlUnsubscriber: (subscription) => {
				if (subscription) {
					;(subscription as EventSubscription).remove()
					console.log(
						'Suscripción de TVEventHandler para navegación eliminada.'
					)
				}
			},
		})
	}, []) // El array vacío asegura que la configuración se ejecute solo una vez.
}
