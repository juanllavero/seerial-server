import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import type { Episode } from "@seerial/domain";
import { useNavigate } from "react-router";
import Image from "@/components/ui/Image";
import { useSettingsStore } from "@/features/settings/stores/settings.store";

interface EpisodeCardProps {
	episode: Episode;
	selectedEpisodeId?: string;
	outOfFocus?: boolean;
	onFocus?: (episode: Episode) => void;
	onArrowPress?: (direction: string) => boolean | undefined;
}

function EpisodeCard({
	episode,
	selectedEpisodeId,
	outOfFocus,
	onFocus,
	onArrowPress,
}: EpisodeCardProps) {
	const navigate = useNavigate();
	const { cardRoundness } = useSettingsStore((state) => ({
		cardRoundness: state.settings.cardRoundness,
	}));
	const { ref, focused } = useFocusable({
		focusKey: episode.id,
		onFocus: () => onFocus?.(episode),
		onEnterPress: handlePlay,
		onArrowPress: onArrowPress
			? (direction) => onArrowPress(direction) ?? true
			: undefined,
	});

	function handlePlay() {
		navigate(`/video-player/${episode.video.id}`);
	}

	return (
		<div
			ref={ref}
			data-focus-key={episode.id}
			className={`shrink-0 p-0 ${outOfFocus && selectedEpisodeId !== episode.id ? "opacity-50" : ""}
      ${cardRoundness} scale-95 border-2 border-transparent transition-all duration-350 ${focused ? "transform scale-100 border-white" : ""}`}
			style={{
				height: "22vh",
			}}
		>
			<Image
				url={episode.video.imgSrc}
				height="100%"
				width="100%"
				className={`h-full w-full ${cardRoundness}`}
				aspectRatio="16/9"
			/>
		</div>
	);
}

export default EpisodeCard;
