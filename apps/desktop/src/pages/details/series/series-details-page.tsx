import { useGetSeries } from "@seerial/api";
import type { DetailsData, Series } from "@seerial/domain";
import { memo } from "react";
import { useLocation, useParams } from "react-router";
import SeriesDetails from "@/features/details/series/series-details";

function SeriesDetailsPage() {
	const { seriesId } = useParams();
	const { state } = useLocation();
	const cachedDetails: DetailsData | undefined = state?.cachedDetails;
	const numberOfItems: number | undefined = state?.numberOfItems;
	const currentSeasonNumber: number | undefined = state?.currentSeasonNumber;

	const { data: show, isLoading } = useGetSeries<Series>(seriesId ?? "", {
		enabled: !!seriesId,
		params: {
			include: "all",
		},
	});

	return (
		<SeriesDetails
			series={show}
			isLoading={isLoading}
			details={cachedDetails}
			numberOfItems={numberOfItems}
			currentSeasonNumber={currentSeasonNumber}
		/>
	);
}

export default memo(SeriesDetailsPage);
