import { useState, useEffect } from 'react'
import { getColors, ImageColorsResult } from 'react-native-image-colors'

export const useImageColors = (uri: string) => {
	const [colors, setColors] = useState<ImageColorsResult | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!uri) {
			setIsLoading(false)
			return
		}

		setIsLoading(true)

		getColors(uri, {
			fallback: '#171717',
			cache: true,
			key: uri,
		})
			.then(setColors)
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [uri])

	return { colors, isLoading }
}
