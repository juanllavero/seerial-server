use std::sync::{Arc, Mutex};
use libmpv2::{Mpv, mpv_node::MpvNode};
use serde::Serialize;
use tauri::{State, Window};
use raw_window_handle::{HasWindowHandle};

// ─── Enums ───────────────────────────────────────────────────────────────────

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum SubtitleColor {
    White, Yellow, Black, Cyan, Blue, Green, Magenta, Red, Gray,
    Orange, Gold, Pink,
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum SubtitleSize {
    Tiny, Small, Normal, Large, Huge,
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum SubtitlePosition {
    BottomLeft, BottomCenter, BottomRight,
    TopLeft, TopCenter, TopRight,
}

fn get_window_id<W: HasWindowHandle>(window: &W) -> Option<i64> {
    let window_handle = window.window_handle().ok()?;
    let raw_handle = window_handle.as_raw();

    #[cfg(target_os = "windows")]
    {
        if let raw_window_handle::RawWindowHandle::Win32(handle) = raw_handle {
            return Some(handle.hwnd.get() as i64);
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let raw_window_handle::RawWindowHandle::Xlib(handle) = raw_handle {
            return Some(handle.window as i64);
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let raw_window_handle::RawWindowHandle::AppKit(handle) = raw_handle {
            return Some(handle.ns_window.as_ptr() as i64);
        }
    }

    None
}

pub fn bind_mpv_to_window<W: HasWindowHandle>(window: &W, state: &MpvState) -> Result<(), String> {
    let Some(wid) = get_window_id(window) else {
        return Ok(());
    };

    *state.window_id.lock().map_err(|e| e.to_string())? = Some(wid);

    state.with_mpv(|mpv| {
        mpv.set_property("wid", wid)?;
        mpv.set_property("force-window", "yes")
    })
}

fn map_ff_index_to_mpv_track_id(mpv: &Mpv, track_type: &str, ff_index: i64) -> Result<i64, libmpv2::Error> {
    let track_list: MpvNode = mpv.get_property("track-list")?;

    let Some(track_items) = track_list.array() else {
        return Ok(ff_index);
    };

    for track in track_items {
        let Some(fields) = track.map() else {
            continue;
        };

        let mut current_type: Option<String> = None;
        let mut current_ff_index: Option<i64> = None;
        let mut current_id: Option<i64> = None;

        for (key, value) in fields {
            match key.as_str() {
                "type" => {
                    current_type = value.str().map(ToOwned::to_owned);
                }
                "ff-index" => {
                    current_ff_index = value.i64();
                }
                "id" => {
                    current_id = value.i64();
                }
                _ => {}
            }
        }

        if current_type.as_deref() == Some(track_type) && current_ff_index == Some(ff_index) {
            if let Some(id) = current_id {
                return Ok(id);
            }
        }
    }

    Ok(ff_index)
}

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

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum VideoQuality {
    Low,
    Normal,
    High,
    Ultra,
    GpuSuffer,
}

#[tauri::command]
pub fn set_video_quality(state: State<MpvState>, quality: VideoQuality) -> Result<(), String> {
    state.with_mpv(|mpv| {
        match quality {
            VideoQuality::Low => {
                mpv.command("apply-profile", &["fast"])?;
                mpv.set_property("hwdec", "auto")?;
            }
            VideoQuality::Normal => {
                mpv.set_property("scale", "spline36")?;
                mpv.set_property("cscale", "spline36")?;
                mpv.set_property("dscale", "mitchell")?;
                mpv.set_property("dither-depth", "auto")?;
                mpv.set_property("correct-downscaling", true)?;
                mpv.set_property("linear-downscaling", true)?;
                mpv.set_property("sigmoid-upscaling", false)?;
                mpv.set_property("deband", false)?;
                mpv.set_property("hwdec", "auto")?;
            }
            VideoQuality::High => {
                mpv.command("apply-profile", &["high-quality"])?;
                // high-quality: ewa_lanczossharp + antiring 0.6 + HDR peak/contrast
                mpv.set_property("dscale", "mitchell")?;
                mpv.set_property("dither-depth", "auto")?;
                mpv.set_property("correct-downscaling", true)?;
                mpv.set_property("linear-downscaling", true)?;
                mpv.set_property("sigmoid-upscaling", true)?;
                mpv.set_property("deband", true)?;
                mpv.set_property("deband-iterations", 2i64)?;
            }
            VideoQuality::Ultra => {
                mpv.command("apply-profile", &["high-quality"])?;
                mpv.set_property("scale", "ewa_lanczos4sharpest")?;
                mpv.set_property("cscale", "ewa_lanczos4sharpest")?;
                mpv.set_property("dscale", "mitchell")?;
                mpv.set_property("scale-antiring", 0.7f64)?;
                mpv.set_property("cscale-antiring", 0.7f64)?;
                mpv.set_property("dither-depth", "auto")?;
                mpv.set_property("correct-downscaling", true)?;
                mpv.set_property("linear-downscaling", true)?;
                mpv.set_property("sigmoid-upscaling", true)?;
                mpv.set_property("deband", true)?;
                mpv.set_property("deband-iterations", 4i64)?;
                mpv.set_property("deband-threshold", 48i64)?;
            }
            VideoQuality::GpuSuffer => {
                mpv.command("apply-profile", &["high-quality"])?;
                mpv.set_property("scale", "ewa_lanczos4sharpest")?;
                mpv.set_property("cscale", "ewa_lanczos4sharpest")?;
                mpv.set_property("dscale", "ewa_lanczos4sharpest")?;
                mpv.set_property("scale-antiring", 1.0f64)?;
                mpv.set_property("cscale-antiring", 1.0f64)?;
                mpv.set_property("dither-depth", "auto")?;
                mpv.set_property("correct-downscaling", true)?;
                mpv.set_property("linear-downscaling", true)?;
                mpv.set_property("sigmoid-upscaling", true)?;
                mpv.set_property("deband", true)?;
                mpv.set_property("deband-iterations", 4i64)?;
                mpv.set_property("deband-threshold", 64i64)?;
                mpv.set_property("deband-range", 24i64)?;
                mpv.set_property("icc-profile-auto", true)?;
            }
        }
        Ok(())
    })
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
            init.set_property("cursor-autohide", "100")?;
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
        
        // Create a new instance
        let new_mpv = Self::create_mpv_instance();
        
        // If we have a saved window_id, apply it to the new instance
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
    bind_mpv_to_window(&window, &state)
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
    // Stop current playback first.
    let _ = state.with_mpv(|mpv| mpv.command("stop", &[]));
    
    // Recreate the MPV instance to release resources.
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

/// Set audio track. Incoming track_id is an ffprobe stream index.
/// We map it to mpv `track-list/N/id` through `track-list/N/ff-index`.
#[tauri::command]
pub fn set_audio_track(state: State<MpvState>, track_id: i64) -> Result<(), String> {
    state.with_mpv(|mpv| {
        let resolved_track_id = if track_id <= 0 {
            track_id
        } else {
            map_ff_index_to_mpv_track_id(mpv, "audio", track_id)?
        };

        mpv.set_property("aid", resolved_track_id)
    })
}

/// Set subtitle track. Incoming track_id is an ffprobe stream index.
/// We map it to mpv `track-list/N/id` through `track-list/N/ff-index`.
#[tauri::command]
pub fn set_subtitle_track(state: State<MpvState>, track_id: i64) -> Result<(), String> {
    state.with_mpv(|mpv| {
        let resolved_track_id = if track_id <= 0 {
            track_id
        } else {
            map_ff_index_to_mpv_track_id(mpv, "sub", track_id)?
        };

        mpv.set_property("sid", resolved_track_id)
    })
}

/// Set zoom level. 0 = no zoom, positive values zoom in, negative values zoom out.
#[tauri::command]
pub fn set_zoom(state: State<MpvState>, zoom_level: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("video-zoom", zoom_level))
}

#[tauri::command]
pub fn set_audio_delay(state: State<MpvState>, delay: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("audio-delay", delay))
}

#[tauri::command]
pub fn set_subtitle_delay(state: State<MpvState>, delay: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("sub-delay", delay))
}

#[tauri::command]
pub fn set_subtitle_font_size(state: State<MpvState>, size: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("sub-font-size", size))
}

#[tauri::command]
pub fn set_subtitle_color(state: State<MpvState>, color: String) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("sub-color", color.as_str()))
}

