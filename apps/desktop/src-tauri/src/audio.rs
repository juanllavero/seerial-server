use std::io::{BufReader, Cursor};
use std::sync::{
    atomic::{AtomicU32, Ordering},
    mpsc, Arc, Mutex,
};
use std::thread;
use std::time::{Duration, Instant};

use reqwest::blocking::Client;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use serde::Serialize;
use tauri::State;

pub enum KaraokeCommand {
    Start {
        inst_url: String,
        voice_url: String,
        position: f64,
        paused: bool,
        response: mpsc::Sender<Result<(), String>>,
    },
    SetMix {
        inst_vol: f32,
        voice_vol: f32,
        response: mpsc::Sender<Result<(), String>>,
    },
    Pause {
        response: mpsc::Sender<Result<(), String>>,
    },
    Resume {
        response: mpsc::Sender<Result<(), String>>,
    },
    Seek {
        position: f64,
        response: mpsc::Sender<Result<(), String>>,
    },
    Stop {
        response: mpsc::Sender<Result<(), String>>,
    },
    GetStatus {
        response: mpsc::Sender<Result<KaraokeStatus, String>>,
    },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KaraokeStatus {
    pub position: Option<f64>,
    pub duration: Option<f64>,
    pub eof_reached: bool,
    pub paused: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KaraokePreloadStatus {
    pub matches_request: bool,
    pub is_loading: bool,
    pub is_ready: bool,
    pub error: Option<String>,
}

pub struct KaraokeState {
    pub tx: Mutex<mpsc::Sender<KaraokeCommand>>,
    preload_cache: Arc<Mutex<KaraokePreloadCache>>,
}

struct KaraokePreloadCache {
    inst_url: Option<String>,
    voice_url: Option<String>,
    stems: Option<DecodedKaraokeStems>,
    is_loading: bool,
    error: Option<String>,
}

struct KaraokePlayback {
    inst_samples: Arc<Vec<f32>>,
    voice_samples: Arc<Vec<f32>>,
    sink: Sink,
    duration: Option<Duration>,
    base_position: Duration,
    started_at: Option<Instant>,
    channels: u16,
    sample_rate: u32,
    mix_state: Arc<KaraokeMixState>,
}

struct KaraokeMixState {
    inst_vol: AtomicU32,
    voice_vol: AtomicU32,
}

impl KaraokeMixState {
    fn new(inst_vol: f32, voice_vol: f32) -> Self {
        Self {
            inst_vol: AtomicU32::new(inst_vol.to_bits()),
            voice_vol: AtomicU32::new(voice_vol.to_bits()),
        }
    }

    fn get(&self) -> (f32, f32) {
        (
            f32::from_bits(self.inst_vol.load(Ordering::Relaxed)),
            f32::from_bits(self.voice_vol.load(Ordering::Relaxed)),
        )
    }

    fn set(&self, inst_vol: f32, voice_vol: f32) {
        self.inst_vol.store(inst_vol.to_bits(), Ordering::Relaxed);
        self.voice_vol.store(voice_vol.to_bits(), Ordering::Relaxed);
    }
}

struct KaraokeMixerSource {
    inst_samples: Arc<Vec<f32>>,
    voice_samples: Arc<Vec<f32>>,
    mix_state: Arc<KaraokeMixState>,
    channels: u16,
    sample_rate: u32,
    duration: Option<Duration>,
    position: usize,
    end: usize,
}

impl KaraokeMixerSource {
    fn new(
        inst_samples: Arc<Vec<f32>>,
        voice_samples: Arc<Vec<f32>>,
        mix_state: Arc<KaraokeMixState>,
        channels: u16,
        sample_rate: u32,
        start_position: Duration,
    ) -> Self {
        let end = inst_samples.len().max(voice_samples.len());
        let duration = samples_to_duration(end, channels, sample_rate);
        let position = duration_to_sample_index(start_position, channels, sample_rate, end);

        Self {
            inst_samples,
            voice_samples,
            mix_state,
            channels,
            sample_rate,
            duration,
            position,
            end,
        }
    }
}

impl Iterator for KaraokeMixerSource {
    type Item = f32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.position >= self.end {
            return None;
        }

        let (inst_vol, voice_vol) = self.mix_state.get();
        let inst_sample = self.inst_samples.get(self.position).copied().unwrap_or(0.0);
        let voice_sample = self.voice_samples.get(self.position).copied().unwrap_or(0.0);
        self.position += 1;

        Some((inst_sample * inst_vol + voice_sample * voice_vol).clamp(-1.0, 1.0))
    }
}

impl Source for KaraokeMixerSource {
    fn current_frame_len(&self) -> Option<usize> {
        None
    }

