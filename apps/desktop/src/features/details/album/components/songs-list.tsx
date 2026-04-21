import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { type Album, formatTime, type Song } from "@seerial/domain";
import { useMusicStore } from "@seerial/stores";
import { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { shallow } from "zustand/shallow";
import NavigationButton from "@/components/navigation/NavigationButton";
import Tertiary from "@/components/text/Tertiary";
import FlexBox from "@/components/ui/FlexBox";
import AnimatedSoundBars from "@/features/music-player/animated-sound-bars";

interface SongsListProps {
	album: Album;
	songs: Song[];
	focusedSongId?: string;
	onSongFocus?: (songId: string) => void;
}

function getSafeDiscNumber(song: Song): number {
	return song.discNumber > 0 ? song.discNumber : 1;
}

function getSafeTrackNumber(song: Song): number {
	return song.trackNumber > 0 ? song.trackNumber : Number.MAX_SAFE_INTEGER;
}

function SongsList({
	album,
	songs,
	focusedSongId,
	onSongFocus,
}: SongsListProps) {
	const { t } = useTranslation();
	const { currentSong, isPlaying, setPlaybackContext } = useMusicStore(
		(state) => ({
			currentSong: state.currentSong,
			isPlaying: state.isPlaying,
			setPlaybackContext: state.setPlaybackContext,
		}),
		shallow,
	);

	// Set focus on load
	useEffect(() => {
		setFocus(focusedSongId ?? currentSong?.id ?? songs[0]?.id ?? "");
	}, [focusedSongId, currentSong?.id, songs]);

	const sortedSongs = useMemo(
		() =>
			[...songs].sort(
				(a, b) =>
					getSafeTrackNumber(a) - getSafeTrackNumber(b) ||
					a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
			),
		[songs],
	);

	const discNumbers = useMemo(
		() =>
			[...new Set(sortedSongs.map((song) => getSafeDiscNumber(song)))].sort(
				(a, b) => a - b,
			),
		[sortedSongs],
	);

	const queue = useMemo(
		() =>
			[...songs].sort(
				(a, b) =>
					getSafeDiscNumber(a) - getSafeDiscNumber(b) ||
					getSafeTrackNumber(a) - getSafeTrackNumber(b) ||
					a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
			),
		[songs],
	);

	const showTracksHeader =
		discNumbers.length === 0 ||
		(discNumbers.length === 1 && discNumbers[0] === 1);

	if (songs.length === 0) {
		return null;
	}

	return (
		<FlexBox direction="column" gap={1} width="100%" padding="0 4rem">
			{showTracksHeader ? (
				<>
					<Tertiary>{t("tracks")}</Tertiary>
					<FlexBox direction="column" gap={0.6} width="100%">
						{sortedSongs.map((song) => {
							return (
								<NavigationButton
									key={song.id ?? `${song.title}-${song.fileSrc}`}
									customKey={song.id}
									className="w-full justify-start rounded-xl! py-10!"
									onClick={() => setPlaybackContext(song, album, queue)}
									onFocus={() => song.id && onSongFocus?.(song.id)}
								>
									<FlexBox
										justify="space-between"
										padding="0 1.5rem"
										width={"100%"}
									>
										<FlexBox
											gap={1.5}
											items="center"
											justify="center"
											className="relative"
										>
											<FlexBox justify="center" items="center" width={"1dvh"}>
												{currentSong?.id === song.id ? (
													<AnimatedSoundBars
														isPlaying={true}
														isSelected={focusedSongId === song.id}
														translate={false}
													/>
												) : (
													<Tertiary className="text-current!">
														{song.trackNumber}
													</Tertiary>
												)}
											</FlexBox>
											<div></div>
											<Tertiary className="text-current!">
												{song.title}
											</Tertiary>
										</FlexBox>
										<Tertiary className="text-current!">
											{song.duration ? formatTime(song.duration) : ""}
										</Tertiary>
									</FlexBox>
								</NavigationButton>
							);
						})}
					</FlexBox>
				</>
			) : (
				<FlexBox direction="column" gap={1.25} width="100%">
					{discNumbers.map((discNumber) => {
						const songsByDisc = sortedSongs.filter(
							(song) => getSafeDiscNumber(song) === discNumber,
						);

						return (
							<FlexBox
								direction="column"
								gap={0.6}
								width="100%"
								key={`disc-${discNumber}`}
							>
								<Tertiary>
									{t("disc")} {discNumber}
								</Tertiary>
								{songsByDisc.map((song) => {
									return (
										<NavigationButton
											key={song.id ?? `${song.title}-${song.fileSrc}`}
											customKey={song.id}
											className="w-full justify-start rounded-xl! py-10!"
											onClick={() => setPlaybackContext(song, album, queue)}
											onFocus={() => song.id && onSongFocus?.(song.id)}
										>
											<FlexBox
												justify="space-between"
												padding="0 1.5rem"
												width={"100%"}
											>
												<FlexBox gap={1.5}>
													<Tertiary className="text-current!">
														{song.trackNumber}
													</Tertiary>
													{currentSong?.id === song.id ? (
														<AnimatedSoundBars isPlaying={isPlaying} />
													) : null}
													<div></div>
													<Tertiary className="text-current!">
														{song.title}
													</Tertiary>
												</FlexBox>
												<Tertiary className="text-current!">
													{song.duration ? formatTime(song.duration) : ""}
												</Tertiary>
											</FlexBox>
										</NavigationButton>
									);
								})}
							</FlexBox>
						);
					})}
				</FlexBox>
			)}
		</FlexBox>
	);
}

export default memo(SongsList);
