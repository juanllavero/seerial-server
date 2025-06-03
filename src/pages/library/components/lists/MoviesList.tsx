import { Collection, Library, Movie } from '@/data/interfaces/Media'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'

interface MoviesListProps {
  library: Library
}

function MoviesList({ library }: MoviesListProps) {
  // Get all movie IDs that are in any collection
  const collectionMovieIds = new Set(
    (library.collections || []).flatMap((collection: Collection) =>
      (collection.movies || []).map((movie: Movie) => movie.id),
    ),
  )

  // Filter movies to only include those not in any collection
  const standaloneMovies = (library.movies || []).filter(
    (movie: Movie) => !collectionMovieIds.has(movie.id),
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
          <MovieCard key={movie.id} movie={movie} />
        ))}
    </>
  )
}

export default MoviesList