    fn channels(&self) -> u16 {
        self.channels
    }

    fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    fn total_duration(&self) -> Option<Duration> {
        self.duration
    }
}

impl KaraokePlayback {
    fn from_decoded_stems(
        stream_handle: &OutputStreamHandle,
        decoded_stems: DecodedKaraokeStems,
        position: Duration,
        paused: bool,
    ) -> Result<Self, String> {
        let mix_state = Arc::new(KaraokeMixState::new(1.0, 1.0));
        let (sink, duration) = build_sink(
            stream_handle,
            Arc::clone(&decoded_stems.inst_samples),
            Arc::clone(&decoded_stems.voice_samples),
            Arc::clone(&mix_state),
            decoded_stems.channels,
            decoded_stems.sample_rate,
            position,
            paused,
        )?;

        Ok(Self {
            inst_samples: decoded_stems.inst_samples,
            voice_samples: decoded_stems.voice_samples,
            sink,
            duration: duration.or(decoded_stems.duration),
            base_position: clamp_duration(position, duration),
            started_at: if paused { None } else { Some(Instant::now()) },
            channels: decoded_stems.channels,
            sample_rate: decoded_stems.sample_rate,
            mix_state,
        })
    }

    fn stop(self) {
        self.sink.stop();
    }

    fn current_position(&self) -> Duration {
        let current = match self.started_at {
            Some(started_at) => self.base_position.saturating_add(started_at.elapsed()),
            None => self.base_position,
        };

        clamp_duration(current, self.duration)
    }

    fn is_paused(&self) -> bool {
        self.started_at.is_none()
    }

    fn is_eof_reached(&self) -> bool {
        if self.sink.empty() {
            return true;
        }

        match self.duration {
            Some(duration) => self.current_position() >= duration,
            None => false,
        }
    }

    fn set_mix(
        &mut self,
        inst_vol: f32,
        voice_vol: f32,
    ) -> Result<(), String> {
        self.mix_state.set(inst_vol, voice_vol);
        Ok(())
    }

    fn pause(&mut self) {
        if self.started_at.is_none() {
            return;
        }

        self.base_position = self.current_position();
        self.started_at = None;
        self.sink.pause();
    }

    fn resume(&mut self) {
        if self.started_at.is_some() {
            return;
        }

        self.started_at = Some(Instant::now());
        self.sink.play();
    }

    fn seek(&mut self, stream_handle: &OutputStreamHandle, position: Duration) -> Result<(), String> {
        let paused = self.is_paused();
        let clamped = clamp_duration(position, self.duration);

        self.rebuild_sink_with_handle(stream_handle, clamped, paused)?;
        self.base_position = clamped;
        self.started_at = if paused { None } else { Some(Instant::now()) };

        Ok(())
    }

    fn rebuild_sink_with_handle(
        &mut self,
        stream_handle: &OutputStreamHandle,
        position: Duration,
        paused: bool,
    ) -> Result<(), String> {
        self.sink.stop();

        let (sink, duration) = build_sink(
            stream_handle,
            Arc::clone(&self.inst_samples),
            Arc::clone(&self.voice_samples),
            Arc::clone(&self.mix_state),
            self.channels,
            self.sample_rate,
            position,
            paused,
        )?;

        self.sink = sink;
        self.duration = duration.or(self.duration);

        Ok(())
    }

    fn status(&self) -> KaraokeStatus {
        KaraokeStatus {
            position: Some(self.current_position().as_secs_f64()),
            duration: self.duration.map(|duration| duration.as_secs_f64()),
            eof_reached: self.is_eof_reached(),
            paused: self.is_paused(),
        }
    }
}

fn clamp_duration(position: Duration, duration: Option<Duration>) -> Duration {
    match duration {
        Some(duration) if position > duration => duration,
        _ => position,
    }
}

fn fetch_audio_bytes(client: &Client, url: &str) -> Result<Vec<u8>, String> {
    let response = client
        .get(url)
        .send()
        .map_err(|error| format!("Failed to fetch karaoke source: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch karaoke source. HTTP status: {}",
            response.status()
        ));
    }

