/**
 * Fetches data from a given URL and returns the parsed JSON response.
 *
 * @param url - The URL to fetch data from.
 * @returns A promise that resolves to the parsed JSON data.
 */
export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const isAbsolutePath = (pathString: string): boolean => {
	const windowsPathRegex = /^[a-zA-Z]:[\\/]/
	const unixPathRegex = /^\//

	return windowsPathRegex.test(pathString) || unixPathRegex.test(pathString)
}

export const getImageUrl = (serverUrl: string, imageSrc: string) => {
	return imageSrc
		? imageSrc.startsWith('http')
			? imageSrc
			: imageSrc.startsWith('local')
				? imageSrc.replace('local', '')
				: isAbsolutePath(imageSrc)
					? `${serverUrl}/image?path=${encodeURIComponent(imageSrc)}`
					: `${serverUrl}/${imageSrc.replace('resources/img', 'img')}`
		: ''
}
