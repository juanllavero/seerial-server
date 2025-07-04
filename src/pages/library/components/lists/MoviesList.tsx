import { Collection, Library, Movie } from '@/data/interfaces/Media'
import { useMemo } from 'react'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'

interface MoviesListProps {
  library: Library
  mutateLibrary: () => void
}

function MoviesList({ library, mutateLibrary }: MoviesListProps) {
  // Get all movie IDs that are in any collection
  const collectionMovieIds = useMemo(
    () =>
      new Set(
        (library.collections || []).flatMap((collection: Collection) =>
          (collection.movies || []).map((movie: Movie) => movie.id),
        ),
      ),
    [library.collections],
  )

  // Filter movies to only include those not in any collection
  const standaloneMovies = useMemo(
    () =>
      (library.movies || []).filter(
        (movie: Movie) => !collectionMovieIds.has(movie.id),
      ),
    [library.movies, collectionMovieIds],
  )

  return (
    <>
      {library.collections &&
        library.collections.length > 0 &&
        library.collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            type={'Movies'}
          />
        ))}
      {standaloneMovies.length > 0 &&
        standaloneMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            mutateLibrary={mutateLibrary}
          />
        ))}
    </>
  )
}

export default MoviesList
