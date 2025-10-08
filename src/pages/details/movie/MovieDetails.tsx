import Loading from '@/components/Loading'
import Page from '@/components/Page'
import { useServerStore } from '@/context/server.context'
import { Movie, Video } from '@/data/interfaces/Media'
import { memo, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import { authenticatedFetcher } from '@/lib/auth'
import DetailsInfo from '../components/DetailsInfo'
import { formatDate, formatTimeForView } from '@/utils/utils'

function MovieDetails() {
	const { movieId } = useParams()
	const { serverUrl } = useServerStore(
		(state) => ({
			serverUrl: state.serverUrl,
		}),
		shallow
	)
	const [selectedVideo, selectVideo] = useState<Video | null>(null)

	const { data: movie, isLoading } = useSWR<Movie>(
		serverUrl !== '' ? `${serverUrl}/details/movie?id=${movieId}` : null,
		authenticatedFetcher
	)

	useEffect(() => {
		if (movie && movie.videos.length > 0) {
			selectVideo(movie.videos[0])
		}
	}, [movie])

	if (isLoading) {
		return <Loading />
	}

	if (!movie) return <span>Movie not found</span>

	return (
		<Page padding='0 2rem' justify='end'>
			<DetailsInfo
				title={movie.name}
				logoUrl={movie.logoSrc}
				subtitle={selectedVideo?.title}
				tagline={movie.tagline}
				score={movie.score}
				genres={movie.genres}
				directedBy={movie.directedBy}
				infoItems={[
					formatDate(movie.year),
					selectedVideo
						? formatTimeForView(selectedVideo.runtime ?? 0)
						: '',
				]}
				overview={movie.overview}
			/>
			{/* {movie.videos && movie.videos.length > 1 && (
				<VideosList
					selectedVideo={selectedVideo}
					selectVideo={selectVideo}
				/>
			)} */}
		</Page>
	)
}

export default memo(MovieDetails)
