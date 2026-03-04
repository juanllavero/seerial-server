import { useServerStore } from '@/context/server.context'
import { useEffect, useState } from 'react'

interface TransparentImageProps {
	imageSrc: string
}

function TransparentImage({ imageSrc }: TransparentImageProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const imageHeight = window.innerHeight * 0.8
	const imageWidth = imageHeight * (16 / 9)

	useEffect(() => {
		if (!imageSrc) {
			return
		}

		const processedUrl = `${serverUrl}/api/transparent-image-effect?${
			imageSrc.startsWith('http')
				? `url=${encodeURIComponent(imageSrc)}`
				: `localPath=${imageSrc}`
		}&width=${Math.round(imageWidth * 2)}&height=${Math.round(imageHeight * 2)}`

		const fetchImage = async () => {
			try {
				const response = await fetch(processedUrl, {
					method: 'GET',
					credentials: 'include', // Include cookies
				})
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`)
				}
				const blob = await response.blob()
				const dataUrl = URL.createObjectURL(blob)
				setImageDataUrl(dataUrl)
			} catch (err) {
				console.error('Fetch error:', err)
				setError('Failed to load image')
			}
		}

		fetchImage()
		// Cleanup to revoke object URL
		return () => {
			if (imageDataUrl) {
				URL.revokeObjectURL(imageDataUrl)
			}
		}
	}, [imageSrc, serverUrl])

	return (
		<div className='absolute top-0 right-0 flex justify-end w-full h-full z-1 opacity-20 pointer-events-none'>
			{error ? (
				<p>{error}</p>
			) : imageDataUrl ? (
				<img
					src={imageDataUrl}
					alt='Background image'
					style={{
						height: imageHeight,
					}}
					onError={(e) => console.error('Image load error:', e)}
					onLoad={() => console.log('Image loaded successfully')}
				/>
			) : null}
		</div>
	)
}

export default TransparentImage
