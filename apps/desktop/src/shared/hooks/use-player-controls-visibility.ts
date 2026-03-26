import { useCallback, useEffect, useRef, useState } from 'react';

type ControlsMode = 'hidden' | 'full' | 'compact';

const FULL_CONTROLS_TIMEOUT_MS = 5000;
const COMPACT_CONTROLS_TIMEOUT_MS = 1500;

const BACK_KEYS = new Set(['Escape', 'Backspace', 'Delete']);
const SEEK_KEYS = new Set(['ArrowLeft', 'ArrowRight']);

function hasModifiers(event: KeyboardEvent) {
    return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

interface UsePlayerControlsVisibilityOptions {
    isTimelineFocused: boolean;
}

export function usePlayerControlsVisibility({
    isTimelineFocused,
}: UsePlayerControlsVisibilityOptions) {
    const [mode, setMode] = useState<ControlsMode>('hidden');
    const hideTimeoutRef = useRef<number | null>(null);

    const clearHideTimeout = useCallback(() => {
        if (hideTimeoutRef.current !== null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);

    const scheduleHide = useCallback(
        (delayMs: number) => {
            clearHideTimeout();
            hideTimeoutRef.current = window.setTimeout(() => {
                setMode('hidden');
                hideTimeoutRef.current = null;
            }, delayMs);
        },
        [clearHideTimeout],
    );

    const showFull = useCallback(() => {
        clearHideTimeout();
        setMode('full');
    }, [clearHideTimeout]);

    const hide = useCallback(() => {
        clearHideTimeout();
        setMode('hidden');
    }, [clearHideTimeout]);

    // Auto-hide for full mode: only when timeline is focused
    useEffect(() => {
        if (mode !== 'full') return;

        if (!isTimelineFocused) {
            clearHideTimeout();
            return;
        }

        scheduleHide(FULL_CONTROLS_TIMEOUT_MS);

        return () => {
            clearHideTimeout();
        };
    }, [mode, isTimelineFocused, scheduleHide, clearHideTimeout]);

    const handleHiddenKey = useCallback(
        (key: string) => {
            if (SEEK_KEYS.has(key)) {
                setMode('compact');
                scheduleHide(COMPACT_CONTROLS_TIMEOUT_MS);
            } else {
                showFull();
            }
        },
        [showFull, scheduleHide],
    );

    const handleCompactKey = useCallback(
        (key: string) => {
            if (SEEK_KEYS.has(key)) {
                scheduleHide(COMPACT_CONTROLS_TIMEOUT_MS);
            } else {
                showFull();
            }
        },
        [showFull, scheduleHide],
    );

    const handleFullKey = useCallback(
        (key: string) => {
            if (key === 'ArrowUp' && !isTimelineFocused) {
                hide();
                return;
            }

            if (isTimelineFocused) {
                scheduleHide(FULL_CONTROLS_TIMEOUT_MS);
            }
        },
        [isTimelineFocused, hide, scheduleHide],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (hasModifiers(event)) return;
            if (BACK_KEYS.has(event.key)) return;

            if (mode === 'hidden') handleHiddenKey(event.key);
            else if (mode === 'compact') handleCompactKey(event.key);
            else if (mode === 'full') handleFullKey(event.key);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode, handleHiddenKey, handleCompactKey, handleFullKey]);

    useEffect(() => {
        return () => {
            clearHideTimeout();
        };
    }, [clearHideTimeout]);

    return {
        mode,
        isVisible: mode !== 'hidden',
        isCompact: mode === 'compact',
        isFull: mode === 'full',
        showFull,
        hide,
    };
}
