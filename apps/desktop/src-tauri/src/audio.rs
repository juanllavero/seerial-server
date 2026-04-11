use std::sync::{Arc, Mutex};
use std::fs::File;
use std::io::BufReader;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use tauri::State;

pub struct KaraokeState {
    // We need to keep the stream alive so the audio keeps playing
    pub _stream: OutputStream,
    pub stream_handle: OutputStreamHandle,
    pub sink_inst: Arc<Mutex<Option<Sink>>>,
    pub sink_voice: Arc<Mutex<Option<Sink>>>,
}

impl KaraokeState {
    pub fn new() -> Self {
        // Initialize audio output stream and handle
        let (stream, stream_handle) = OutputStream::try_default().unwrap();
        KaraokeState {
            _stream: stream,
            stream_handle,
            sink_inst: Arc::new(Mutex::new(None)),
            sink_voice: Arc::new(Mutex::new(None)),
        }
    }
}

// ─── Karaoke Tauri Commands ──────────────────────────────────────────

#[tauri::command]
pub fn start_karaoke(state: State<KaraokeState>, inst_path: String, voice_path: String) -> Result<(), String> {
    let mut sink_inst = state.sink_inst.lock().unwrap();
    let mut sink_voice = state.sink_voice.lock().unwrap();

    // Create two independent players
    *sink_inst = Some(Sink::try_new(&state.stream_handle).unwrap());
    *sink_voice = Some(Sink::try_new(&state.stream_handle).unwrap());

    // Load the instrumental (uses symphonia under the hood for decoding)
    let file_inst = File::open(inst_path).map_err(|e| e.to_string())?;
    let source_inst = Decoder::new(BufReader::new(file_inst)).map_err(|e| e.to_string())?;
    
    // Load the voice
    let file_voice = File::open(voice_path).map_err(|e| e.to_string())?;
    let source_voice = Decoder::new(BufReader::new(file_voice)).map_err(|e| e.to_string())?;

    // Add to the queue
    sink_inst.as_ref().unwrap().append(source_inst);
    sink_voice.as_ref().unwrap().append(source_voice);

    // Start with both at maximum volume (visually mixed at 50/50)
    sink_inst.as_ref().unwrap().set_volume(1.0);
    sink_voice.as_ref().unwrap().set_volume(1.0);

    // Play
    sink_inst.as_ref().unwrap().play();
    sink_voice.as_ref().unwrap().play();

    Ok(())
}

#[tauri::command]
pub fn set_karaoke_mix(state: State<KaraokeState>, inst_vol: f32, voice_vol: f32) -> Result<(), String> {
    if let Some(sink) = state.sink_inst.lock().unwrap().as_ref() {
        sink.set_volume(inst_vol);
    }
    if let Some(sink) = state.sink_voice.lock().unwrap().as_ref() {
        sink.set_volume(voice_vol);
    }
    Ok(())
}

#[tauri::command]
pub fn stop_karaoke(state: State<KaraokeState>) -> Result<(), String> {
    if let Some(sink) = state.sink_inst.lock().unwrap().as_ref() {
        sink.stop();
    }
    if let Some(sink) = state.sink_voice.lock().unwrap().as_ref() {
        sink.stop();
    }
    Ok(())
}