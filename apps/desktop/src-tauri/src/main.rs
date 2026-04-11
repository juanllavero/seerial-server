mod video;
mod audio;

use tauri::{Manager, window::Color};

use video::{
    bind_mpv_to_window,
    exit_app,
    MpvState,
    // Playback
    embed_mpv, play, pause, stop, toggle_play_pause, loadfile, load_url,
    get_position, set_position, get_duration, get_playback_status,
    // Video
    set_volume, get_volume, set_zoom, set_video_quality,
    set_hwdec,
    // Audio (MPV)
    set_audio_track, set_audio_delay,
    set_audio_normalize, set_audio_exclusive,
    // Subtitles
    set_subtitle_track, set_subtitle_delay,
    set_subtitle_font_size, set_subtitle_color,
    set_subtitle_border_size, set_subtitle_shadow_offset, set_subtitle_position,
    set_subtitle_color_preset, set_subtitle_size_preset, set_subtitle_position_preset,
};

use audio::{
    KaraokeState,
    get_karaoke_preload_status,
    get_karaoke_preload_status_for_urls,
    preload_karaoke,
    reset_karaoke_preload,
    start_karaoke, 
    set_karaoke_mix, 
    pause_karaoke,
    resume_karaoke,
    seek_karaoke,
    stop_karaoke,
    get_karaoke_status,
};

#[tokio::main]
async fn main() {
    // Initialize MPV state
    let mpv_state = MpvState::new();
    
    // Initialize Karaoke engine state (Rodio)
    let karaoke_state = KaraokeState::new();

    tauri::Builder::default()
        .manage(mpv_state)
        .manage(karaoke_state)
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let state = app.state::<MpvState>();
                if let Err(error) = bind_mpv_to_window(&window, &state) {
                    eprintln!("Failed to bind MPV to window: {error}");
                }
            }

            let main_window = app.get_webview_window("main")
                .ok_or_else(|| "Failed to find the main window")?;

            // Windows-specific
            #[cfg(target_os = "windows")]
            {
                // Webview transparency to allow MPV's own rendering to show through
                let _ = main_window.set_background_color(Some(Color(0, 0, 0, 0)));
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // --- MPV Commands (Video and Normal Playback) ---
            embed_mpv,
            play,
            pause,
            stop,
            exit_app,
            toggle_play_pause,
            loadfile,
            load_url,
            get_position,
            set_position,
            get_duration,
            get_playback_status,
            set_volume,
            get_volume,
            set_zoom,
            set_video_quality,
            set_hwdec,
            set_audio_track,
            set_audio_delay,
            set_audio_normalize,
            set_audio_exclusive,
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
            
            // --- Rodio Commands (Karaoke Mode) ---
            get_karaoke_preload_status,
            get_karaoke_preload_status_for_urls,
            preload_karaoke,
            reset_karaoke_preload,
            start_karaoke,
            set_karaoke_mix,
            pause_karaoke,
            resume_karaoke,
            seek_karaoke,
            stop_karaoke,
            get_karaoke_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}