    response
        .bytes()
        .map(|bytes| bytes.to_vec())
        .map_err(|error| format!("Failed to read karaoke source bytes: {error}"))
}

fn fetch_and_decode_karaoke_stems(
    client: &Client,
    inst_url: &str,
    voice_url: &str,
) -> Result<DecodedKaraokeStems, String> {
    let inst_bytes = fetch_audio_bytes(client, inst_url)?;
    let voice_bytes = fetch_audio_bytes(client, voice_url)?;

    decode_karaoke_stems(&inst_bytes, &voice_bytes)
}

struct DecodedKaraokeStems {
    inst_samples: Arc<Vec<f32>>,
    voice_samples: Arc<Vec<f32>>,
    channels: u16,
    sample_rate: u32,
    duration: Option<Duration>,
}

impl Clone for DecodedKaraokeStems {
    fn clone(&self) -> Self {
        Self {
            inst_samples: Arc::clone(&self.inst_samples),
            voice_samples: Arc::clone(&self.voice_samples),
            channels: self.channels,
            sample_rate: self.sample_rate,
            duration: self.duration,
        }
    }
}

fn samples_to_duration(sample_count: usize, channels: u16, sample_rate: u32) -> Option<Duration> {
    if channels == 0 || sample_rate == 0 {
        return None;
    }

    let seconds = sample_count as f64 / (channels as f64 * sample_rate as f64);
    Some(Duration::from_secs_f64(seconds.max(0.0)))
}

fn duration_to_sample_index(
    position: Duration,
    channels: u16,
    sample_rate: u32,
    max_samples: usize,
) -> usize {
    if channels == 0 || sample_rate == 0 {
        return 0;
    }

    let raw_index = (position.as_secs_f64() * sample_rate as f64 * channels as f64).floor();
    let aligned_index = (raw_index as usize / channels as usize) * channels as usize;

    aligned_index.min(max_samples)
}

struct DecodedTrack {
    samples: Vec<f32>,
    channels: u16,
    sample_rate: u32,
    duration: Option<Duration>,
}

fn decode_track(bytes: &[u8], label: &str) -> Result<DecodedTrack, String> {
    let decoder = Decoder::new(BufReader::new(Cursor::new(bytes.to_vec())))
        .map_err(|error| format!("Failed to decode {label} karaoke source: {error}"))?;
    let channels = decoder.channels().max(1);
    let sample_rate = decoder.sample_rate().max(1);
    let duration = decoder.total_duration();
    let samples = decoder
        .map(|sample| sample as f32 / i16::MAX as f32)
        .collect::<Vec<f32>>();

    Ok(DecodedTrack {
        samples,
        channels,
        sample_rate,
        duration,
    })
}

fn convert_channels(samples: &[f32], from_channels: u16, to_channels: u16) -> Vec<f32> {
    if from_channels == to_channels {
        return samples.to_vec();
    }

    let from_channels = from_channels.max(1) as usize;
    let to_channels = to_channels.max(1) as usize;
    let mut output = Vec::with_capacity((samples.len() / from_channels) * to_channels);

    for frame in samples.chunks(from_channels) {
        if to_channels == 1 {
            let sum = frame.iter().copied().sum::<f32>();
            output.push(sum / from_channels as f32);
            continue;
        }

        if from_channels == 1 {
            let mono = frame.first().copied().unwrap_or(0.0);
            for channel_index in 0..to_channels {
                output.push(if channel_index < 2 { mono } else { 0.0 });
            }
            continue;
        }

        for channel_index in 0..to_channels {
            output.push(frame.get(channel_index).copied().unwrap_or(0.0));
        }
    }

    output
}

fn resample_samples(samples: &[f32], channels: u16, from_rate: u32, to_rate: u32) -> Vec<f32> {
    if from_rate == to_rate {
        return samples.to_vec();
    }

    let channels = channels.max(1) as usize;
    let input_frames = samples.len() / channels;

    if input_frames == 0 {
        return Vec::new();
    }

    let output_frames = ((input_frames as f64) * to_rate as f64 / from_rate as f64).round() as usize;
    let output_frames = output_frames.max(1);
    let mut output = Vec::with_capacity(output_frames * channels);

    for output_frame in 0..output_frames {
        let source_position = output_frame as f64 * from_rate as f64 / to_rate as f64;
        let left_frame = source_position.floor() as usize;
        let right_frame = left_frame.min(input_frames - 1).saturating_add(1).min(input_frames - 1);
        let interpolation = (source_position - left_frame as f64) as f32;

        for channel_index in 0..channels {
            let left_sample = samples[left_frame.min(input_frames - 1) * channels + channel_index];
            let right_sample = samples[right_frame * channels + channel_index];
            output.push(left_sample + (right_sample - left_sample) * interpolation);
        }
    }

    output
}

