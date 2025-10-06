mod video;

use tauri::Manager;
use video::{
    MpvState, embed_mpv, play, pause, stop, loadfile, load_url, get_position, set_position,
    get_duration, set_volume, get_volume, set_audio_track, set_subtitle_track, set_zoom
};
use raw_window_handle::HasWindowHandle;

#[tokio::main]
async fn main() {
    let mpv_state = MpvState::new();
    
    // Clonar las referencias Arc antes de moverlas al closure
    let window_id_clone = mpv_state.window_id.clone();
    let mpv_clone = mpv_state.mpv.clone();

    tauri::Builder::default()
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            if let Ok(handle) = window.window_handle() {
                if let raw_window_handle::RawWindowHandle::Win32(h) = handle.as_raw() {
                    let hwnd = h.hwnd.get() as i64;
                    
                    // Guardar el window_id en el estado
                    if let Ok(mut window_id_guard) = window_id_clone.lock() {
                        *window_id_guard = Some(hwnd);
                    }
                    
                    // Aplicar a la instancia actual de MPV
                    if let Ok(mpv_guard) = mpv_clone.lock() {
                        if let Some(ref mpv) = *mpv_guard {
                            let _ = mpv.set_property("wid", hwnd);
                            let _ = mpv.set_property("force-window", "yes");
                        }
                    }
                }
            }

            #[cfg(target_os = "linux")]
            if let Ok(handle) = window.window_handle() {
                use raw_window_handle::XlibWindowHandle;
                if let raw_window_handle::RawWindowHandle::Xlib(h) = handle.as_raw() {
                    let wid = h.window as i64;
                    
                    // Guardar el window_id en el estado
                    if let Ok(mut window_id_guard) = window_id_clone.lock() {
                        *window_id_guard = Some(wid);
                    }
                    
                    // Aplicar a la instancia actual de MPV
                    if let Ok(mpv_guard) = mpv_clone.lock() {
                        if let Some(ref mpv) = *mpv_guard {
                            let _ = mpv.set_property("wid", wid);
                            let _ = mpv.set_property("force-window", "yes");
                        }
                    }
                }
            }

            #[cfg(target_os = "macos")]
            if let Ok(handle) = window.window_handle() {
                use raw_window_handle::AppKitWindowHandle;
                if let raw_window_handle::RawWindowHandle::AppKit(h) = handle.as_raw() {
                    let ns_window = h.ns_window.as_ptr() as i64;
                    
                    // Guardar el window_id en el estado
                    if let Ok(mut window_id_guard) = window_id_clone.lock() {
                        *window_id_guard = Some(ns_window);
                    }
                    
                    // Aplicar a la instancia actual de MPV
                    if let Ok(mpv_guard) = mpv_clone.lock() {
                        if let Some(ref mpv) = *mpv_guard {
                            let _ = mpv.set_property("wid", ns_window);
                            let _ = mpv.set_property("force-window", "yes");
                        }
                    }
                }
            }

            Ok(())
        })
        .manage(mpv_state)
        .invoke_handler(tauri::generate_handler![
            embed_mpv,
            play,
            pause,
            stop,
            loadfile,
            load_url,
            get_position,
            set_position,
            get_duration,
            set_volume,
            get_volume,
            set_audio_track,
            set_subtitle_track,
            set_zoom
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}