import { invoke } from '@tauri-apps/api/core';
import type { ThemeMusicVolume } from '@/features/settings/stores/settings.store';

const READY_POLL_INTERVAL_MS = 250;
const FADE_OUT_DURATION_MS = 350;
const FADE_OUT_STEPS = 7;

let mpvCommandQueue: Promise<void> = Promise.resolve();

const APP_SHELL_BACKGROUND_PROPERTY = '--seerial-app-shell-background';
const APP_SHELL_BACKGROUND_VALUES = {
    opaque: 'rgb(0 0 0)',
    videoOverlay: 'rgb(0 0 0 / 75%)',
} as const;

export type AppShellBackgroundMode = 'opaque' | 'video-overlay';

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

export function enqueueMpvCommand<T>(task: () => Promise<T>): Promise<T> {
    const run = mpvCommandQueue.then(task, task);
    mpvCommandQueue = run.then(
        () => undefined,
        () => undefined,
    );

    return run;
}

export function getBackgroundPlaybackVolume(volume: ThemeMusicVolume): number {
    switch (volume) {
        case 'off':
            return 0;
        case 'low':
            return 100;
        case 'medium':
            return 120;
        case 'high':
            return 140;
        case 'veryHigh':
            return 150;
        default:
            return 100;
    }
}

export async function waitForMediaReady(
    timeoutMs: number,
    isCancelled: () => boolean,
): Promise<boolean> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        if (isCancelled()) {
            return false;
        }

        try {
            const duration = await invoke<number>('get_duration');
            if (Number.isFinite(duration) && duration > 0) {
                return true;
            }
        } catch {
            // Ignore transient MPV readiness failures while the file is loading.
        }

        await sleep(READY_POLL_INTERVAL_MS);
    }

    return false;
}

export async function fadeOutAndStopMpv(
    restoreVolume: number,
    isCancelled: () => boolean,
): Promise<void> {
    let currentVolume = restoreVolume;

    try {
        currentVolume = await invoke<number>('get_volume');
    } catch {
        currentVolume = restoreVolume;
    }

    const safeCurrentVolume = Number.isFinite(currentVolume) ? Math.max(0, currentVolume) : 0;
    const stepDelayMs = Math.max(1, Math.floor(FADE_OUT_DURATION_MS / FADE_OUT_STEPS));

    for (let step = FADE_OUT_STEPS - 1; step >= 0; step -= 1) {
        if (isCancelled()) {
            break;
        }

        const nextVolume = safeCurrentVolume * (step / FADE_OUT_STEPS);
        await invoke('set_volume', { volume: nextVolume }).catch(() => undefined);
        await sleep(stepDelayMs);
    }

    await invoke('stop').catch(() => undefined);
    await invoke('embed_mpv').catch(() => undefined);
    await invoke('set_volume', { volume: restoreVolume }).catch(() => undefined);
}

export function setAppShellBackground(mode: AppShellBackgroundMode): void {
    document.documentElement.style.setProperty(
        APP_SHELL_BACKGROUND_PROPERTY,
        mode === 'opaque'
            ? APP_SHELL_BACKGROUND_VALUES.opaque
            : APP_SHELL_BACKGROUND_VALUES.videoOverlay,
    );
}

export function resetAppShellBackground(): void {
    document.documentElement.style.removeProperty(APP_SHELL_BACKGROUND_PROPERTY);
}