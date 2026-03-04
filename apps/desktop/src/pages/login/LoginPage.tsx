import Image from '@/components/ui/Image'
import { useServerStore } from '@/context/server.context'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'

function LoginPage() {
	const { user, server, servers, addServer } = useServerStore(
		(state) => ({
			user: state.currentUser,
			server: state.server,
			servers: state.servers,
			addServer: state.addServer,
		}),
		shallow
	)
	const navigate = useNavigate()
	const [host, setHost] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	if (servers.length > 0 && server && user) {
		navigate('/home')
		return null
	}

	const handleConnect = async () => {
		if (host.trim() && !isLoading) {
			setIsLoading(true)
			setErrorMessage('')

			let url = host.trim()

			// Normalize if not includes HTTP or HTTPS
			if (!/^https?:\/\//i.test(url)) {
				// IP or localhost -> HTTP
				if (
					/^(\d{1,3}\.){3}\d{1,3}/.test(url) ||
					url.startsWith('localhost')
				) {
					url = `http://${url}`
				} else {
					// Domain -> HTTPS
					url = `https://${url}`
				}
			}

			try {
				const response = await fetch(url)
				if (!response.ok) {
					throw new Error('No ha sido posible conectarse al servidor')
				}

				const server = await response.json()
				await addServer({ ...server, url })
				navigate('/users')
			} catch (error) {
				setErrorMessage('No ha sido posible conectarse al servidor')
				setTimeout(() => {
					setErrorMessage('')
				}, 5000)
			} finally {
				setIsLoading(false)
			}
		}
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900 via-cyan-950 to-black'>
			<div className='w-full max-w-2xl px-8'>
				{/* Logo y título */}
				<div className='mb-10 flex flex-row justify-center'>
					<Image src='/img/banner.svg' alt='Logo' aspectRatio={'21/9'} />
				</div>

				{/* Main content */}
				<div className='text-center'>
					<h1 className='mb-10 text-5xl font-bold tracking-tight text-white'>
						Conectar al servidor
					</h1>

					<div className='space-y-8'>
						{/* Host input */}
						<div className='text-left'>
							<input
								type='text'
								value={host}
								onChange={(e) => setHost(e.target.value)}
								placeholder='192.168.1.100:34200 o https://myserver.com'
								onKeyUp={(e) => {
									if (e.key === 'Enter') {
										handleConnect()
									}
								}}
								disabled={isLoading}
								style={{ fontSize: '1.1rem' }}
								className='w-full rounded-md bg-black px-5 py-7 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
							/>

							{/* Error message */}
							{errorMessage && (
								<div className='mt-3 animate-pulse text-sm font-medium text-red-400'>
									{errorMessage}
								</div>
							)}
						</div>

						{/* Connect button */}
						<button
							onClick={() => handleConnect()}
							disabled={isLoading || !host.trim()}
							className='focus:ring-opacity-50 flex w-full transform items-center justify-center rounded-lg bg-white bg-gradient-to-r py-5 text-xl font-semibold text-black shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-2xl focus:ring-4 focus:ring-cyan-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
						>
							{isLoading ? (
								<div className='h-7 w-7 animate-spin rounded-full border-3 border-stone-500 border-t-transparent'></div>
							) : (
								'Conectar'
							)}
						</button>
					</div>

					{/* Helper text */}
					<div className='mx-auto mt-12 max-w-xl text-sm leading-relaxed text-stone-100'>
						Introduce la dirección IP y puerto de tu servidor o la URL
						completa para conectarte
					</div>
				</div>
			</div>
		</div>
	)
}

export default LoginPage
