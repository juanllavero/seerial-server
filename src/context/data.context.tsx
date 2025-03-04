import { Library, Series, Season, Episode } from '@/data/interfaces/Media'
import { create } from 'zustand'

interface DataState {
  loadingLibraries: boolean
  libraries: Library[]
  selectedLibrary: Library | null
  selectedSeries: Series | null
  selectedSeason: Season | null
  selectedEpisode: Episode | null

  // Funciones de selección
  setLibraries: (libraries: Library[]) => void
  selectLibrary: (library: Library | null) => void
  selectSeries: (series: Series | null) => void
  selectSeason: (season: Season | null) => void
  selectEpisode: (episode: Episode | null) => void
  setLoadingLibraries: (loading: boolean) => void

  // Nueva función para modificar un episodio seleccionado
  updateSelectedEpisode: (updatedData: Partial<Episode>) => void
}

const useDataStore = create<DataState>((set) => ({
  libraries: [],

  loadingLibraries: false,
  selectedLibrary: null,
  selectedSeries: null,
  selectedSeason: null,
  selectedEpisode: null,

  setLoadingLibraries: (loading) => set({ loadingLibraries: loading }),

  selectLibrary: (library) =>
    set({
      selectedLibrary: library,
      selectedSeries: null,
      selectedSeason: null,
      selectedEpisode: null,
    }),

  selectSeries: (series) =>
    set((state) => ({
      selectedLibrary: state.selectedLibrary,
      selectedSeries: series,
      selectedSeason:
        series && series?.seasons.length > 0 ? series.seasons[0] : null,
      selectedEpisode: null,
    })),

  selectSeason: (season) =>
    set((state) => ({
      selectedLibrary: state.selectedLibrary,
      selectedSeries: state.selectedSeries,
      selectedSeason: season,
      selectedEpisode: null,
    })),

  selectEpisode: (episode) =>
    set((state) => ({
      selectedLibrary: state.selectedLibrary,
      selectedSeries: state.selectedSeries,
      selectedSeason: state.selectedSeason,
      selectedEpisode: episode,
    })),

  setLibraries: (payload: Library[]) =>
    set((state) => {
      state.libraries = payload

      if (state.selectedLibrary !== null) {
        let index = state.libraries.findIndex(
          (library) => library.id === state.selectedLibrary?.id,
        )

        if (index < 0) {
          index = 0
        }

        state.selectedLibrary = state.libraries[index]
      } else if (state.libraries.length > 0) {
        state.selectedLibrary = null
      }

      return state
    }),

  updateLibrary: (payload: Library) =>
    set((state) => {
      state.selectedLibrary = payload

      if (state.libraries.includes(payload)) {
        const libraries = state.libraries

        if (libraries) {
          // Update Library in list
          const libraryIndex = libraries.findIndex(
            (library) => library.id === payload.id,
          )

          if (libraryIndex >= 0) {
            libraries[libraryIndex] = payload
          }
        } else {
          state.libraries = [...state.libraries, payload]
        }
      }

      return state
    }),

  updateSelectedEpisode: (updatedData) =>
    set((state) => {
      if (!state.selectedEpisode) return state // Si no hay episodio seleccionado, no hacer nada

      const updatedEpisode = { ...state.selectedEpisode, ...updatedData }

      // Actualizar en libraries
      const updatedLibraries = state.libraries.map((library) => ({
        ...library,
        series: library.series.map((series) => ({
          ...series,
          seasons: series.seasons.map((season) => ({
            ...season,
            episodes: season.episodes.map((episode) =>
              episode.id === state.selectedEpisode?.id
                ? updatedEpisode
                : episode,
            ),
          })),
        })),
      }))

      return {
        libraries: updatedLibraries,
        selectedEpisode: updatedEpisode, // También actualizamos la referencia en el estado global
      }
    }),

  addSeason: (payload: { libraryId: string; season: Season }) =>
    set((state) => {
      const { libraryId, season } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)

      if (library && library.series) {
        const series = library.series.find((s) => s.id === season.seriesID)

        if (series) {
          if (!series.seasons) {
            series.seasons = []
          }

          if (!series.seasons.find((s) => s.id === season.id)) {
            series.seasons = [...series.seasons, season]

            // Actualizar selección si es necesario
            const newState = {
              libraries: [...state.libraries],
              selectedSeries:
                state.selectedSeries?.id === season.seriesID
                  ? series
                  : state.selectedSeries,
              selectedSeason: state.selectedSeason
                ? state.selectedSeason
                : series.seasons[0],
              selectedLibrary:
                state.selectedLibrary?.id === library.id
                  ? library
                  : state.selectedLibrary,
            }

            return newState
          }
        }

        if (state.selectedLibrary?.id === library.id) {
          state.selectedLibrary = library
        }
      }

      return state
    }),

  updateSeason: (payload: Season) =>
    set((state) => {
      const { seriesID, id } = payload
      const library = state.selectedLibrary

      if (library) {
        const series = library.series.find((s) => s.id === seriesID)

        if (series) {
          const seasonIndex = series.seasons.findIndex(
            (season) => season.id === id,
          )

          if (seasonIndex >= 0) {
            series.seasons[seasonIndex] = payload

            const newState = {
              libraries: [...state.libraries],
              selectedSeries:
                state.selectedSeries?.id === series.id
                  ? series
                  : state.selectedSeries,
              selectedSeason:
                state.selectedSeason?.id === payload.id
                  ? payload
                  : state.selectedSeason,
              selectedLibrary:
                state.selectedLibrary?.id === library.id
                  ? library
                  : state.selectedLibrary,
            }

            return newState
          }
        }
      }

      return state
    }),

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

  addSeries: (payload: { libraryId: string; series: Series }) =>
    set((state) => {
      const { libraryId, series } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)

      if (library && !library.series.find((s) => s.id === series.id)) {
        library.series = [...library.series, series]

        // Actualizar selección si es necesario
        const newState = {
          libraries: [...state.libraries],
          selectedLibrary:
            state.selectedLibrary?.id === library.id
              ? library
              : state.selectedLibrary,
        }

        return newState
      }

      return state
    }),

  updateSeries: (payload: { libraryId: string; series: Series }) =>
    set((state) => {
      const { libraryId, series } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)

      if (library) {
        const existingSeries = library.series.find((s) => s.id === series.id)

        if (existingSeries) {
          // Actualizar la serie
          Object.assign(existingSeries, series)

          // Sincronizar la selección si es necesario
          const newState = {
            libraries: [...state.libraries],
            selectedSeries:
              state.selectedSeries?.id === existingSeries.id
                ? existingSeries
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

  // Función para agregar un episodio
  addEpisode: (payload: {
    libraryId: string
    showId: string
    episode: Episode
  }) =>
    set((state) => {
      const { libraryId, showId, episode } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)
      if (library) {
        const series = library.series.find((s) => s.id === showId)
        if (series) {
          const season = series.seasons.find((s) => s.id === episode.seasonID)
          if (season) {
            if (!season.episodes) {
              season.episodes = []
            }
            if (!season.episodes.find((ep) => ep.id === episode.id)) {
              season.episodes.push(episode)

              // Actualizar selección si es necesario
              const newState = {
                libraries: [...state.libraries],
                selectedSeason:
                  state.selectedSeason?.id === episode.seasonID
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
          }
        }
      }
      return state
    }),

  // Función para actualizar un episodio
  updateEpisode: (payload: {
    libraryId: string
    showId: string
    episode: Episode
  }) =>
    set((state) => {
      const { libraryId, showId, episode } = payload
      const library = state.libraries.find((lib) => lib.id === libraryId)
      if (library) {
        const series = library.series.find((s) => s.id === showId)
        if (series) {
          const season = series.seasons.find((s) => s.id === episode.seasonID)
          if (season) {
            const episodeIndex = season.episodes.findIndex(
              (ep) => ep.id === episode.id,
            )
            if (episodeIndex >= 0) {
              season.episodes[episodeIndex] = episode

              // Actualizar selección si es necesario
              const newState = {
                libraries: [...state.libraries],
                selectedEpisode:
                  state.selectedEpisode?.id === episode.id
                    ? episode
                    : state.selectedEpisode,
                selectedSeason:
                  state.selectedSeason?.id === episode.seasonID
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
          }
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
}))

export default useDataStore
