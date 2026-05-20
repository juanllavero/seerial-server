import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { useCallback, useEffect, useState } from 'react';

interface AppUpdaterState {
    update: Update | null;
    installing: boolean;
}

export function useAppUpdater() {
    const [state, setState] = useState<AppUpdaterState>({ update: null, installing: false });

    useEffect(() => {
        check()
            .then((update) => {
                setState((prev) => ({ ...prev, update: update ?? null }));
            })
            .catch((error: unknown) => {
                console.error('[updater] check failed:', error);
            });
    }, []);

    const installUpdate = useCallback(async () => {
        if (!state.update) return;
        setState((prev) => ({ ...prev, installing: true }));
        try {
            await state.update.downloadAndInstall();
            await relaunch();
        } catch (error: unknown) {
            console.error('[updater] install failed:', error);
            setState((prev) => ({ ...prev, installing: false }));
        }
    }, [state.update]);

    const dismissUpdate = useCallback(() => {
        setState((prev) => ({ ...prev, update: null }));
    }, []);

    return {
        update: state.update,
        installing: state.installing,
        installUpdate,
        dismissUpdate,
    };
}