#[tauri::command]
pub fn set_subtitle_border_size(state: State<MpvState>, size: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("sub-border-size", size))
}

#[tauri::command]
pub fn set_subtitle_shadow_offset(state: State<MpvState>, offset: f64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("sub-shadow-offset", offset))
}

#[tauri::command]
pub fn set_subtitle_position(state: State<MpvState>, position: i64) -> Result<(), String> {
    state.with_mpv(|mpv| mpv.set_property("sub-pos", position))
}

// ─── Video ───────────────────────────────────────────────────────────────────

/// Toggles hardware-accelerated decoding. When enabled, uses the best
/// available decoder automatically (NVDEC, DXVA2, VAAPI, etc.).
#[tauri::command]
pub fn set_hwdec(state: State<MpvState>, enabled: bool) -> Result<(), String> {
    state.with_mpv(|mpv| {
        mpv.set_property("hwdec", if enabled { "auto" } else { "no" })
    })
}

/// Switches video sync mode to `display-resample` so MPV resamples audio
/// to match the display refresh rate, reducing judder on mismatched content.
/// Note: actual OS-level refresh rate switching is not possible via libmpv
/// and would require native system calls per platform.
#[tauri::command]
pub fn set_display_sync(state: State<MpvState>, enabled: bool) -> Result<(), String> {
    state.with_mpv(|mpv| {
        mpv.set_property(
            "video-sync",
            if enabled { "display-resample" } else { "audio" },
        )
    })
}

