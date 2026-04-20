import { useGetMovie } from "@seerial/api";
import type { DetailsData, LibraryType, Movie } from "@seerial/domain";
import { memo } from "react";
import { useLocation, useParams } from "react-router";
import MovieDetails from "@/features/details/movie/movie-details";

function MovieDetailsPage() {
	const { movieId } = useParams();
	const { state } = useLocation();
	const cachedDetails: DetailsData | undefined = state?.cachedDetails;
	const collectionId: string | undefined = state?.collectionId;
	const libraryType = state?.libraryType as LibraryType | undefined;

	const { data: movie, isLoading } = useGetMovie<Movie>(movieId ?? "", {
		enabled: !!movieId,
	});

	return (
		<MovieDetails
			movie={movie}
			isLoading={isLoading}
			details={cachedDetails}
			collectionId={collectionId}
			libraryType={libraryType}
		/>
	);
}

export default memo(MovieDetailsPage);
