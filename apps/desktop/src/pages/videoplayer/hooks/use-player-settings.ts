import { useLocalStorage } from '@seerial/hooks';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef } from 'react';

export type SubtitleSize = 'tiny' | 'small' | 'normal' | 'big' | 'large';
export type SubtitlePosition = 'topRight' | 'topCenter' | 'topLeft' | 'bottomRight' | 'bottomCenter' | 'bottomLeft';
export type PlayerVideoQuality =
    | 'low'
    | 'normal'
    | 'high'
    | 'ultra'
    | 'maximum';

export interface PlayerSettings {
    videoQuality: PlayerVideoQuality;
    zoom: number;
    audioDelay: number;
    subtitleDelay: number;
    subtitleSize: SubtitleSize;
    subtitleColor: string;
    subtitleBorderSize: number;
    subtitleShadowOffset: number;
    subtitlePosition: SubtitlePosition;
}

const DEFAULT_SETTINGS: PlayerSettings = {
    videoQuality: 'normal',
    zoom: 0,
    audioDelay: 0,
    subtitleDelay: 0,
    subtitleSize: 'normal',
    subtitleColor: '#FFFFFF',
    subtitleBorderSize: 3,
    subtitleShadowOffset: 0,
    subtitlePosition: 'bottomCenter',
};

const SUBTITLE_SIZE_MAP: Record<SubtitleSize, number> = {
    tiny: 28,
    small: 40,
    normal: 55,
    big: 70,
    large: 85,
};

function hexToMpvColor(hex: string): string {
    // MPV expects #AARRGGBB, we store #RRGGBB
    const r = hex.slice(1, 3);
    const g = hex.slice(3, 5);
    const b = hex.slice(5, 7);
    return `#FF${r}${g}${b}`;
}

function applySettingToMpv(key: keyof PlayerSettings, value: PlayerSettings[keyof PlayerSettings]) {
    switch (key) {
        case 'videoQuality':
            invoke('set_video_quality', { quality: value as PlayerVideoQuality }).catch(console.error);
            break;
        case 'zoom':
            invoke('set_zoom', { zoomLevel: value as number }).catch(console.error);
            break;
        case 'audioDelay':
            invoke('set_audio_delay', { delay: (value as number) / 1000 }).catch(console.error);
            break;
        case 'subtitleDelay':
            invoke('set_subtitle_delay', { delay: (value as number) / 1000 }).catch(console.error);
            break;
        case 'subtitleSize':
            invoke('set_subtitle_font_size', { size: SUBTITLE_SIZE_MAP[value as SubtitleSize] }).catch(console.error);
            break;
        case 'subtitleColor':
            invoke('set_subtitle_color', { color: hexToMpvColor(value as string) }).catch(console.error);
            break;
        case 'subtitleBorderSize':
            invoke('set_subtitle_border_size', { size: value as number }).catch(console.error);
            break;
        case 'subtitleShadowOffset':
            invoke('set_subtitle_shadow_offset', { offset: value as number }).catch(console.error);
            break;
        case 'subtitlePosition':
            invoke('set_subtitle_position_preset', { position: value as SubtitlePosition }).catch(console.error);
            break;
    }
}

export function usePlayerSettings() {
    const [settings, setSettings] = useLocalStorage<PlayerSettings>('player-settings', DEFAULT_SETTINGS);
    const initializedRef = useRef(false);

    // Apply all settings to MPV on mount
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        for (const key of Object.keys(settings) as (keyof PlayerSettings)[]) {
            applySettingToMpv(key, settings[key]);
        }
    }, [settings]);

    const updateSetting = useCallback(
        <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => {
            applySettingToMpv(key, value);
            setSettings((prev: PlayerSettings) => ({ ...prev, [key]: value }));
        },
        [setSettings],
    );

    return { settings, updateSetting };
}
