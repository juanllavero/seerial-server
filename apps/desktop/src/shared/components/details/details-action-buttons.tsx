import { Ellipsis, PlayIcon, RotateCcw } from "lucide-react";
import NavigationButton from "@/components/navigation/NavigationButton";
import FlexBox from "@/components/ui/FlexBox";
import {
	MarkWatchedIcon,
	UnmarkWatchedIcon,
} from "@/components/ui/IconLibrary";
import { useRelatedContent } from "@/features/details/shared/related-content-context";
import { NavigationFocusKeys } from "@/shared/navigation/constants";

interface DetailsActionButtonsProps {
	handlePlay?: () => void;
	handleMoreOptions?: () => void;
	handleMarkWatched?: () => void;
	isWatched?: boolean;
}

function DetailsActionButtons({
	handlePlay,
	handleMoreOptions,
	handleMarkWatched,
	isWatched,
}: DetailsActionButtonsProps) {
	const { navigateToRelated, hasRelatedContent } = useRelatedContent();
	return (
		<FlexBox gap={1}>
			<NavigationButton
				customKey={NavigationFocusKeys.details.playButton}
				text={"Reproducir"}
				icon={
					<PlayIcon size={"3dvh"} fill="currentColor" stroke="currentColor" />
				}
				onClick={handlePlay}
				hideText
				animateText
			/>
			<NavigationButton
				customKey={NavigationFocusKeys.details.playFromStartButton}
				text={"Reproducir desde el principio"}
				icon={<RotateCcw size={"3dvh"} stroke="currentColor" />}
				onClick={handleMarkWatched}
				hideText
				animateText
			/>
			<NavigationButton
				customKey={NavigationFocusKeys.details.markWatchedButton}
				text={isWatched ? "Desmarcar como visto" : "Marcar como visto"}
				icon={isWatched ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
				onClick={handleMarkWatched}
				hideText
				animateText
			/>
			<NavigationButton
				customKey={NavigationFocusKeys.details.optionsButton}
				text={"Más"}
				icon={<Ellipsis size={"3dvh"} />}
				onClick={handleMoreOptions}
				onArrowPress={
					hasRelatedContent
						? (direction) => {
								if (direction === "right") {
									navigateToRelated();
									return false;
								}
								return true;
							}
						: undefined
				}
				hideText
				animateText
			/>
		</FlexBox>
	);
}

export default DetailsActionButtons;
