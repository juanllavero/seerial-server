use std::fs::File;
use std::io::BufReader;
use std::sync::{mpsc, Mutex};
use std::thread;
use rodio::{Decoder, OutputStream, Sink};
use tauri::State;

// ─── 1. Define the messages we can send to the audio thread ──────────────────
pub enum KaraokeCommand {
    Start(String, String), // File paths (Instrumental, Voice)
    SetMix(f32, f32),      // Volume levels (Instrumental, Voice)
    Stop,
}

// ─── 2. The state now only stores the channel's Sender ───────────────────────
pub struct KaraokeState {
    // We use Mutex because Sender is `Send`, but not `Sync`. Mutex provides both,
    // making it safe to share across Tauri's command threads.
    pub tx: Mutex<mpsc::Sender<KaraokeCommand>>,
}

impl KaraokeState {
    pub fn new() -> Self {
        // Create a communication channel (Transmitter -> Receiver)
        let (tx, rx) = mpsc::channel();

        // ─── 3. Spawn the dedicated audio thread ─────────────────────────────
        thread::spawn(move || {
            // IMPORTANT! The OutputStream is created and kept alive in this thread.
            // This satisfies Rust's and the OS's strict audio thread-safety rules.
            let stream_result = OutputStream::try_default();
            let (_stream, stream_handle) = match stream_result {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Fatal Error: Could not initialize audio output: {}", e);
                    return; // Terminate the thread gracefully if no audio device is found
                }
            };

            let mut sink_inst: Option<Sink> = None;
            let mut sink_voice: Option<Sink> = None;

            // Infinite loop: The thread actively listens for incoming messages
            while let Ok(command) = rx.recv() {
                match command {
                    KaraokeCommand::Start(inst_path, voice_path) => {
                        // If tracks were already playing, stop them first
                        if let Some(s) = sink_inst.take() { s.stop(); }
                        if let Some(s) = sink_voice.take() { s.stop(); }

                        // Create new audio sinks
                        let new_inst = Sink::try_new(&stream_handle).unwrap();
                        let new_voice = Sink::try_new(&stream_handle).unwrap();

                        // Load and decode the audio files
                        if let Ok(file) = File::open(inst_path) {
                            if let Ok(source) = Decoder::new(BufReader::new(file)) {
                                new_inst.append(source);
                            }
                        }

                        if let Ok(file) = File::open(voice_path) {
                            if let Ok(source) = Decoder::new(BufReader::new(file)) {
                                new_voice.append(source);
                            }
                        }

                        // Start playback at full volume for both tracks (50/50 mix visually)
                        new_inst.set_volume(1.0);
                        new_voice.set_volume(1.0);
                        new_inst.play();
                        new_voice.play();

                        // Store the active sink references in the thread's local state
                        sink_inst = Some(new_inst);
                        sink_voice = Some(new_voice);
                    }
                    KaraokeCommand::SetMix(inst_vol, voice_vol) => {
                        // Update volumes on the fly instantly
                        if let Some(s) = &sink_inst { s.set_volume(inst_vol); }
                        if let Some(s) = &sink_voice { s.set_volume(voice_vol); }
                    }
                    KaraokeCommand::Stop => {
                        // Stop playback and drop the sinks
                        if let Some(s) = sink_inst.take() { s.stop(); }
                        if let Some(s) = sink_voice.take() { s.stop(); }
                    }
                }
            }
        });

        // We only store the "transmitter" half of the channel in the Global State
        KaraokeState {
            tx: Mutex::new(tx),
        }
    }
}

// ─── 4. Tauri Commands (Safely interact with the audio thread) ───────────────

#[tauri::command]
pub fn start_karaoke(state: State<'_, KaraokeState>, inst_path: String, voice_path: String) -> Result<(), String> {
    // We use .inner() to access the actual struct and avoid "hidden field" scope errors
    let tx = state.inner().tx.lock().unwrap();
    tx.send(KaraokeCommand::Start(inst_path, voice_path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_karaoke_mix(state: State<'_, KaraokeState>, inst_vol: f32, voice_vol: f32) -> Result<(), String> {
    let tx = state.inner().tx.lock().unwrap();
    tx.send(KaraokeCommand::SetMix(inst_vol, voice_vol)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stop_karaoke(state: State<'_, KaraokeState>) -> Result<(), String> {
    let tx = state.inner().tx.lock().unwrap();
    tx.send(KaraokeCommand::Stop).map_err(|e| e.to_string())
}