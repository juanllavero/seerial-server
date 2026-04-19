import {
	setFocus,
	useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
	AudioLines,
	Ellipsis,
	Languages,
	List,
	MicVocal,
	PauseIcon,
	PlayIcon,
	SquareIcon,
} from "lucide-react";
import {
	type Dispatch,
	memo,
	type ReactNode,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import NavigationButton from "@/components/navigation/NavigationButton";
import FlexBox from "@/components/ui/FlexBox";
import { Slider } from "@/components/ui/slider";
import LyricsOptionsMenu from "@/features/music-player/lyrics-options-menu";
import TimelineSlider from "@/pages/videoplayer/components/controls/timeline-slider";
import Loading from "@/shared/components/loading";
import { NavigationFocusKeys } from "@/shared/navigation/constants";
import QueueMenu from "./queue-menu";

const TEST_BACKGROUND_STYLE: "classic" | "background" = "classic";

const KARAOKE_MIX_MIN = -10;
const KARAOKE_MIX_MAX = 10;
const PLAYER_CONTROLS_AUTO_HIDE_MS = 5000;

interface KaraokeMixSliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
}

interface MusicPlayerControlsProps {
	t: (key: string) => string;
	renderSongInfo: () => ReactNode;
	isExpanded: boolean;
	isShown: boolean;
	isPlaying: boolean;
	isLoading: boolean;
	currentTime: number;
	playerDuration: number;
	setCurrentTime: (time: number) => void;
	setDuration: (duration: number) => void;
	togglePlayPause: () => Promise<void>;
	getActivePlaybackPosition: () => Promise<number>;
	getActivePlaybackDuration: () => Promise<number>;
	setActivePlaybackPosition: (position: number) => Promise<void>;
	handleStop: () => void;
	showLyrics: boolean;
	isLyricsButtonDisabled: boolean;
	setShowLyrics: (showLyrics: boolean) => void;
	isLyricsOptionsOpen: boolean;
	setIsLyricsOptionsOpen: Dispatch<SetStateAction<boolean>>;
	isLyricsOptionsButtonDisabled: boolean;
	hasLyrics: boolean;
	hasPronunciation: boolean;
	showPronunciation: boolean;
	hasTranslation: boolean;
	showTranslation: boolean;
	setShowPronunciation: Dispatch<SetStateAction<boolean | null>>;
	setShowTranslation: (value: boolean) => void;
	closeLyricsOptions: (restoreFocus?: boolean) => void;
	shouldShowKaraokeButton: boolean;
	isKaraokePreparing: boolean;
	isKaraokeActive: boolean;
	isKaraokeReady: boolean;
	isKaraokeAvailable: boolean;
	karaokeMix: number;
	showKaraokeMixer: boolean;
	setShowKaraokeMixer: Dispatch<SetStateAction<boolean>>;
	handleKaraokeMixChange: (value: number) => Promise<void>;
	isQueueMenuOpen: boolean;
	setIsQueueMenuOpen: Dispatch<SetStateAction<boolean>>;
}

function KaraokeMixSlider({ label, value, onChange }: KaraokeMixSliderProps) {
	const { ref, focused } = useFocusable({
		focusKey: NavigationFocusKeys.player.karaokeSlider,
		onArrowPress: (direction) => {
			if (direction === "left") {
				onChange(value - 1);
				return false;
			}

			if (direction === "right") {
				onChange(value + 1);
				return false;
			}

			return true;
		},
	});

	return (
		<div
			ref={ref}
			className={`w-full max-w-[46vh] rounded-[2.5vh] border px-[2.4vh] py-[1.8vh] 
        backdrop-blur-md transition-all duration-200 
        ${
					focused
						? "border-white/90 bg-black/55 shadow-lg shadow-black/30"
						: "border-white/20 bg-black/30"
				}`}
		>
			<FlexBox direction="column" width="100%" gap={0.8}>
				<FlexBox width="100%" justify="space-between" align="center">
					<span className="text-[1.8vh] font-medium text-white/80">
						{label}
					</span>
					<span className="text-[2.1vh] font-semibold text-white">{value}</span>
				</FlexBox>
				<Slider
					min={KARAOKE_MIX_MIN}
					max={KARAOKE_MIX_MAX}
					step={1}
					value={[value]}
					onValueChange={([nextValue]: number[]) => {
						if (typeof nextValue === "number") {
							onChange(nextValue);
						}
					}}
					aria-label={label}
					className="py-1"
				/>
				<FlexBox width="100%" justify="space-between" align="center">
					<span className="text-[1.5vh] text-white/55">Vocals mute</span>
					<span className="text-[1.5vh] text-white/55">Instrumental mute</span>
				</FlexBox>
			</FlexBox>
		</div>
	);
}

function KaraokeLoadingIcon() {
	return (
		<span className="inline-block h-[2.2dvh] w-[2.2dvh] animate-spin rounded-full border-r-2 border-t-2 border-r-transparent border-t-current" />
	);
}

