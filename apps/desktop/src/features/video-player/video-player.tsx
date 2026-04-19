import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { Video } from "@seerial/domain";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import NavigationContainer from "@/components/navigation/NavigationContainer";
import FlexBox from "@/components/ui/FlexBox";
import Controls from "@/pages/videoplayer/components/controls/controls";
import VolumeIndicator from "@/pages/videoplayer/components/controls/volume-slider";
import { usePlayerSettings } from "@/pages/videoplayer/hooks/use-player-settings";
import { useVolumeIndicator } from "@/pages/videoplayer/hooks/use-volume-indicator";
import { useKeyboardBack } from "@/shared/hooks/use-keyboard-back";
import { usePlayerControlsVisibility } from "@/shared/hooks/use-player-controls-visibility";
import { NavigationFocusKeys } from "@/shared/navigation/constants";

interface VideoPlayerProps {
	video: Video;
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
	const [isTimelineFocused, setIsTimelineFocused] = useState(false);
	const [tracksPanelOpen, setTracksPanelOpen] = useState(false);

	const playerInputEnabled = !tracksPanelOpen;

	const { settings, updateSetting } = usePlayerSettings();
	const { volume, visible: volumeVisible } = useVolumeIndicator({
		enabled: playerInputEnabled,
	});

	// Handle back navigation with a pre-action to stop the video before navigating back
	useKeyboardBack({
		preAction: () => {
			invoke("stop");
			invoke("embed_mpv").catch(console.error);
		},
		enabled: playerInputEnabled,
	});

	const handleTogglePlayPause = useCallback(() => {
		invoke("toggle_play_pause").catch(console.error);
	}, []);

	const handleResumeIfPaused = useCallback(() => {
		invoke("play").catch(console.error);
	}, []);

	const { mode, isVisible } = usePlayerControlsVisibility({
		isTimelineFocused,
		enabled: playerInputEnabled,
		onTogglePlayPause: handleTogglePlayPause,
		onResumeIfPaused: handleResumeIfPaused,
	});

	// Set initial focus on the timeline when controls become fully visible
	const isFull = mode === "full";
	const isCompact = mode === "compact";
	useEffect(() => {
		if (isFull || isCompact) {
			setFocus(NavigationFocusKeys.player.timeline);
		}
	}, [isFull, isCompact]);

	const handleTimelineFocusChange = useCallback((focused: boolean) => {
		setIsTimelineFocused(focused);
	}, []);

	const handleTracksPanelChange = useCallback((open: boolean) => {
		setTracksPanelOpen(open);
	}, []);

	return (
		<NavigationContainer customFocusKey={NavigationFocusKeys.player.container}>
			<VolumeIndicator volume={volume} visible={volumeVisible} />
			<FlexBox
				className="absolute w-full h-full"
				css={{
					backgroundColor: isVisible ? "rgba(0, 0, 0, 0.3)" : "transparent",
					transition: "background-color 0.3s ease",
				}}
				width={"100%"}
				height={"100%"}
				justify="end"
				direction="column"
			>
				<FlexBox
					width={"100%"}
					padding="1rem"
					justify="center"
					align="center"
					css={{
						background: isVisible
							? "linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 3%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0) 100%)"
							: "transparent",
						visibility: isVisible ? "visible" : "hidden",
						pointerEvents: isVisible ? "auto" : "none",
					}}
				>
					<Controls
						video={video}
						controlsMode={mode}
						onTimelineFocusChange={handleTimelineFocusChange}
						onTracksPanelChange={handleTracksPanelChange}
						settings={settings}
						updateSetting={updateSetting}
					/>
				</FlexBox>
			</FlexBox>
		</NavigationContainer>
	);
}
