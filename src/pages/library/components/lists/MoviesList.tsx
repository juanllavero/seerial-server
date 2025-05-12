import { Library } from '@/data/interfaces/Media'
import React from 'react'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'

interface MoviesListProps {
  library: Library
}

function MoviesList({ library }: MoviesListProps) {
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
      {library.movies &&
        library.movies.length > 0 &&
        library.movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
    </>
  )
}

export default MoviesList
