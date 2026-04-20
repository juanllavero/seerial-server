import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useEffect } from "react";
import FlexBox from "@/components/ui/FlexBox";
import { useKeyboardBack } from "@/shared/hooks/use-keyboard-back";
import { NavigationFocusKeys } from "@/shared/navigation/constants";
import DetailsActionButtons from "./details-action-buttons";
import DetailsHeader from "./details-header";
import type { DetailsInfoProps } from "./details-info.types";
import DetailsSummary from "./details-summary";
import DetailsTechnicalInfo from "./details-technical-info";

function DetailsInfo({
	details,
	subtitle,
	infoItems,
	durationInfo,
	timeWatchedInfo,
	handlePlay,
	handleMoreOptions,
	handleMarkWatched,
	isWatched,
	videoInfo,
	audioInfo,
	subtitleInfo,
	hideButtons,
	enableKeyboardBack = true,
}: DetailsInfoProps) {
	useKeyboardBack({ enabled: enableKeyboardBack });

	useEffect(() => {
		setFocus(NavigationFocusKeys.details.playButton);
	}, []);

	return (
		<FlexBox
			direction="column"
			justify="end"
			width={"100%"}
			className="z-10"
			padding="0 4rem"
		>
			<DetailsHeader details={details} subtitle={subtitle} />
			<DetailsSummary
				details={details}
				infoItems={infoItems}
				durationInfo={durationInfo}
				timeWatchedInfo={timeWatchedInfo}
				hideButtons={hideButtons}
			/>

			{!hideButtons && (
				<FlexBox
					className="flex-row"
					width={"100%"}
					justify="space-between"
					align="center"
					css={{
						paddingTop: 50,
						gap: 10,
					}}
				>
					<DetailsActionButtons
						handlePlay={handlePlay}
						handleMoreOptions={handleMoreOptions}
						handleMarkWatched={handleMarkWatched}
						isWatched={isWatched}
					/>
					<DetailsTechnicalInfo
						videoInfo={videoInfo}
						audioInfo={audioInfo}
						subtitleInfo={subtitleInfo}
					/>
				</FlexBox>
			)}
		</FlexBox>
	);
}

export default DetailsInfo;
