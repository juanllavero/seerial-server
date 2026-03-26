import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type {
  AudioTrack,
  MediaInfoData,
  PlayBackConfig,
  SubtitleTrack,
  Video,
} from '@seerial/domain';
import { getAudioTrack, getSubtitleTrack } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Captions, Music2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import { authenticatedFetch } from '@/lib/auth';

type SelectorPanel = 'audio' | 'subtitle';

const IMAGE_SUBTITLE_CODECS = ['HDMV_PGS_SUBTITLE', 'DVD_SUBTITLE'];

interface TracksSelectorsProps {
  video: Video;
  videoInfo?: MediaInfoData;
  playbackConfig?: PlayBackConfig;
}

function updateSelectedTrack<T extends { id: number; selected: boolean }>(
  trackList: T[],
  selectedTrackId: number | null,
) {
  return trackList.map((track) => ({
    ...track,
    selected: selectedTrackId !== null && track.id === selectedTrackId,
  }));
}

function getTrackFocusKey(panel: SelectorPanel, trackId: number) {
  return `${panel}-track-${trackId}`;
}

function TracksSelectors({ video, videoInfo, playbackConfig }: TracksSelectorsProps) {
  const { i18n, t } = useTranslation();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [openPanel, setOpenPanel] = useState<SelectorPanel | null>(null);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(
    video.audioTracks?.find((track) => track.selected) || null,
  );
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<SubtitleTrack | null>(
    video.subtitleTracks?.find((track) => track.selected) || null,
  );
  const [tracks, setTracks] = useState<{
    audioTracks: AudioTrack[];
    subtitleTracks: SubtitleTrack[];
  }>({
    audioTracks: video.audioTracks || [],
    subtitleTracks: video.subtitleTracks || [],
  });

  const subtitleOptions = tracks.subtitleTracks.filter(
    (track) => !IMAGE_SUBTITLE_CODECS.includes(track.codec),
  );
  const hasAudioOptions = tracks.audioTracks.length > 1;
  const hasSubtitleOptions = subtitleOptions.length > 1;

  const closePanel = () => {
    setOpenPanel(null);
  };

  const togglePanel = (panel: SelectorPanel) => {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  const formatAudioTrackLabel = (track: AudioTrack) => {
    return [track.languageTag ?? '', i18n.language, track.displayTitle]
      .filter(Boolean)
      .join(' ')
      .trim();
  };

  const formatSubtitleTrackLabel = (track: SubtitleTrack) => {
    return [track.title, track.displayTitle].filter(Boolean).join(' ').trim();
  };

  const handleAudioTrackChange = async (track: AudioTrack) => {
    setSelectedAudioTrack(track);
    setTracks((currentTracks) => ({
      ...currentTracks,
      audioTracks: updateSelectedTrack(currentTracks.audioTracks, track.id),
    }));
    closePanel();
    await invoke('set_audio_track', { trackId: track.id }).catch(console.error);
  };

  const handleSubtitleTrackChange = async (track: SubtitleTrack) => {
    setSelectedSubtitleTrack(track);
    setTracks((currentTracks) => ({
      ...currentTracks,
      subtitleTracks: updateSelectedTrack(currentTracks.subtitleTracks, track.id),
    }));
    closePanel();
    await invoke('set_subtitle_track', { trackId: track.id }).catch(console.error);
  };

  useEffect(() => {
    setSelectedAudioTrack(video.audioTracks?.find((track) => track.selected) || null);
    setSelectedSubtitleTrack(video.subtitleTracks?.find((track) => track.selected) || null);
    setTracks({
      audioTracks: video.audioTracks || [],
      subtitleTracks: video.subtitleTracks || [],
    });
  }, [video]);

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    const activeTrackId =
      openPanel === 'audio'
        ? (selectedAudioTrack?.id ?? tracks.audioTracks[0]?.id)
        : (selectedSubtitleTrack?.id ?? subtitleOptions[0]?.id);

    if (activeTrackId === undefined) {
      return;
    }

    const focusTimeout = window.setTimeout(() => {
      setFocus(getTrackFocusKey(openPanel, activeTrackId));
    }, 30);

    return () => {
      window.clearTimeout(focusTimeout);
    };
  }, [
    openPanel,
    selectedAudioTrack?.id,
    selectedSubtitleTrack?.id,
    subtitleOptions,
    tracks.audioTracks,
  ]);

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        setOpenPanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openPanel]);

  useEffect(() => {
    if (!videoInfo || !serverUrl || !playbackConfig) {
      return;
    }

    let isCancelled = false;

    const fetchData = async () => {
      const result = await authenticatedFetch(`${serverUrl}/api/updateMediaInfo`, 'PUT', {
        videoId: video.id,
      });

      if (!result || !result.ok || isCancelled) {
        return;
      }

      const data = await result.json();
      const { videoTracks, audioTracks, subtitleTracks } = data;
      const preferredAudioTrack = getAudioTrack(playbackConfig.preferAudioLan, video);
      const preferredSubtitleTrack = getSubtitleTrack(
        playbackConfig.preferSubLan,
        playbackConfig.subsMode,
        video,
      );
      const selectedVideoTrackId = videoTracks[0]?.id ?? null;
      const selectedAudioTrackId = preferredAudioTrack?.id ?? null;
      const selectedSubtitleTrackId = preferredSubtitleTrack?.id ?? null;

      setTracks({
        audioTracks: updateSelectedTrack(audioTracks, selectedAudioTrackId),
        subtitleTracks: updateSelectedTrack(subtitleTracks, selectedSubtitleTrackId),
      });
      setSelectedAudioTrack(preferredAudioTrack);
      setSelectedSubtitleTrack(preferredSubtitleTrack);

      if (selectedVideoTrackId !== null) {
        for (const track of videoTracks) {
          track.selected = track.id === selectedVideoTrackId;
        }
      }
    };

    void fetchData();

    return () => {
      isCancelled = true;
    };
  }, [serverUrl, video, videoInfo, playbackConfig]);

  if (!hasAudioOptions && !hasSubtitleOptions) {
    return null;
  }

  const panelTracks = openPanel === 'audio' ? tracks.audioTracks : subtitleOptions;

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-2">
        {hasAudioOptions && (
          <NavigationButton
            transparent
            title={t('audio')}
            className={`p-2 ${openPanel === 'audio' ? 'bg-white text-black' : ''}`}
            onClick={() => {
              togglePanel('audio');
            }}
          >
            <Music2 />
          </NavigationButton>
        )}
        {hasSubtitleOptions && (
          <NavigationButton
            transparent
            title={t('subs')}
            className={`p-2 ${openPanel === 'subtitle' ? 'bg-white text-black' : ''}`}
            onClick={() => {
              togglePanel('subtitle');
            }}
          >
            <Captions />
          </NavigationButton>
        )}
      </div>

      <AnimatePresence>
        {!!openPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed inset-0 z-40 bg-black/35"
              onClick={closePanel}
            />
            <NavigationContainer className="absolute bottom-full right-0 z-50 mb-4 w-[24rem]">
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/85 shadow-2xl backdrop-blur-md"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/45">
                    {t('tracks')}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    {openPanel === 'audio' ? t('audio') : t('subs')}
                  </div>
                </div>
                <div className="max-h-88 overflow-y-auto p-3">
                  {panelTracks.map((track) => {
                    const isAudioPanel = openPanel === 'audio';
                    const isSelected = isAudioPanel
                      ? selectedAudioTrack?.id === track.id
                      : selectedSubtitleTrack?.id === track.id;
                    const label = isAudioPanel
                      ? formatAudioTrackLabel(track as AudioTrack)
                      : formatSubtitleTrackLabel(track as SubtitleTrack);

                    return (
                      <NavigationButton
                        key={`${openPanel}-${track.id}`}
                        customKey={getTrackFocusKey(openPanel, track.id)}
                        className={`mb-2 h-auto w-full justify-between rounded-2xl border px-5 py-4 text-left text-base transition-colors ${
                          isSelected
                            ? 'border-white/20 bg-white text-black hover:text-black'
                            : 'border-white/10 bg-white/5 text-white hover:text-black'
                        }`}
                        onClick={() => {
                          if (isAudioPanel) {
                            void handleAudioTrackChange(track as AudioTrack);
                            return;
                          }

                          void handleSubtitleTrackChange(track as SubtitleTrack);
                        }}
                      >
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="truncate text-lg font-medium">{label}</div>
                            {!!track.codec && (
                              <div
                                className={`mt-1 truncate text-sm ${
                                  isSelected ? 'text-black/70' : 'text-white/55'
                                }`}
                              >
                                {track.codec}
                              </div>
                            )}
                          </div>
                          <div
                            className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                              isSelected ? 'text-black/70' : 'text-white/40'
                            }`}
                          >
                            {isSelected ? 'ON' : ''}
                          </div>
                        </div>
                      </NavigationButton>
                    );
                  })}
                </div>
              </motion.div>
            </NavigationContainer>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TracksSelectors;
