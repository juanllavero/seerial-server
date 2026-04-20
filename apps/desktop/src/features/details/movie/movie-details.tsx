import { useSetMovieWatchState } from "@seerial/api";
import {
	type DetailsData,
	formatDate,
	formatTimeForView,
	type Movie,
	type Video,
} from "@seerial/domain";
import { useServerStore } from "@seerial/stores";
import { useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { shallow } from "zustand/shallow";
import DetailsBackgroundLayers from "@/shared/components/details/details-background-layers";
import DetailsBackgroundPlayback from "@/shared/components/details/details-background-playback";
import DetailsInfo from "@/shared/components/details/details-info";
import Page from "@/shared/components/page";

interface MovieDetailsProps {
	movie: Movie | undefined;
	isLoading: boolean;
	details: DetailsData | undefined;
	numberOfItems: number | undefined;
}

function MovieDetails({
	movie,
	isLoading,
	details,
	numberOfItems,
}: MovieDetailsProps) {
	const [selectedVideo, selectVideo] = useState<Video | null>(null);
	const [isBackgroundVideoVisible, setIsBackgroundVideoVisible] =
		useState(false);
	const backgroundImageSrc =
		details?.backgroundSrc ?? movie?.backgroundSrc ?? movie?.coverSrc;
	const queryClient = useQueryClient();
	const { currentUser } = useServerStore(
		(state) => ({
			currentUser: state.currentUser,
		}),
		shallow,
	);
	const navigate = useNavigate();
	const { mutateAsync: setMovieWatchState, isPending: isUpdatingWatchState } =
		useSetMovieWatchState<unknown, { watched: boolean }>(movie?.id ?? "");

	useEffect(() => {
		if (movie && movie.videos.length > 0) {
			selectVideo(movie.videos[0]);
		}
	}, [movie]);

	const handlePlay = useCallback(() => {
		if (selectedVideo) {
			navigate(`/video-player/${selectedVideo.id}`);
		}
	}, [navigate, selectedVideo]);

	const isWatched = useMemo(() => {
		return (
			movie?.watchLists?.some(
				(watchList) =>
					watchList.userId === currentUser?.id && watchList.watched,
			) ?? false
		);
	}, [movie, currentUser]);

	const handleMarkWatched = useCallback(async () => {
		if (!movie || isUpdatingWatchState) {
			return;
		}

		await setMovieWatchState({ watched: !isWatched });
		await queryClient.invalidateQueries({
			queryKey: ["movies", "get", movie.id],
		});
	}, [movie, isUpdatingWatchState, isWatched, queryClient, setMovieWatchState]);

	if (!isLoading && !movie) return <span>Movie not found</span>;

	return (
		<Page justify="end" padding="4dvh 0">
			{!!movie?.id && (
				<DetailsBackgroundPlayback
					audioLocalIds={[movie.id]}
					videoLocalIds={[movie.id]}
					onVideoVisibilityChange={setIsBackgroundVideoVisible}
				/>
			)}
			<DetailsBackgroundLayers
				imageSrc={backgroundImageSrc}
				isHidden={isBackgroundVideoVisible}
			/>
			<DetailsInfo
				details={details}
				subtitle={
					movie?.videos && movie.videos.length > 1
						? selectedVideo?.title
						: undefined
				}
				infoItems={[
					formatDate(details?.year ?? movie?.year ?? ""),
					selectedVideo ? formatTimeForView(selectedVideo.runtime ?? 0) : "",
				]}
				handlePlay={handlePlay}
				handleMarkWatched={handleMarkWatched}
				isWatched={isWatched}
			/>
			{/* {movie.videos && movie.videos.length > 1 && (
				<VideosList
					selectedVideo={selectedVideo}
					selectVideo={selectVideo}
				/>
			)} */}
		</Page>
	);
}

export default memo(MovieDetails);
