mod video;

use tauri::Manager;
use video::{
    bind_mpv_to_window,
    MpvState,
    // Playback
    embed_mpv, play, pause, stop, toggle_play_pause, loadfile, load_url,
    get_position, set_position, get_duration, get_playback_status,
    // Video
    set_volume, get_volume, set_zoom, set_video_quality,
    set_hwdec, set_display_sync, set_hdr_passthrough,
    // Audio
    set_audio_track, set_audio_delay,
    set_audio_normalize, set_audio_exclusive, set_audio_passthrough,
    // Subtitles
    set_subtitle_track, set_subtitle_delay,
    set_subtitle_font_size, set_subtitle_color,
    set_subtitle_border_size, set_subtitle_shadow_offset, set_subtitle_position,
    set_subtitle_color_preset, set_subtitle_size_preset, set_subtitle_position_preset,
};

#[tokio::main]
async fn main() {
    let mpv_state = MpvState::new();

    tauri::Builder::default()
        .manage(mpv_state)
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let state = app.state::<MpvState>();
                if let Err(error) = bind_mpv_to_window(&window, &state) {
                    eprintln!("Failed to bind MPV to window: {error}");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Playback control
            embed_mpv,
            play,
            pause,
            stop,
            toggle_play_pause,
            loadfile,
            load_url,
            get_position,
            set_position,
            get_duration,
            get_playback_status,
            // Video
            set_volume,
            get_volume,
            set_zoom,
            set_video_quality,
            set_hwdec,
            set_display_sync,
            set_hdr_passthrough,
            // Audio
            set_audio_track,
            set_audio_delay,
            set_audio_normalize,
            set_audio_exclusive,
            set_audio_passthrough,
            // Subtitles
            set_subtitle_track,
            set_subtitle_delay,
            set_subtitle_font_size,
            set_subtitle_color,
            set_subtitle_border_size,
            set_subtitle_shadow_offset,
            set_subtitle_position,
            set_subtitle_color_preset,
            set_subtitle_size_preset,
            set_subtitle_position_preset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}