function MusicPlayerControls({
	t,
	renderSongInfo,
	isExpanded,
	isShown,
	isPlaying,
	isLoading,
	currentTime,
	playerDuration,
	setCurrentTime,
	setDuration,
	togglePlayPause,
	getActivePlaybackPosition,
	getActivePlaybackDuration,
	setActivePlaybackPosition,
	handleStop,
	showLyrics,
	isLyricsButtonDisabled,
	setShowLyrics,
	isLyricsOptionsOpen,
	setIsLyricsOptionsOpen,
	isLyricsOptionsButtonDisabled,
	hasLyrics,
	hasPronunciation,
	showPronunciation,
	hasTranslation,
	showTranslation,
	setShowPronunciation,
	setShowTranslation,
	closeLyricsOptions,
	shouldShowKaraokeButton,
	isKaraokePreparing,
	isKaraokeActive,
	isKaraokeReady,
	isKaraokeAvailable,
	karaokeMix,
	showKaraokeMixer,
	setShowKaraokeMixer,
	handleKaraokeMixChange,
	isQueueMenuOpen,
	setIsQueueMenuOpen,
}: MusicPlayerControlsProps) {
	const controlsHideTimeoutRef = useRef<number | null>(null);
	const [isTimelineFocused, setIsTimelineFocused] = useState(false);
	const [arePlayerControlsVisible, setArePlayerControlsVisible] =
		useState(true);

	const clearControlsHideTimeout = useCallback(() => {
		if (controlsHideTimeoutRef.current !== null) {
			window.clearTimeout(controlsHideTimeoutRef.current);
			controlsHideTimeoutRef.current = null;
		}
	}, []);

	const showPlayerControls = useCallback(() => {
		setArePlayerControlsVisible(true);
	}, []);

	const scheduleControlsAutoHide = useCallback(() => {
		clearControlsHideTimeout();

		if (!isExpanded || !isShown || !isTimelineFocused || !isPlaying) {
			setArePlayerControlsVisible(true);
			return;
		}

		setArePlayerControlsVisible(true);
		controlsHideTimeoutRef.current = window.setTimeout(() => {
			setArePlayerControlsVisible(false);
			controlsHideTimeoutRef.current = null;
		}, PLAYER_CONTROLS_AUTO_HIDE_MS);
	}, [
		clearControlsHideTimeout,
		isExpanded,
		isShown,
		isTimelineFocused,
		isPlaying,
	]);

	const toggleKaraokeMixer = useCallback(() => {
		if (!isKaraokeReady || !isKaraokeAvailable) {
			return;
		}

		const nextValue = !showKaraokeMixer;
		setShowKaraokeMixer(nextValue);

		window.setTimeout(() => {
			setFocus(
				nextValue
					? NavigationFocusKeys.player.karaokeSlider
					: NavigationFocusKeys.player.karaokeButton,
			);
		}, 30);
	}, [
		isKaraokeAvailable,
		isKaraokeReady,
		setShowKaraokeMixer,
		showKaraokeMixer,
	]);

	useEffect(() => {
		scheduleControlsAutoHide();

		return () => {
			clearControlsHideTimeout();
		};
	}, [clearControlsHideTimeout, scheduleControlsAutoHide]);

	useEffect(() => {
		if (!isShown || !isExpanded) {
			setArePlayerControlsVisible(true);
			clearControlsHideTimeout();
			return;
		}

		const handleControlsActivity = () => {
			showPlayerControls();

			if (isTimelineFocused) {
				scheduleControlsAutoHide();
				return;
			}

			clearControlsHideTimeout();
		};

		window.addEventListener("keydown", handleControlsActivity);

		return () => {
			window.removeEventListener("keydown", handleControlsActivity);
		};
	}, [
		clearControlsHideTimeout,
		isExpanded,
		isShown,
		isTimelineFocused,
		scheduleControlsAutoHide,
		showPlayerControls,
	]);

	return (
		<div
			className={`pointer-events-none absolute inset-x-0 bottom-[3.5vh] z-30 flex justify-center px-[4vh] transition-opacity duration-300 linear ${
				arePlayerControlsVisible ? "opacity-100" : "opacity-0"
			}`}
		>
			<div className="pointer-events-auto w-full max-w-[160dvh]">
				<div className="flex w-[160dvh] justify-between pb-4">
					{!!isLoading && (
						<div className="mb-[2vh] flex h-[7dvh] justify-center">
							<Loading />
						</div>
					)}

					<div className="flex justify-center pb-4">
						{TEST_BACKGROUND_STYLE === "background" && renderSongInfo()}
					</div>

					<div className="flex self-end justify-end">
						{!!shouldShowKaraokeButton && (
							<NavigationButton
								customKey={NavigationFocusKeys.player.karaokeButton}
								title={t("karaokeMix")}
								hideText
								selected={showKaraokeMixer || isKaraokeActive}
								disabled={!isKaraokeReady}
								onClick={toggleKaraokeMixer}
							>
								{isKaraokePreparing ? (
									<KaraokeLoadingIcon />
								) : (
									<AudioLines size={"2dvh"} />
								)}
							</NavigationButton>
						)}

						<NavigationButton
							customKey={NavigationFocusKeys.player.optionsButton}
							hideText
						>
							<Ellipsis size={"2vh"} />
						</NavigationButton>
					</div>
				</div>

				<FlexBox direction="column" gap={2} align="center" width="100%">
					<TimelineSlider
						position={currentTime}
						setPosition={setCurrentTime}
						duration={playerDuration}
						setDuration={setDuration}
						onFocusChange={setIsTimelineFocused}
						togglePlayPause={togglePlayPause}
						playbackControls={{
							getPosition: getActivePlaybackPosition,
							getDuration: getActivePlaybackDuration,
							setPosition: setActivePlaybackPosition,
						}}
					/>

					<AnimatePresence initial={false}>
						<QueueMenu isOpen={isQueueMenuOpen} onClose={setIsQueueMenuOpen} />

						{showKaraokeMixer && isKaraokeAvailable && (
							<motion.div
								key="karaoke-mix-slider"
								initial={{ y: 16, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: 16, opacity: 0 }}
								transition={{ duration: 0.2, ease: "easeOut" }}
								className="pt-[1.5vh]"
							>
								<KaraokeMixSlider
									label={t("karaokeMix")}
									value={karaokeMix}
									onChange={(nextValue) => {
										void handleKaraokeMixChange(nextValue);
									}}
								/>
							</motion.div>
						)}
					</AnimatePresence>

					<FlexBox
						gap={1}
						width={"100%"}
						justify="space-between"
						align="center"
						className="pt-4"
					>
						<div className="flex gap-2">
							<NavigationButton
								customKey={NavigationFocusKeys.player.playPauseButton}
								hideText
								onClick={togglePlayPause}
							>
								{isPlaying ? (
									<PauseIcon fill="currentColor" size={"2vh"} />
								) : (
									<PlayIcon fill="currentColor" size={"2vh"} />
								)}
							</NavigationButton>
							<NavigationButton
								customKey={NavigationFocusKeys.player.closeButton}
								hideText
								onClick={handleStop}
							>
								<SquareIcon fill="currentColor" size={"2vh"} />
							</NavigationButton>
						</div>

						<div className="flex gap-2">
							<NavigationButton
								customKey={NavigationFocusKeys.player.lyricsButton}
								title={t("lyrics")}
								hideText
								disabled={isLyricsButtonDisabled}
								onClick={() => {
									if (showLyrics) {
										setIsLyricsOptionsOpen(false);
									}

									setShowLyrics(!showLyrics);
								}}
							>
								<MicVocal
									stroke={showLyrics ? "var(--app-color)" : "currentColor"}
									size={"2dvh"}
								/>
							</NavigationButton>
							<div className="relative">
								<NavigationButton
									customKey={NavigationFocusKeys.player.lyricsOptionsButton}
									title={t("lyricsOptions")}
									hideText
									selected={isLyricsOptionsOpen}
									disabled={isLyricsOptionsButtonDisabled || !hasLyrics}
									onClick={() => {
										setIsLyricsOptionsOpen((currentValue) => !currentValue);
									}}
								>
									<Languages size={"2dvh"} />
								</NavigationButton>

								<AnimatePresence initial={false}>
									{isLyricsOptionsOpen &&
										!isLyricsOptionsButtonDisabled &&
										!!hasLyrics && (
											<motion.div
												key="lyrics-options-menu"
												initial={{ opacity: 0, y: 16 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 16 }}
												transition={{ duration: 0.18, ease: "easeOut" }}
												className="absolute bottom-[calc(100%+1.4vh)] left-1/2 z-40 -translate-x-1/2"
											>
												<LyricsOptionsMenu
													open={isLyricsOptionsOpen}
													triggerFocusKey={
														NavigationFocusKeys.player.lyricsOptionsButton
													}
													pronunciationLabel={t("lyricsPronunciation")}
													translationLabel={t("lyricsTranslation")}
													hasPronunciation={hasPronunciation}
													showPronunciation={showPronunciation}
													hasTranslation={hasTranslation}
													showTranslation={showTranslation}
													onTogglePronunciation={() => {
														setShowPronunciation(
															(currentValue) => !currentValue,
														);
													}}
													onToggleTranslation={() => {
														setShowTranslation(!showTranslation);
													}}
													onClose={() => closeLyricsOptions()}
												/>
											</motion.div>
										)}
								</AnimatePresence>
							</div>

							<NavigationButton
								customKey={NavigationFocusKeys.player.openQueueButton}
								hideText
								selected={isQueueMenuOpen}
								onClick={() => setIsQueueMenuOpen(true)}
							>
								<List size={"2dvh"} />
							</NavigationButton>
						</div>
					</FlexBox>
				</FlexBox>
			</div>
		</div>
	);
}

export default memo(MusicPlayerControls);
