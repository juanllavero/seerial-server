import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Library, Movie } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'

interface MoviesListProps {
  library: Library
}

function MoviesList({ library }: MoviesListProps) {
  const { serverIP } = useServerStore()
  const { data: moviesList, isLoading: loadingMovies } = useSWR<Movie[]>(
    library ? `http://${serverIP}/movies?libraryId=${library.id}` : null,
    fetcher,
  )

  if (loadingMovies) {
    return <Loading />
  }

  return (
    <>
      {library.collections &&
        library.collections.length > 0 &&
        library.collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            type={'Shows'}
          />
        ))}
      {moviesList?.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
    </>
  )
}

export default MoviesList