fn normalize_track(track: DecodedTrack, target_channels: u16, target_sample_rate: u32) -> Vec<f32> {
    let channel_converted = convert_channels(&track.samples, track.channels, target_channels);
    resample_samples(
        &channel_converted,
        target_channels,
        track.sample_rate,
        target_sample_rate,
    )
}

fn decode_karaoke_stems(
    inst_bytes: &[u8],
    voice_bytes: &[u8],
) -> Result<DecodedKaraokeStems, String> {
    let inst_track = decode_track(inst_bytes, "instrumental")?;
    let voice_track = decode_track(voice_bytes, "vocals")?;

    let target_channels = if inst_track.channels == 1 && voice_track.channels == 1 {
        1
    } else {
        2
    };
    let target_sample_rate = inst_track.sample_rate.max(voice_track.sample_rate).max(1);

    let inst_duration = inst_track.duration;
    let voice_duration = voice_track.duration;

    let inst_samples = normalize_track(inst_track, target_channels, target_sample_rate);
    let voice_samples = normalize_track(voice_track, target_channels, target_sample_rate);

    let computed_duration = samples_to_duration(
        inst_samples.len().max(voice_samples.len()),
        target_channels,
        target_sample_rate,
    );

    Ok(DecodedKaraokeStems {
        inst_samples: Arc::new(inst_samples),
        voice_samples: Arc::new(voice_samples),
        channels: target_channels,
        sample_rate: target_sample_rate,
        duration: computed_duration.or(inst_duration).or(voice_duration),
    })
}

fn build_sink(
    stream_handle: &OutputStreamHandle,
    inst_samples: Arc<Vec<f32>>,
    voice_samples: Arc<Vec<f32>>,
    mix_state: Arc<KaraokeMixState>,
    channels: u16,
    sample_rate: u32,
    position: Duration,
    paused: bool,
) -> Result<(Sink, Option<Duration>), String> {
    let sink = Sink::try_new(stream_handle)
        .map_err(|error| format!("Failed to create karaoke sink: {error}"))?;

    let total_samples = inst_samples.len().max(voice_samples.len());
    let duration = samples_to_duration(total_samples, channels, sample_rate);
    let source = KaraokeMixerSource::new(
        inst_samples,
        voice_samples,
        mix_state,
        channels,
        sample_rate,
        clamp_duration(position, duration),
    );
    sink.append(source);

    if paused {
        sink.pause();
    } else {
        sink.play();
    }

    Ok((sink, duration))
}

fn send_response<T>(response: mpsc::Sender<Result<T, String>>, result: Result<T, String>) {
    let _ = response.send(result);
}

impl KaraokeState {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel();
        let preload_cache = Arc::new(Mutex::new(KaraokePreloadCache {
            inst_url: None,
            voice_url: None,
            stems: None,
            is_loading: false,
            error: None,
        }));
        let preload_cache_for_thread = Arc::clone(&preload_cache);

