import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useKeyboardShortcut } from "@/shared/hooks/use-keyboard-shortcut";

const VOLUME_STEP = 5;
const VISIBILITY_TIMEOUT_MS = 2000;

export function useVolumeIndicator({
	enabled = true,
}: {
	enabled?: boolean;
} = {}) {
	const [volume, setVolume] = useState(100);
	const [visible, setVisible] = useState(false);
	const hideTimeoutRef = useRef<number | null>(null);

	const clearHideTimeout = useCallback(() => {
		if (hideTimeoutRef.current !== null) {
			window.clearTimeout(hideTimeoutRef.current);
			hideTimeoutRef.current = null;
		}
	}, []);

	const showTemporarily = useCallback(() => {
		clearHideTimeout();
		setVisible(true);
		hideTimeoutRef.current = window.setTimeout(() => {
			setVisible(false);
			hideTimeoutRef.current = null;
		}, VISIBILITY_TIMEOUT_MS);
	}, [clearHideTimeout]);

	const changeVolume = useCallback(
		(delta: number) => {
			setVolume((prev) => {
				const next = Math.max(0, Math.min(100, prev + delta));
				invoke("set_volume", { volume: next }).catch(console.error);
				return next;
			});
			showTemporarily();
		},
		[showTemporarily],
	);

	useKeyboardShortcut({
		key: ["+", "-"],
		enabled,
		ignoreModifiers: false,
		onKeyDown: useCallback(
			(e: KeyboardEvent) => {
				e.preventDefault();
				changeVolume(e.key === "+" ? VOLUME_STEP : -VOLUME_STEP);
			},
			[changeVolume],
		),
	});

	useEffect(() => {
		return () => clearHideTimeout();
	}, [clearHideTimeout]);

	return { volume, visible };
}
