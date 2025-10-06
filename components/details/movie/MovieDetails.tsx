import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React, { memo, useEffect } from 'react'
import { ScrollView } from 'react-native'
import useSWR from 'swr'
import MovieInfo from './MovieInfo'
import useDataStore from '@/context/data.context'

interface MovieDetailsProps {
	id: string
}

function MovieDetails({ id }: MovieDetailsProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const setCurrentBackground = useDataStore(
		(state) => state.setCurrentBackground
	)

	const { data: movie } = useSWR<Movie>(
		serverUrl ? `${serverUrl}/details/movie?id=${id}` : null,
		fetcher
	)

	useEffect(() => {
		if (movie && movie.backgroundSrc && movie.backgroundSrc !== '') {
			setCurrentBackground(movie.backgroundSrc)
		}
	}, [movie])

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