        thread::spawn(move || {
            let stream_result = OutputStream::try_default();
            let (_stream, stream_handle) = match stream_result {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Fatal error: Could not initialize audio output: {e}");
                    return;
                }
            };

            let client = match Client::builder().build() {
                Ok(client) => client,
                Err(error) => {
                    eprintln!("Fatal error: Could not initialize karaoke HTTP client: {error}");
                    return;
                }
            };

            let mut playback: Option<KaraokePlayback> = None;

            while let Ok(command) = rx.recv() {
                match command {
                    KaraokeCommand::Start {
                        inst_url,
                        voice_url,
                        position,
                        paused,
                        response,
                    } => {
                        if let Some(active_playback) = playback.take() {
                            active_playback.stop();
                        }

                        let start_result = (|| {
                            let start_position = Duration::from_secs_f64(position.max(0.0));
                            let stems = {
                                let cache = preload_cache_for_thread
                                    .lock()
                                    .map_err(|error| error.to_string())?;

                                match cache.stems.as_ref() {
                                    Some(stems)
                                        if cache.inst_url.as_deref() == Some(inst_url.as_str())
                                            && cache.voice_url.as_deref() == Some(voice_url.as_str()) =>
                                    {
                                        stems.clone()
                                    }
                                    _ => fetch_and_decode_karaoke_stems(&client, &inst_url, &voice_url)?,
                                }
                            };

                            let next_playback = KaraokePlayback::from_decoded_stems(
                                &stream_handle,
                                stems,
                                start_position,
                                paused,
                            )?;

                            playback = Some(next_playback);
                            Ok(())
                        })();

                        send_response(response, start_result);
                    }
                    KaraokeCommand::SetMix {
                        inst_vol,
                        voice_vol,
                        response,
                    } => {
                        let result = if let Some(active_playback) = playback.as_mut() {
                            active_playback.set_mix(inst_vol, voice_vol)
                        } else {
                            Err("Karaoke playback is not active".to_string())
                        };

                        send_response(response, result);
                    }
                    KaraokeCommand::Pause { response } => {
                        let result = if let Some(active_playback) = playback.as_mut() {
                            active_playback.pause();
                            Ok(())
                        } else {
                            Err("Karaoke playback is not active".to_string())
                        };

                        send_response(response, result);
                    }
                    KaraokeCommand::Resume { response } => {
                        let result = if let Some(active_playback) = playback.as_mut() {
                            active_playback.resume();
                            Ok(())
                        } else {
                            Err("Karaoke playback is not active".to_string())
                        };

                        send_response(response, result);
                    }
                    KaraokeCommand::Seek { position, response } => {
                        let result = if let Some(active_playback) = playback.as_mut() {
                            active_playback.seek(
                                &stream_handle,
                                Duration::from_secs_f64(position.max(0.0)),
                            )
                        } else {
                            Err("Karaoke playback is not active".to_string())
                        };

                        send_response(response, result);
                    }
                    KaraokeCommand::Stop { response } => {
                        if let Some(active_playback) = playback.take() {
                            active_playback.stop();
                        }

                        send_response(response, Ok(()));
                    }
                    KaraokeCommand::GetStatus { response } => {
                        let result = match playback.as_ref() {
                            Some(active_playback) => Ok(active_playback.status()),
                            None => Ok(KaraokeStatus {
                                position: None,
                                duration: None,
                                eof_reached: false,
                                paused: true,
                            }),
                        };

                        send_response(response, result);
                    }
                }
            }
        });

        KaraokeState {
            tx: Mutex::new(tx),
            preload_cache,
        }
    }
}

