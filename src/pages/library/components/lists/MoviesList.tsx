import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Collection, Movie } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'

interface MoviesListProps {
  libraryId: string
}

function MoviesList({ libraryId }: MoviesListProps) {
  const { serverIP } = useServerStore()
  const { data: moviesList, isLoading: loadingMovies } = useSWR<Movie[]>(
    libraryId ? `http://${serverIP}/movies?libraryId=${libraryId}` : null,
    fetcher,
  )
  const { data: collectionList, isLoading: loadingCollections } = useSWR<
    Collection[]
  >(
    libraryId ? `http://${serverIP}/collections?libraryId=${libraryId}` : null,
    fetcher,
  )

  if (loadingCollections || loadingMovies) {
    return <Loading />
  }

  return (
    <>
      {collectionList?.map((collection) => (
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
