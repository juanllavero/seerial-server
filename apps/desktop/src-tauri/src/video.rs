use std::sync::{Arc, Mutex};
use libmpv2::Mpv;
use serde::Serialize;
use tauri::{State, Window};
use raw_window_handle::{HasWindowHandle};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackStatus {
    pub position: Option<f64>,
    pub duration: Option<f64>,
    pub paused_for_cache: bool,
    pub seeking: bool,
    pub idle_active: bool,
    pub eof_reached: bool,
}

pub struct MpvState {
    pub mpv: Arc<Mutex<Option<Mpv>>>,
    pub window_id: Arc<Mutex<Option<i64>>>,
}

impl MpvState {
    pub fn new() -> Self {
        let mpv = Self::create_mpv_instance();
        MpvState { 
            mpv: Arc::new(Mutex::new(Some(mpv))),
            window_id: Arc::new(Mutex::new(None)),
        }
    }

    fn create_mpv_instance() -> Mpv {
        Mpv::with_initializer(|init| {
            init.set_property("vo", "gpu-next")?;
            init.set_property("hwdec", "auto")?;
            init.set_property("keep-open", "always")?;
            init.set_property("idle", "once")?;
            init.set_property("msg-level", "all=debug")?;
            init.set_property("log-file", "./logs/mpv_log.txt")?;
            init.set_property("force-window", "no")?;   // yes to open new window for MPV
            init.set_property("wid", 0i64)?;
            Ok(())
        }).expect("Failed to initialize MPV")
    }

    fn recreate_mpv_instance(&self) -> Result<(), String> {
        let mut mpv_guard = self.mpv.lock().map_err(|e| e.to_string())?;
        let window_id_guard = self.window_id.lock().map_err(|e| e.to_string())?;
        
        // Crear nueva instancia
        let new_mpv = Self::create_mpv_instance();
        
        // Si tenemos un window_id guardado, aplicarlo a la nueva instancia
        if let Some(wid) = *window_id_guard {
            let _ = new_mpv.set_property("wid", wid);
            let _ = new_mpv.set_property("force-window", "yes");
        }
        
        *mpv_guard = Some(new_mpv);
        Ok(())
    }

    fn with_mpv<F, R>(&self, f: F) -> Result<R, String> 
    where
        F: FnOnce(&Mpv) -> Result<R, libmpv2::Error>
    {
        let mpv_guard = self.mpv.lock().map_err(|e| e.to_string())?;
        if let Some(ref mpv) = *mpv_guard {
            f(mpv).map_err(|e| e.to_string())
        } else {
            Err("MPV instance not available".to_string())
        }
    }
}

#[tauri::command]
pub fn embed_mpv(window: Window, state: State<MpvState>) -> Result<(), String> {
    if let Ok(window_handle) = window.window_handle() {
        let raw_handle = window_handle.as_raw();
        let mut window_id: Option<i64> = None;

        #[cfg(target_os = "windows")]
        {
            if let raw_window_handle::RawWindowHandle::Win32(handle) = raw_handle {
                let hwnd = handle.hwnd.get() as i64;
                window_id = Some(hwnd);
            }
        }

        #[cfg(target_os = "linux")]
        {
            use raw_window_handle::XlibWindowHandle;
            if let raw_window_handle::RawWindowHandle::Xlib(handle) = raw_handle {
                let wid = handle.window as i64;
                window_id = Some(wid);
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            use raw_window_handle::AppKitWindowHandle;
            if let raw_window_handle::RawWindowHandle::AppKit(handle) = raw_handle {
                let ns_window = handle.ns_window.as_ptr() as i64;
                window_id = Some(ns_window);
            }
        }

        if let Some(wid) = window_id {
            // Guardar el window_id para futuras recreaciones
            *state.window_id.lock().map_err(|e| e.to_string())? = Some(wid);
            
            // Aplicar a la instancia actual
            state.with_mpv(|mpv| {
                mpv.set_property("wid", wid)?;
                mpv.set_property("force-window", "yes")
            })?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn play(state: State<MpvState>) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("pause", false))
}

#[tauri::command]
pub fn pause(state: State<MpvState>) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("pause", true))
}