fn send_command(state: &State<'_, KaraokeState>, command: KaraokeCommand) -> Result<(), String> {
    let tx = state.inner().tx.lock().map_err(|error| error.to_string())?;
    tx.send(command).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn preload_karaoke(
    state: State<'_, KaraokeState>,
    inst_url: String,
    voice_url: String,
) -> Result<(), String> {
    {
        let mut cache = state
            .preload_cache
            .lock()
            .map_err(|error| error.to_string())?;

        if cache.inst_url.as_deref() == Some(inst_url.as_str())
            && cache.voice_url.as_deref() == Some(voice_url.as_str())
            && (cache.is_loading || cache.stems.is_some())
        {
            return Ok(());
        }

        cache.inst_url = Some(inst_url.clone());
        cache.voice_url = Some(voice_url.clone());
        cache.stems = None;
        cache.is_loading = true;
        cache.error = None;
    }

    let preload_cache = Arc::clone(&state.preload_cache);

    thread::spawn(move || {
        let result = Client::builder()
            .build()
            .map_err(|error| error.to_string())
            .and_then(|client| fetch_and_decode_karaoke_stems(&client, &inst_url, &voice_url));

        if let Ok(mut cache) = preload_cache.lock() {
            if cache.inst_url.as_deref() != Some(inst_url.as_str())
                || cache.voice_url.as_deref() != Some(voice_url.as_str())
            {
                return;
            }

            cache.is_loading = false;

            match result {
                Ok(stems) => {
                    cache.stems = Some(stems);
                    cache.error = None;
                }
                Err(error) => {
                    cache.stems = None;
                    cache.error = Some(error);
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn get_karaoke_preload_status(state: State<'_, KaraokeState>) -> Result<KaraokePreloadStatus, String> {
    let cache = state
        .preload_cache
        .lock()
        .map_err(|error| error.to_string())?;

    Ok(KaraokePreloadStatus {
        matches_request: true,
        is_loading: cache.is_loading,
        is_ready: cache.stems.is_some(),
        error: cache.error.clone(),
    })
}

#[tauri::command]
pub fn get_karaoke_preload_status_for_urls(
    state: State<'_, KaraokeState>,
    inst_url: String,
    voice_url: String,
) -> Result<KaraokePreloadStatus, String> {
    let cache = state
        .preload_cache
        .lock()
        .map_err(|error| error.to_string())?;

    let matches_request = cache.inst_url.as_deref() == Some(inst_url.as_str())
        && cache.voice_url.as_deref() == Some(voice_url.as_str());

    Ok(KaraokePreloadStatus {
        matches_request,
        is_loading: matches_request && cache.is_loading,
        is_ready: matches_request && cache.stems.is_some(),
        error: if matches_request { cache.error.clone() } else { None },
    })
}

#[tauri::command]
pub fn reset_karaoke_preload(state: State<'_, KaraokeState>) -> Result<(), String> {
    let mut cache = state
        .preload_cache
        .lock()
        .map_err(|error| error.to_string())?;

    cache.inst_url = None;
    cache.voice_url = None;
    cache.stems = None;
    cache.is_loading = false;
    cache.error = None;

    Ok(())
}

#[tauri::command]
pub fn start_karaoke(
    state: State<'_, KaraokeState>,
    inst_url: String,
    voice_url: String,
    position: Option<f64>,
    paused: Option<bool>,
) -> Result<(), String> {
    let (response_tx, response_rx) = mpsc::channel();

    send_command(
        &state,
        KaraokeCommand::Start {
            inst_url,
            voice_url,
            position: position.unwrap_or(0.0),
            paused: paused.unwrap_or(false),
            response: response_tx,
        },
    )?;

    response_rx.recv().map_err(|error| error.to_string())?
}

#[tauri::command]
pub fn set_karaoke_mix(state: State<'_, KaraokeState>, inst_vol: f32, voice_vol: f32) -> Result<(), String> {
    let (response_tx, response_rx) = mpsc::channel();

    send_command(
        &state,
        KaraokeCommand::SetMix {
            inst_vol,
            voice_vol,
            response: response_tx,
        },
    )?;

    response_rx.recv().map_err(|error| error.to_string())?
}

#[tauri::command]
pub fn pause_karaoke(state: State<'_, KaraokeState>) -> Result<(), String> {
    let (response_tx, response_rx) = mpsc::channel();

    send_command(
        &state,
        KaraokeCommand::Pause {
            response: response_tx,
        },
    )?;

    response_rx.recv().map_err(|error| error.to_string())?
}

#[tauri::command]
pub fn resume_karaoke(state: State<'_, KaraokeState>) -> Result<(), String> {
    let (response_tx, response_rx) = mpsc::channel();

    send_command(
        &state,
        KaraokeCommand::Resume {
            response: response_tx,
        },
    )?;

    response_rx.recv().map_err(|error| error.to_string())?
}

#[tauri::command]
pub fn seek_karaoke(state: State<'_, KaraokeState>, position: f64) -> Result<(), String> {
    let (response_tx, response_rx) = mpsc::channel();

    send_command(
        &state,
        KaraokeCommand::Seek {
            position,
            response: response_tx,
        },
    )?;

    response_rx.recv().map_err(|error| error.to_string())?
}

#[tauri::command]
pub fn stop_karaoke(state: State<'_, KaraokeState>) -> Result<(), String> {
    let (response_tx, response_rx) = mpsc::channel();

    send_command(
        &state,
        KaraokeCommand::Stop {
            response: response_tx,
        },
    )?;

    response_rx.recv().map_err(|error| error.to_string())?
}

#[tauri::command]
pub fn get_karaoke_status(state: State<'_, KaraokeState>) -> Result<KaraokeStatus, String> {
    let (response_tx, response_rx) = mpsc::channel();

    send_command(
        &state,
        KaraokeCommand::GetStatus {
            response: response_tx,
        },
    )?;

    response_rx.recv().map_err(|error| error.to_string())?
}