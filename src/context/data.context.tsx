import {
  Collection,
  Episode,
  Library,
  Movie,
  Season,
  Series,
  Video,
} from '@/data/interfaces/Media'
import { Album, Song } from '@/data/interfaces/Music'
import { create } from 'zustand'

interface DataState {
  selectedLibrary: Library | null
  selectdCollection: Collection | null
  selectedMovie: Movie | null
  selectedSeries: Series | null
  selectedSeason: Season | null
  selectedEpisode: Episode | null
  selectedVideo: Video | null
  selectedAlbum: Album | null
  selectedSong: Song | null

  // GET
  selectLibrary: (library: Library | null) => void
  selectCollection: (collection: Collection | null) => void
  selectMovie: (movie: Movie | null) => void
  selectSeries: (series: Series | null) => void
  selectSeason: (season: Season | null) => void
  selectEpisode: (episode: Episode | null) => void
  selectVideo: (video: Video | null) => void
  selectAlbum: (album: Album | null) => void
  selectSong: (song: Song | null) => void

  // Utils
  // setSeasonWatched: (payload: {
  //   libraryId: string
  //   seriesId: string
  //   seasonId: string
  //   watched: boolean
  // }) => void
  // setSeriesWatched: (payload: {
  //   libraryId: string
  //   seriesId: string
  //   watched: boolean
  // }) => void
  // markEpisodeWatched: (payload: {
  //   libraryId: string
  //   seriesId: string
  //   seasonId: string
  //   episodeId: string
  //   watched: boolean
  // }) => void
}

const useDataStore = create<DataState>((set) => ({
  selectedLibrary: null,
  selectdCollection: null,
  selectedMovie: null,
  selectedSeries: null,
  selectedSeason: null,
  selectedEpisode: null,
  selectedVideo: null,
  selectedAlbum: null,
  selectedSong: null,

  selectLibrary(library: Library | null) {
    set(() => ({
      selectedLibrary: library,
    }))
  },

  selectCollection(collection: Collection | null) {
    set(() => ({
      selectdCollection: collection,
    }))
  },

  selectMovie(movie: Movie | null) {
    set(() => ({
      selectedMovie: movie,
    }))
  },

  selectSeries(series: Series | null) {
    set(() => ({
      selectedSeries: series,
    }))
  },

  selectSeason(season: Season | null) {
    set(() => ({
      selectedSeason: season,
    }))
  },

  selectEpisode(episode: Episode | null) {
    set(() => ({
      selectedEpisode: episode,
    }))
  },

  selectVideo(video: Video | null) {
    set(() => ({
      selectedVideo: video,
    }))
  },

  selectAlbum(album: Album | null) {
    set(() => ({
      selectedAlbum: album,
    }))
  },

  selectSong(song: Song | null) {
    set(() => ({
      selectedSong: song,
    }))
  },

  /*
  setSeasonWatched: (payload: {
    libraryId: string
    seriesId: string
    seasonId: string
    watched: boolean
  }) =>
    set((state) => {
      const { libraryId, seriesId, seasonId, watched } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)

      if (library) {
        const series = library.series.find((s) => s.id === seriesId)

        if (series) {
          const seasons = series.seasons.sort((a, b) => {
            if (a.order !== 0 && b.order !== 0) {
              return a.order - b.order
            }
            if (a.order === 0 && b.order === 0) {
              return new Date(a.year).getTime() - new Date(b.year).getTime()
            }
            return a.order === 0 ? 1 : -1
          })

          let isWatched = true
          let found = false

          for (const season of seasons) {
            if (season.id === seasonId) {
              season.currentlyWatchingEpisode = -1
              season.watched = watched
              found = true

              for (const episode of season.episodes) {
                episode.watched = watched
              }
            } else {
              if (!found) {
                season.currentlyWatchingEpisode = -1
              }

              for (const episode of season.episodes) {
                episode.watched = !found ? true : false
              }
            }

            if (season.currentlyWatchingEpisode !== -1) {
              series.currentlyWatchingSeason = seasons.indexOf(season)
            }

            if (state.selectedSeason?.id === season.id) {
              state.selectedSeason = season
            }

            if (!season.watched) isWatched = false
          }

          series.watched = isWatched

          const newState = {
            libraries: [...state.libraries],
            selectedSeries:
              state.selectedSeries?.id === series.id
                ? series
                : state.selectedSeries,
            selectedLibrary:
              state.selectedLibrary?.id === library.id
                ? library
                : state.selectedLibrary,
          }

          return newState
        }
      }

      return state
    }),

  setSeriesWatched: (payload: {
    libraryId: string
    seriesId: string
    watched: boolean
  }) =>
    set((state) => {
      const { libraryId, seriesId, watched } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)

      if (library) {
        const series = library.series.find((s) => s.id === seriesId)

        if (series) {
          for (const season of series.seasons) {
            for (const episode of season.episodes) {
              episode.watched = watched
            }

            season.currentlyWatchingEpisode = -1
            season.watched = watched

            if (state.selectedSeason?.id === season.id) {
              state.selectedSeason = season
            }
          }

          series.currentlyWatchingSeason = -1
          series.watched = watched

          if (state.selectedSeries?.id === series.id) {
            state.selectedSeries = series
          }

          // Sincronizar la selección de la biblioteca
          const newState = {
            libraries: [...state.libraries],
            selectedLibrary:
              state.selectedLibrary?.id === library.id
                ? library
                : state.selectedLibrary,
          }

          return newState
        }
      }

      return state
    }),

  // Función para marcar un episodio como visto/no visto
  markEpisodeWatched: (payload: {
    libraryId: string
    seriesId: string
    seasonId: string
    episodeId: string
    watched: boolean
  }) =>
    set((state) => {
      const { libraryId, seriesId, seasonId, episodeId, watched } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)
      if (!library) return state

      const series = library.series.find((s) => s.id === seriesId)
      if (!series) return state

      const season = series.seasons.find((s) => s.id === seasonId)
      if (!season) return state

      const episode = season.episodes.find((ep) => ep.id === episodeId)
      if (episode) {
        episode.watched = watched
        if (!watched) {
          episode.timeWatched = 0
        }

        const newState = {
          libraries: [...state.libraries],
          selectedEpisode:
            state.selectedEpisode?.id === episode.id
              ? episode
              : state.selectedEpisode,
          selectedSeason:
            state.selectedSeason?.id === season.id
              ? season
              : state.selectedSeason,
          selectedSeries:
            state.selectedSeries?.id === series.id
              ? series
              : state.selectedSeries,
          selectedLibrary:
            state.selectedLibrary?.id === library.id
              ? library
              : state.selectedLibrary,
        }

        return newState
      }
      return state
    }),
    */
}))

export default useDataStore