#[tauri::command]
pub fn toggle_play_pause(state: State<MpvState>) -> Result<(), String> {
    state.with_mpv(|mpv| {
        let is_paused: bool = mpv.get_property("pause")?;
        mpv.set_property("pause", !is_paused)
    })
}

#[tauri::command]
pub fn stop(state: State<MpvState>) -> Result<(), String> {
    // Primero intentamos parar el video actual
    let _ = state.with_mpv(|mpv| mpv.command("stop", &[]));
    
    // Luego recreamos la instancia de MPV para liberar recursos
    state.recreate_mpv_instance()?;
    
    Ok(())
}

#[tauri::command]
pub fn loadfile(state: State<MpvState>, file: String) -> Result<(), String> {
    use std::path::PathBuf;

    let pathbuf = PathBuf::from(&file);
    if !pathbuf.exists() {
        return Err(format!("File does not exist: {}", file));
    }

    let path_str = pathbuf.to_str().ok_or("Invalid path string")?.replace('\\', "/");
    let escaped_path = format!("\"{}\"", path_str);

    state.with_mpv(|mpv| {
        mpv.command("loadfile", &[escaped_path.as_str(), "replace"])
    })
}

#[tauri::command]
pub fn load_url(state: State<MpvState>, url: String) -> Result<(), String> {
    // Basic URL validation
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Invalid URL: must start with http:// or https://".to_string());
    }

    state.with_mpv(|mpv| {
        mpv.command("loadfile", &[url.as_str(), "replace"])
    })
}

#[tauri::command]
pub fn get_position(state: State<MpvState>) -> Result<f64, String> {
    state.with_mpv(|mpv| mpv.get_property("time-pos"))
}

#[tauri::command]
pub fn set_position(state: State<MpvState>, position: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("time-pos", position))
}

#[tauri::command]
pub fn get_duration(state: State<MpvState>) -> Result<f64, String> {
    state.with_mpv(|mpv| mpv.get_property("duration"))
}

#[tauri::command]
pub fn get_playback_status(state: State<MpvState>) -> Result<PlaybackStatus, String> {
    state.with_mpv(|mpv| {
        Ok(PlaybackStatus {
            position: mpv.get_property("time-pos").ok(),
            duration: mpv.get_property("duration").ok(),
            paused_for_cache: mpv.get_property("paused-for-cache").unwrap_or(false),
            seeking: mpv.get_property("seeking").unwrap_or(false),
            idle_active: mpv.get_property("idle-active").unwrap_or(false),
            eof_reached: mpv.get_property("eof-reached").unwrap_or(false),
        })
    })
}

#[tauri::command]
pub fn set_volume(state: State<MpvState>, volume: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("volume", volume))
}

#[tauri::command]
pub fn get_volume(state: State<MpvState>) -> Result<f64, String> {
    state.with_mpv(|mpv| mpv.get_property("volume"))
}

/// Cambia la pista de audio. Usa `0` para desactivar, `1`, `2`, etc. para cambiar.
#[tauri::command]
pub fn set_audio_track(state: State<MpvState>, track_id: i64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("aid", track_id))
}

/// Cambia la pista de subtítulos. Usa `0` para desactivar, `1`, `2`, etc. para cambiar.
#[tauri::command]
pub fn set_subtitle_track(state: State<MpvState>, track_id: i64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("sid", track_id))
}

/// Establece el nivel de zoom. 0 = sin zoom, valores positivos hacen zoom in, negativos zoom out.
#[tauri::command]
pub fn set_zoom(state: State<MpvState>, zoom_level: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("video-zoom", zoom_level))
}