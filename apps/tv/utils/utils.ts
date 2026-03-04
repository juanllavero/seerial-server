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

export const getImageUrl = (
	serverUrl: string,
	imageSrc: string,
	width?: number,
	height?: number
) => {
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

//#region DATETIME
export const formatDate = (dateString: string): string => {
	const date = new Date(dateString)

	const monthOptions: Intl.DateTimeFormatOptions = { month: 'short' }

	const month = date.toLocaleString('en-US', monthOptions)
	const day = date.getDate()
	const year = date.getFullYear()

	return `${month} ${day}, ${year}`
}

export const formatTime = (time: number) => {
	const hours = Math.floor(time / 3600)
	const minutes = Math.floor((time % 3600) / 60)
	const seconds = Math.floor(time % 60)

	if (hours > 0) {
		return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
	}
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

export const formatTimeForView = (time: number) => {
	const hours = Math.floor(time / 60)
	const minutes = Math.floor(time % 60)

	if (hours > 0) {
		if (minutes > 0) {
			return `${hours}h ${minutes}m`
		} else {
			return `${hours}h`
		}
	} else {
		return `${minutes}m`
	}
}

export const getOnlyYear = (date: string) => {
	const year = new Date(date).getFullYear()
	return year
}
//#endregion
