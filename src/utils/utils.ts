import { extractColors } from 'extract-colors'
import { Video } from '../data/interfaces/Media'

/**
 * Fetches data from a given URL and returns the parsed JSON response.
 *
 * @param url - The URL to fetch data from.
 * @returns A promise that resolves to the parsed JSON data.
 */
export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export let colors: string[] = []

export const extractColorsFromImage = async (imgSrc: string) => {
	try {
		const options = {
			pixels: 50000, // Reduce the number of pixels to analyze to focus on prominent colors
			distance: 0.15, // Reduce color distance to get less variety
			saturationDistance: 0.5, // Reduce saturation distance to get less vibrant colors
			lightnessDistance: 0.12, // Reduce lightness distance to get darker colors
			hueDistance: 0.05, // Reduce hue distance to get colors closer to each other
		}

		const extractedColors = await extractColors(imgSrc, options)

		const dominantColors = extractedColors
			.slice(0, 5)
			.map((color) => color.hex)
		return dominantColors
	} catch (error) {
		console.error('Error al extraer colores:', error)
		return undefined
	}
}

export const getDominantColors = async (imgSrc: string) => {
	const dominantColors = await extractColorsFromImage(imgSrc)

	if (dominantColors) colors = dominantColors
}

export const getGradientBackground = () => {
	if (colors.length >= 4) {
		//return `linear-gradient(to top right, ${this.colors.join(", ")})`;
		//return `linear-gradient(to bottom, ${this.colors[0]} 0%, ${this.colors[1]} 100%)`;
		return `radial-gradient(circle farthest-side at 0% 100%, ${colors[1]} 0%, rgba(48, 66, 66, 0) 100%),
                radial-gradient(circle farthest-side at 100% 100%, ${colors[0]} 0%, rgba(63, 77, 69, 0) 100%),
                radial-gradient(circle farthest-side at 100% 0%, ${colors[2]} 0%, rgba(33, 36, 33, 0) 100%),
                radial-gradient(circle farthest-side at 0% 0%, ${colors[3]} 0%, rgba(65, 77, 66, 0) 100%),
                black
                `
	}
	return 'none'
}

export const generateGradient = (
	background: string | undefined,
	serverIP: string
) => {
	if (background) {
		const imageUrl = background.startsWith('http')
			? background
			: `https://${serverIP}/${background.replace('resources/img', 'img')}`

		getDominantColors(imageUrl)
	} else {
		getDominantColors('/img/songDefault.png')
	}
}

/**
 * This method is used to delay the execution of a function by a certain amount of milliseconds.
 * @param ms - Number of milliseconds to delay
 * @returns
 */
export const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

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
	const minutes = Math.floor(time / 60)
	const seconds = Math.floor(time % 60)
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

export const getAudioTrack = (prefAudioLan: string, video: Video) => {
	if (!video.audioTracks || video.audioTracks.length === 0) return null

	if (
		video.selectedAudioTrack &&
		video.selectedAudioTrack !== -1 &&
		video.selectedAudioTrack < video.audioTracks.length
	) {
		return video.audioTracks[video.selectedAudioTrack]
	} else {
		if (prefAudioLan !== '') {
			const track = video.audioTracks.find(
				(track) => track.language === prefAudioLan
			)
			if (track) return track
		}

		return video.audioTracks[0]
	}
}

export const getSubtitleTrack = (
	prefSubsLan: string,
	subsMode: string,
	video: Video
) => {
	if (!video.subtitleTracks || video.subtitleTracks.length === 0) return null

	if (
		video.selectedSubtitleTrack &&
		video.selectedSubtitleTrack !== -1 &&
		video.selectedSubtitleTrack < video.subtitleTracks.length
	) {
		return video.subtitleTracks[video.selectedSubtitleTrack]
	} else {
		switch (subsMode) {
			case 'autoSubs':
				return (
					video.subtitleTracks.find(
						(track) => track.language === prefSubsLan
					) ?? null
				)
			case 'alwaysSubs':
				return (
					video.subtitleTracks.find(
						(track) => track.language === prefSubsLan
					) ?? null
				)
			default:
				return null
		}
	}
}