/// Enables HDR passthrough by hinting the target colorspace to the display,
/// letting the monitor/driver handle HDR tone-mapping natively.
/// Note: switching the OS HDR mode itself is outside libmpv's scope.
#[tauri::command]
pub fn set_hdr_passthrough(state: State<MpvState>, enabled: bool) -> Result<(), String> {
    state.with_mpv(|mpv| {
        mpv.set_property("target-colorspace-hint", enabled)
    })
}

// ─── Audio ───────────────────────────────────────────────────────────────────

/// Normalizes multichannel audio when downmixing to stereo,
/// preventing volume spikes on surround content.
#[tauri::command]
pub fn set_audio_normalize(state: State<MpvState>, enabled: bool) -> Result<(), String> {
    state.with_mpv(|mpv| {
        mpv.set_property("audio-normalize-downmix", enabled)
    })
}

/// Requests exclusive access to the audio device, bypassing the OS mixer.
/// Useful for bit-perfect playback; may block other system audio.
#[tauri::command]
pub fn set_audio_exclusive(state: State<MpvState>, enabled: bool) -> Result<(), String> {
    state.with_mpv(|mpv| {
        mpv.set_property("audio-exclusive", enabled)
    })
}

/// Enables S/PDIF passthrough for lossless and lossy surround formats
/// (AC3, DTS, E-AC3, DTS-HD MA, TrueHD). When disabled, MPV decodes internally.
#[tauri::command]
pub fn set_audio_passthrough(state: State<MpvState>, enabled: bool) -> Result<(), String> {
    state.with_mpv(|mpv| {
        mpv.set_property(
            "audio-spdif",
            if enabled { "ac3,dts,eac3,dts-hd,truehd" } else { "" },
        )
    })
}

// ─── Subtitles ───────────────────────────────────────────────────────────────

/// Sets subtitle text color using a predefined palette.
/// Colors are expressed as RGBA hex strings (`#RRGGBBAA`).
#[tauri::command]
pub fn set_subtitle_color_preset(state: State<MpvState>, color: SubtitleColor) -> Result<(), String> {
    let hex = match color {
        SubtitleColor::White   => "#FFFFFFFF",
        SubtitleColor::Yellow  => "#FFFF00FF",
        SubtitleColor::Black   => "#000000FF",
        SubtitleColor::Cyan    => "#00FFFFFF",
        SubtitleColor::Blue    => "#0000FFFF",
        SubtitleColor::Green   => "#00FF00FF",
        SubtitleColor::Magenta => "#FF00FFFF",
        SubtitleColor::Red     => "#FF0000FF",
        SubtitleColor::Gray    => "#808080FF",
        SubtitleColor::Orange  => "#FF8000FF",
        SubtitleColor::Gold    => "#FFD700FF",
        SubtitleColor::Pink    => "#FF69B4FF",
    };
    state.with_mpv(|mpv| mpv.set_property("sub-color", hex))
}

/// Maps a named size preset to a concrete `sub-font-size` value.
/// Values are tuned for a typical 1080p/4K living-room viewing distance.
#[tauri::command]
pub fn set_subtitle_size_preset(state: State<MpvState>, size: SubtitleSize) -> Result<(), String> {
    let value: f64 = match size {
        SubtitleSize::Tiny   => 18.0,
        SubtitleSize::Small  => 28.0,
        SubtitleSize::Normal => 40.0,
        SubtitleSize::Large  => 55.0,
        SubtitleSize::Huge   => 72.0,
    };
    state.with_mpv(|mpv| mpv.set_property("sub-font-size", value))
}

/// Positions subtitles using a combination of `sub-pos` (vertical %, 0 = top),
/// `sub-align-x` (horizontal alignment), and `sub-align-y` (vertical anchor).
#[tauri::command]
pub fn set_subtitle_position_preset(state: State<MpvState>, position: SubtitlePosition) -> Result<(), String> {
    state.with_mpv(|mpv| {
        let (pos, align_x, align_y) = match position {
            SubtitlePosition::BottomLeft   => (95i64, "left",   "bottom"),
            SubtitlePosition::BottomCenter => (95i64, "center", "bottom"),
            SubtitlePosition::BottomRight  => (95i64, "right",  "bottom"),
            SubtitlePosition::TopLeft      => (5i64,  "left",   "top"),
            SubtitlePosition::TopCenter    => (5i64,  "center", "top"),
            SubtitlePosition::TopRight     => (5i64,  "right",  "top"),
        };
        mpv.set_property("sub-pos", pos)?;
        mpv.set_property("sub-align-x", align_x)?;
        mpv.set_property("sub-align-y", align_y)
    })
}