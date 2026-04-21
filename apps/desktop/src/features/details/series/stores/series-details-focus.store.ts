import { createWithEqualityFn } from "zustand/traditional";

interface SeriesDetailsFocusState {
	lastFocusedEpisodeBySeason: Record<string, string>;
	setLastFocusedEpisodeForSeason: (seasonId: string, episodeId: string) => void;
	getLastFocusedEpisodeForSeason: (seasonId: string) => string | undefined;
}

export const useSeriesDetailsFocusStore =
	createWithEqualityFn<SeriesDetailsFocusState>((set, get) => ({
		lastFocusedEpisodeBySeason: {},

		setLastFocusedEpisodeForSeason(seasonId: string, episodeId: string) {
			set((state) => ({
				lastFocusedEpisodeBySeason: {
					...state.lastFocusedEpisodeBySeason,
					[seasonId]: episodeId,
				},
			}));
		},

		getLastFocusedEpisodeForSeason(seasonId: string) {
			return get().lastFocusedEpisodeBySeason[seasonId];
		},
	}));
