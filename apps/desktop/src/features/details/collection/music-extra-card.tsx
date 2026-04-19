import {
	setFocus,
	useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import { getSignedVideoStreamUrlPassthrough } from "@seerial/api";
import { useServerStore } from "@seerial/stores";
import { memo, useEffect, useRef, useState } from "react";
import FlexBox from "@/components/ui/FlexBox";

interface MusicExtraCardProps {
	src: string;
	title: string;
	subtitle?: string;
	customKey: string;
	width?: string;
	onFocus?: () => void;
	action?: () => void;
}

function MusicExtraCard({
	src,
	title,
	subtitle,
	customKey,
	width = "30vh",
	onFocus,
	action,
}: MusicExtraCardProps) {
	const serverUrl = useServerStore((state) => state.selectedServer?.url ?? "");
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const { ref, focused } = useFocusable({
		focusKey: customKey,
		onEnterPress: action,
	});

	useEffect(() => {
		if (focused && onFocus) onFocus();
	}, [focused, onFocus]);

	useEffect(() => {
		let cancelled = false;

		async function generateThumbnail() {
			const signedUrl = await getSignedVideoStreamUrlPassthrough({
				filePath: src,
			});
			if (cancelled || !signedUrl) return;

			const video = document.createElement("video");
			video.crossOrigin = "anonymous";
			video.preload = "metadata";
			video.muted = true;
			video.src = `${serverUrl}${signedUrl}`;

			video.addEventListener(
				"loadeddata",
				() => {
					video.currentTime = 10;
				},
				{ once: true },
			);

			video.addEventListener(
				"seeked",
				() => {
					if (cancelled) {
						video.src = "";
						return;
					}

					const canvas = document.createElement("canvas");
					canvas.width = video.videoWidth || 640;
					canvas.height = video.videoHeight || 360;
					const ctx = canvas.getContext("2d");

					if (ctx) {
						ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
						try {
							setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
						} catch {
							// CORS or other issue, thumbnail stays null
						}
					}

					video.src = "";
				},
				{ once: true },
			);
		}

		generateThumbnail();

		return () => {
			cancelled = true;
			if (videoRef.current) {
				videoRef.current.src = "";
			}
		};
	}, [src, serverUrl]);

	return (
		<FlexBox
			ref={ref}
			data-focus-key={customKey}
			onClick={() => {
				if (customKey) setFocus(customKey);
				if (focused && action) action();
			}}
			direction="column"
			width={width}
			className="shrink-0 overflow-hidden"
			css={{ flex: `0 0 ${width}`, maxWidth: width }}
		>
			<div
				className="relative w-full overflow-hidden rounded-md"
				style={{ aspectRatio: "16 / 9" }}
			>
				<div
					className={`h-full w-full rounded-md border-2 border-transparent transition-all duration-350 ${
						focused ? "scale-100 border-white" : "scale-95"
					}`}
				>
					{thumbnail ? (
						<img
							src={thumbnail}
							alt={title}
							className="h-full w-full rounded-md object-cover"
						/>
					) : (
						<div className="h-full w-full rounded-md bg-zinc-800" />
					)}
				</div>
			</div>

			<div className="flex min-h-0 w-full scale-95 flex-col justify-center overflow-hidden pt-1">
				<span className="truncate text-[1.5vh] leading-tight">{title}</span>
				{subtitle && (
					<span
						className="truncate text-[1.25vh] leading-tight"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						{subtitle}
					</span>
				)}
			</div>
		</FlexBox>
	);
}

export default memo(MusicExtraCard);
