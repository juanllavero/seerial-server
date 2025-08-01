import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React, { memo } from 'react'
import { ScrollView } from 'react-native'
import useSWR from 'swr'
import MovieInfo from './MovieInfo'

interface MovieDetailsProps {
	id: string
}

function MovieDetails({ id }: MovieDetailsProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)

	const { data: movie } = useSWR<Movie>(
		serverUrl ? `${serverUrl}/details/movie?id=${id}` : null,
		fetcher
	)

	if (!movie) {
		return null
	}

	return (
		<ScrollView
			showsHorizontalScrollIndicator={false}
			className='w-full h-screen px-1'
		>
			{/* Movie Info */}
			<MovieInfo movie={movie} />
		</ScrollView>
	)
}

export default memo(MovieDetails)
