import AppText from '@/components/text/AppText'
import { useAuth } from '@/context/auth.context'
import React, { useState, useEffect, useRef, memo, useCallback } from 'react'
import { View } from 'react-native'

const API_URL = 'https://api.seerial.es'

function LoginScreen() {
	const [userCode, setUserCode] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const { setToken } = useAuth()

	const deviceCodeRef = useRef<string | null>(null)
	const intervalRef = useRef<number | null>(null)

	useEffect(() => {
		const initiateDeviceAuth = async () => {
			try {
				const res = await fetch(`https://${API_URL}/device/initiate`, {
					method: 'POST',
				})
				const data = await res.json()

				console.log({ data })

				if (!res.ok)
					throw new Error(data.error || 'Failed to start login process')

				setUserCode(data.user_code)
				deviceCodeRef.current = data.device_code

				intervalRef.current = setInterval(() => {
					pollForToken(data.device_code)
				}, data.interval * 1000)
			} catch (err: any) {
				setError(err.message)
			}
		}

		initiateDeviceAuth()

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [])

	const pollForToken = useCallback(async (deviceCode: string) => {
		try {
			const res = await fetch(`https://${API_URL}/device/token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ device_code: deviceCode }),
			})

			if (res.status === 202) {
				console.log('Authorization pending...')
				return
			}

			const data = await res.json()

			if (res.ok && data.token) {
				if (intervalRef.current) clearInterval(intervalRef.current)
				console.log('Login successful!')
				setToken(data.token)
			} else {
				throw new Error(data.error || 'An error occurred')
			}
		} catch (err: any) {
			setError(err.message)
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [])

	return (
		<View>
			<AppText>Inicia sesión en otro dispositivo</AppText>
			<AppText>1. Abre un navegador y ve a:</AppText>
			<AppText>miPagina.es/link</AppText>
			<AppText>2. Introduce el siguiente código:</AppText>
			{userCode ? (
				<AppText>{userCode}</AppText>
			) : (
				<AppText>Cargando...</AppText>
			)}
			{error && <AppText>{error}</AppText>}
		</View>
	)
}

export default memo(LoginScreen)
