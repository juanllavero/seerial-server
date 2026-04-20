import { useSetEpisodeWatchState } from "@seerial/api";
import type {
	DetailsData,
	Episode,
	LibraryType,
	Season,
	Series,
} from "@seerial/domain";
import { formatDate, formatTimeForView } from "@seerial/domain";
import { useServerStore } from "@seerial/stores";
import { useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { shallow } from "zustand/shallow";
import EpisodesList, {
	MAX_SKELETON_COUNT,
} from "@/features/details/series/components/episodes-list";
import SeasonSelector from "@/features/details/series/components/season-selector";
import DetailsWithRelatedContent from "@/features/details/shared/details-with-related-content";
import { useSeriesDetailsFocusStore } from "@/features/details/series/stores/series-details-focus.store";
import DetailsBackgroundLayers from "@/shared/components/details/details-background-layers";
import DetailsBackgroundPlayback from "@/shared/components/details/details-background-playback";
import DetailsInfo from "@/shared/components/details/details-info";
import Page from "@/shared/components/page";

interface SeriesDetailsProps {
	series: Series | undefined;
	isLoading: boolean;
	details: DetailsData | undefined;
	numberOfItems: number | undefined;
	currentSeasonNumber: number | undefined;
	collectionId?: string;
	libraryType?: LibraryType;
}

function SeriesDetails({
	series,
	isLoading,
	details,
	numberOfItems,
	currentSeasonNumber,
	collectionId,
	libraryType,
}: SeriesDetailsProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { currentUser } = useServerStore(
		(state) => ({
			currentUser: state.currentUser,
		}),
		shallow,
	);
	const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
	const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
	const [isRestoringEpisodeFocus, setIsRestoringEpisodeFocus] = useState(true);
	const [isBackgroundVideoVisible, setIsBackgroundVideoVisible] =
		useState(false);
	const backgroundImageSrc =
		details?.backgroundSrc ?? selectedSeason?.backgroundSrc ?? series?.coverSrc;

	const getLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
		(state) => state.getLastFocusedEpisodeForSeason,
	);
	const setLastFocusedEpisodeForSeason = useSeriesDetailsFocusStore(
		(state) => state.setLastFocusedEpisodeForSeason,
	);
	const { mutateAsync: setEpisodeWatchState, isPending: isUpdatingWatchState } =
		useSetEpisodeWatchState<unknown, { state: boolean }>(
			selectedEpisode?.id ?? "",
		);

	useEffect(() => {
		if (series && series.seasons?.length > 0) {
			const seasonToSelect = currentSeasonNumber
				? series.seasons.find(
						(season) => season.seasonNumber === currentSeasonNumber,
					)
				: series.seasons[0];
			setSelectedSeason(seasonToSelect ?? series.seasons[0]);
		}
	}, [series, currentSeasonNumber]);

	useEffect(() => {
		if (!selectedSeason) {
			setSelectedEpisode(null);
			setIsRestoringEpisodeFocus(false);
			return;
		}

		const sortedEpisodes = [...selectedSeason.episodes].sort(
			(a, b) => a.episodeNumber - b.episodeNumber,
		);

		if (sortedEpisodes.length === 0) {
			setSelectedEpisode(null);
			setIsRestoringEpisodeFocus(false);
			return;
		}

		const restoredEpisodeId = getLastFocusedEpisodeForSeason(selectedSeason.id);
		const restoredEpisode = restoredEpisodeId
			? sortedEpisodes.find((episode) => episode.id === restoredEpisodeId)
			: null;

		if (restoredEpisode) {
			setSelectedEpisode(restoredEpisode);
			setIsRestoringEpisodeFocus(true);
			return;
		}

		setSelectedEpisode(sortedEpisodes[0]);
		setIsRestoringEpisodeFocus(false);
	}, [selectedSeason, getLastFocusedEpisodeForSeason]);

	const handleSelectEpisode = useCallback(
		(episode: Episode) => {
			setSelectedEpisode(episode);
			setIsRestoringEpisodeFocus(false);

			if (selectedSeason) {
				setLastFocusedEpisodeForSeason(selectedSeason.id, episode.id);
			}
		},
		[selectedSeason, setLastFocusedEpisodeForSeason],
	);

	const handlePlay = useCallback(() => {
		if (selectedEpisode) {
			navigate(`/video-player/${selectedEpisode.video.id}`);
		}
	}, [selectedEpisode, navigate]);

	const isWatched =
		useMemo(() => {
			return (
				selectedEpisode?.video?.watchLists?.some(
					(watchList) =>
						watchList.userId === currentUser?.id && watchList.watched,
				) ?? false
			);
		}, [selectedEpisode, currentUser]) ?? false;

	const handleMarkWatched = useCallback(async () => {
		if (!series || !selectedEpisode || isUpdatingWatchState) {
			return;
		}

		await setEpisodeWatchState({ state: !isWatched });
		await queryClient.invalidateQueries({
			queryKey: ["series", "get", series.id],
		});
	}, [
		isUpdatingWatchState,
		isWatched,
		queryClient,
		selectedEpisode,
		series,
		setEpisodeWatchState,
	]);

	if (!isLoading && !series) return <span>Series not found</span>;

	return (
		<DetailsWithRelatedContent
			collectionId={collectionId}
			currentItemId={series?.id}
			currentItemType="series"
			libraryType={libraryType}
		>
			<Page
				justify="end"
				padding={
					series?.seasons && series?.seasons.length > 1 ? "0" : "0 0 5dvh 0"
				}
			>
				{!!series?.id && (
					<DetailsBackgroundPlayback
						audioLocalIds={[selectedSeason?.id, series.id]}
						videoLocalIds={[selectedSeason?.id, series.id]}
						onVideoVisibilityChange={setIsBackgroundVideoVisible}
					/>
				)}
				<DetailsBackgroundLayers
					imageSrc={backgroundImageSrc}
					isHidden={isBackgroundVideoVisible}
				/>
				<DetailsInfo
					details={details}
					subtitle={selectedEpisode?.name}
					infoItems={[
						selectedEpisode
							? `${t("seasonLetter")}${selectedEpisode.seasonNumber}${t("episodeLetter")}${selectedEpisode.episodeNumber}`
							: "",
						formatDate(
							selectedEpisode ? selectedEpisode.year : (series?.year ?? ""),
						),
						selectedEpisode
							? formatTimeForView(selectedEpisode.video.runtime ?? 0)
							: "",
					]}
					videoInfo={selectedEpisode?.video.videoTracks?.[0]?.displayTitle}
					audioInfo={
						selectedEpisode?.video.audioTracks?.[
							selectedEpisode.video.selectedAudioTrack ?? 0
						]?.displayTitle
					}
					subtitleInfo={
						selectedEpisode?.video.subtitleTracks?.[
							selectedEpisode.video.selectedSubtitleTrack ?? 0
						]?.displayTitle
					}
					handlePlay={handlePlay}
					handleMarkWatched={handleMarkWatched}
					isWatched={isWatched}
				/>
				<EpisodesList
					selectedSeason={selectedSeason}
					selectedEpisode={selectedEpisode}
					selectEpisode={handleSelectEpisode}
					isRestoringFocus={isRestoringEpisodeFocus}
					isLoading={isLoading || !selectedSeason}
					skeletonCount={numberOfItems ?? MAX_SKELETON_COUNT}
				/>
				<SeasonSelector
					seasons={series?.seasons ?? []}
					onSelectSeason={setSelectedSeason}
					selectedSeasonId={selectedSeason?.id}
				/>
			</Page>
		</DetailsWithRelatedContent>
	);
}

export default memo(SeriesDetails);
