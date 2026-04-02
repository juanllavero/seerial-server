import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';
import { useSettingsStore } from '@/features/settings/stores/settings.store';

/**
 * Synchronises app-level settings (from localStorage via useSettingsStore) to
 * MPV whenever they change, and on first mount so every new MPV instance is
 * immediately configured with the saved preferences.
 *
 * Call this hook inside VideoPlayerPage so the settings are applied before the
 * first video loads (MPV accepts property writes even when idle).
 */
export function useAppSettingsMpv() {
    const hardwareDecoding = useSettingsStore((s) => s.settings.hardwareDecoding);
    const videoQuality = useSettingsStore((s) => s.settings.videoQuality);
    const normalizeMultichannel = useSettingsStore((s) => s.settings.normalizeMultichannel);
    const exclusiveAudio = useSettingsStore((s) => s.settings.exclusiveAudio);

    useEffect(() => {
        invoke('set_hwdec', { enabled: hardwareDecoding }).catch(console.error);
    }, [hardwareDecoding]);

    useEffect(() => {
        invoke('set_video_quality', { quality: videoQuality }).catch(console.error);
    }, [videoQuality]);

    useEffect(() => {
        invoke('set_audio_normalize', { enabled: normalizeMultichannel }).catch(console.error);
    }, [normalizeMultichannel]);

    useEffect(() => {
        invoke('set_audio_exclusive', { enabled: exclusiveAudio }).catch(console.error);
    }, [exclusiveAudio]);
}
