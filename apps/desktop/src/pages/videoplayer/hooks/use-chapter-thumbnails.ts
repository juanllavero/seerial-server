import { useGetVideoChapterThumbnails } from "@seerial/api";
import type { Chapter } from "@seerial/domain";
import { useServerStore } from "@seerial/stores";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

const POSITION_POLL_INTERVAL_MS = 1000;

export function useChapterThumbnails(videoId: string, hasChapters: boolean) {
	const serverUrl = useServerStore((state) => state.selectedServer?.url ?? "");

	const { data: chapters } = useGetVideoChapterThumbnails<Chapter[]>(videoId, {
		enabled: hasChapters && !!videoId && serverUrl !== "",
		staleTime: Number.POSITIVE_INFINITY,
	});

	return chapters ?? null;
}

export function usePlaybackPosition(enabled: boolean): number {
	const [position, setPosition] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!enabled) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		intervalRef.current = setInterval(async () => {
			try {
				const pos = await invoke<number>("get_position");
				if (typeof pos === "number" && Number.isFinite(pos)) {
					setPosition(pos);
				}
			} catch {
				// MPV may not be ready yet
			}
		}, POSITION_POLL_INTERVAL_MS);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [enabled]);

	return position;
}
