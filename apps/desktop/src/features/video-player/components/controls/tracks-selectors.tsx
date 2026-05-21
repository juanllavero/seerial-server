import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useUpdateVideo } from '@seerial/api';
import type {
  AudioTrack,
  MediaInfoData,
  PlayBackConfig,
  SubtitleTrack,
  Video,
} from '@seerial/domain';
import { getAudioTrack, getSubtitleTrack, isLatinSpanishTrack } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { Captions, Music2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationButton, NavigationContainer } from '@/shared/components/navigation';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import { useMpvPlayer } from '../../hooks/use-mpv-player';

type SelectorPanel = 'audio' | 'subtitle';

const IMAGE_SUBTITLE_CODECS = ['HDMV_PGS_SUBTITLE', 'DVD_SUBTITLE'];

interface TracksSelectorsProps {
  video: Video;
  videoInfo?: MediaInfoData;
  playbackConfig?: PlayBackConfig;
  onPanelChange?: (open: boolean) => void;
}

interface TrackSelectorsState {
  selectedAudioTrack: AudioTrack | null;
  selectedSubtitleTrack: SubtitleTrack | null;
  tracks: {
    audioTracks: AudioTrack[];
    subtitleTracks: SubtitleTrack[];
  };
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

const SUBTITLE_NONE_FOCUS_KEY = 'subtitle-track-none';

function getInitialFocusKey(
  panel: SelectorPanel,
  selectedAudioId: number | undefined,
  selectedSubtitleId: number | undefined,
  firstAudioId: number | undefined,
): string | undefined {
  if (panel === 'audio') {
    const id = selectedAudioId ?? firstAudioId;
    return id === undefined ? undefined : getTrackFocusKey(panel, id);
  }
  return selectedSubtitleId === undefined
    ? SUBTITLE_NONE_FOCUS_KEY
    : getTrackFocusKey(panel, selectedSubtitleId);
}

function TrackItem({
  focusKey,
  label,
  codec,
  isSelected,
  onClick,
}: {
  focusKey: string;
  label: string;
  codec?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <NavigationButton
      customKey={focusKey}
      className={`mb-2 h-auto w-full justify-between rounded-2xl! border px-5 py-4 text-left text-base transition-colors ${
        isSelected
          ? 'border-white/20 bg-white text-black hover:text-black'
          : 'border-white/10 bg-white/5 text-white hover:text-black'
      }`}
      onClick={onClick}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-medium">{label}</div>
          {!!codec && <div className={`mt-1 truncate text-sm`}>{codec}</div>}
        </div>
        <div className={`text-sm font-semibold uppercase tracking-[0.2em]`}>
          {isSelected ? 'ON' : ''}
        </div>
      </div>
    </NavigationButton>
  );
}

function SelectorButtons({
  hasAudioOptions,
  hasSubtitleOptions,
  openPanel,
  onTogglePanel,
  t,
}: {
  hasAudioOptions: boolean;
  hasSubtitleOptions: boolean;
  openPanel: SelectorPanel | null;
  onTogglePanel: (panel: SelectorPanel) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {hasAudioOptions && (
        <NavigationButton
          variant="ghost"
          customKey={NavigationFocusKeys.player.audioTracksButton}
          title={t('audio')}
          className={`p-2 ${openPanel === 'audio' ? 'bg-white text-black' : ''}`}
          onClick={() => {
            onTogglePanel('audio');
          }}
        >
          <Music2 />
        </NavigationButton>
      )}
      {hasSubtitleOptions && (
        <NavigationButton
          variant="ghost"
          customKey={NavigationFocusKeys.player.subtitleTracksButton}
          title={t('subs')}
          className={`p-2 ${openPanel === 'subtitle' ? 'bg-white text-black' : ''}`}
          onClick={() => {
            onTogglePanel('subtitle');
          }}
        >
          <Captions />
        </NavigationButton>
      )}
    </div>
  );
}

function TracksPanel({
  openPanel,
  closePanel,
  panelTracks,
  selectedAudioTrack,
  selectedSubtitleTrack,
  handleDisableSubtitles,
  handleAudioTrackChange,
  handleSubtitleTrackChange,
  formatAudioTrackLabel,
  formatSubtitleTrackLabel,
  t,
}: {
  openPanel: SelectorPanel | null;
  closePanel: () => void;
  panelTracks: (AudioTrack | SubtitleTrack)[];
  selectedAudioTrack: AudioTrack | null;
  selectedSubtitleTrack: SubtitleTrack | null;
  handleDisableSubtitles: () => Promise<void>;
  handleAudioTrackChange: (track: AudioTrack) => Promise<void>;
  handleSubtitleTrackChange: (track: SubtitleTrack) => Promise<void>;
  formatAudioTrackLabel: (track: AudioTrack) => string;
  formatSubtitleTrackLabel: (track: SubtitleTrack) => string;
  t: (key: string) => string;
}) {
  return (
    <AnimatePresence>
      {!!openPanel && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-black/35"
            onClick={closePanel}
          />
          <NavigationContainer
            isFocusBoundary
            className="absolute bottom-full right-0 z-50 mb-4 w-[24rem]"
          >
            <m.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/85 shadow-2xl backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-white/10 px-5 py-4">
                <div className="mt-1 text-2xl font-semibold text-white">
                  {openPanel === 'audio' ? t('audio') : t('subs')}
                </div>
              </div>
              <div className="max-h-88 overflow-y-auto p-3">
                {openPanel === 'subtitle' && (
                  <TrackItem
                    focusKey={SUBTITLE_NONE_FOCUS_KEY}
                    label={t('none')}
                    isSelected={selectedSubtitleTrack === null}
                    onClick={() => void handleDisableSubtitles()}
                  />
                )}
                {panelTracks.map((track) => {
                  if (!openPanel) {
                    return null;
                  }

                  const isAudioPanel = openPanel === 'audio';
                  const isSelected = isAudioPanel
                    ? selectedAudioTrack?.id === track.id
                    : selectedSubtitleTrack?.id === track.id;
                  const label = isAudioPanel
                    ? formatAudioTrackLabel(track as AudioTrack)
                    : formatSubtitleTrackLabel(track as SubtitleTrack);

                  return (
                    <TrackItem
                      key={`${openPanel}-${track.id}`}
                      focusKey={getTrackFocusKey(openPanel, track.id)}
                      label={label}
                      codec={track.codec}
                      isSelected={isSelected}
                      onClick={() => {
                        if (isAudioPanel) {
                          void handleAudioTrackChange(track as AudioTrack);
                          return;
                        }
                        void handleSubtitleTrackChange(track as SubtitleTrack);
                      }}
                    />
                  );
                })}
              </div>
            </m.div>
          </NavigationContainer>
        </>
      )}
    </AnimatePresence>
  );
}

function TracksSelectors({
  video,
  videoInfo,
  playbackConfig,
  onPanelChange,
}: TracksSelectorsProps) {
  const { t, i18n } = useTranslation();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const mpv = useMpvPlayer();
  const { mutate: updateVideo } = useUpdateVideo<
    void,
    { selectedAudioTrack?: number; selectedSubtitleTrack?: number }
  >(video.id);
  const [openPanel, setOpenPanel] = useState<SelectorPanel | null>(null);
  const [trackSelectorsState, setTrackSelectorsState] = useState<TrackSelectorsState>({
    selectedAudioTrack: video.audioTracks?.find((track) => track.selected) || null,
    selectedSubtitleTrack: video.subtitleTracks?.find((track) => track.selected) || null,
    tracks: {
      audioTracks: video.audioTracks || [],
      subtitleTracks: video.subtitleTracks || [],
    },
  });

  const { selectedAudioTrack, selectedSubtitleTrack, tracks } = trackSelectorsState;

  const subtitleOptions = tracks.subtitleTracks.filter(
    (track) => !IMAGE_SUBTITLE_CODECS.includes(track.codec),
  );
  const hasAudioOptions = tracks.audioTracks.length > 1;
  const hasSubtitleOptions = subtitleOptions.length > 1;

  const closePanel = useCallback(() => {
    setOpenPanel((prev) => {
      if (prev) {
        const focusKey =
          prev === 'audio'
            ? NavigationFocusKeys.player.audioTracksButton
            : NavigationFocusKeys.player.subtitleTracksButton;
        setTimeout(() => setFocus(focusKey), 30);
        onPanelChange?.(false);
      }
      return null;
    });
  }, [onPanelChange]);

  const togglePanel = useCallback(
    (panel: SelectorPanel) => {
      setOpenPanel((currentPanel) => {
        const nextPanel = currentPanel === panel ? null : panel;
        onPanelChange?.(nextPanel !== null);
        return nextPanel;
      });
    },
    [onPanelChange],
  );

  const formatAudioTrackLabel = (track: AudioTrack) => {
    return [track.language === '' ? track.languageTag : track.language, track.displayTitle]
      .filter(Boolean)
      .join(' ')
      .trim();
  };

  const formatSubtitleTrackLabel = (track: SubtitleTrack) => {
    const base = [track.title, track.displayTitle].filter(Boolean).join(' ').trim();
    if (track.languageTag === 'spa') {
      const variant = isLatinSpanishTrack(track) ? 'Español Latino' : 'Español (España)';
      return base ? `${variant} — ${base}` : variant;
    }
    return base;
  };

  const handleAudioTrackChange = async (track: AudioTrack) => {
    const trackIndex = (video.audioTracks ?? []).findIndex((t) => t.id === track.id);
    setTrackSelectorsState((currentState) => ({
      ...currentState,
      selectedAudioTrack: track,
      tracks: {
        ...currentState.tracks,
        audioTracks: updateSelectedTrack(currentState.tracks.audioTracks, track.id),
      },
    }));
    closePanel();
    await mpv.setAudioTrack(track.id);
    if (trackIndex !== -1) {
      updateVideo({ selectedAudioTrack: trackIndex });
    }
  };

  const handleDisableSubtitles = useCallback(async () => {
    setTrackSelectorsState((currentState) => ({
      ...currentState,
      selectedSubtitleTrack: null,
      tracks: {
        ...currentState.tracks,
        subtitleTracks: updateSelectedTrack(currentState.tracks.subtitleTracks, null),
      },
    }));
    closePanel();
    await mpv.setSubtitleTrack(0);
    updateVideo({ selectedSubtitleTrack: -1 });
  }, [closePanel, mpv.setSubtitleTrack, updateVideo]);

  const handleSubtitleTrackChange = async (track: SubtitleTrack) => {
    const trackIndex = (video.subtitleTracks ?? []).findIndex((t) => t.id === track.id);
    setTrackSelectorsState((currentState) => ({
      ...currentState,
      selectedSubtitleTrack: track,
      tracks: {
        ...currentState.tracks,
        subtitleTracks: updateSelectedTrack(currentState.tracks.subtitleTracks, track.id),
      },
    }));
    closePanel();
    await mpv.setSubtitleTrack(track.id);
    if (trackIndex !== -1) {
      updateVideo({ selectedSubtitleTrack: trackIndex });
    }
  };

  useEffect(() => {
    setTrackSelectorsState({
      selectedAudioTrack: video.audioTracks?.find((track) => track.selected) || null,
      selectedSubtitleTrack: video.subtitleTracks?.find((track) => track.selected) || null,
      tracks: {
        audioTracks: video.audioTracks || [],
        subtitleTracks: video.subtitleTracks || [],
      },
    });
  }, [video]);

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    const focusKey = getInitialFocusKey(
      openPanel,
      selectedAudioTrack?.id,
      selectedSubtitleTrack?.id,
      tracks.audioTracks[0]?.id,
    );

    if (!focusKey) {
      return;
    }

    const focusTimeout = window.setTimeout(() => {
      setFocus(focusKey);
    }, 30);

    return () => {
      window.clearTimeout(focusTimeout);
    };
  }, [openPanel, selectedAudioTrack?.id, selectedSubtitleTrack?.id, tracks.audioTracks]);

  // Close panel on Escape/Backspace
  useKeyboardShortcut({
    key: ['Escape', 'Backspace'],
    enabled: openPanel !== null,
    onKeyDown: useCallback(
      (e: KeyboardEvent) => {
        e.preventDefault();
        closePanel();
      },
      [closePanel],
    ),
  });

  useEffect(() => {
    if (!videoInfo || !serverUrl || !playbackConfig) {
      return;
    }

    const { videoTracks, audioTracks, subtitleTracks } = videoInfo;
    const preferredAudioTrack = getAudioTrack(playbackConfig.preferAudioLan, video);
    const preferredSubtitleTrack = getSubtitleTrack(
      playbackConfig.preferSubLan,
      playbackConfig.subsMode,
      video,
      i18n.language,
    );
    const selectedVideoTrackId = videoTracks[0]?.id ?? null;
    const selectedAudioTrackId = preferredAudioTrack?.id ?? null;
    const selectedSubtitleTrackId = preferredSubtitleTrack?.id ?? null;

    setTrackSelectorsState({
      selectedAudioTrack: preferredAudioTrack,
      selectedSubtitleTrack: preferredSubtitleTrack,
      tracks: {
        audioTracks: updateSelectedTrack(audioTracks, selectedAudioTrackId),
        subtitleTracks: updateSelectedTrack(subtitleTracks, selectedSubtitleTrackId),
      },
    });

    if (selectedVideoTrackId !== null) {
      for (const track of videoTracks) {
        track.selected = track.id === selectedVideoTrackId;
      }
    }
  }, [serverUrl, video, videoInfo, playbackConfig, i18n.language]);

  if (!hasAudioOptions && !hasSubtitleOptions) {
    return null;
  }

  const panelTracks = openPanel === 'audio' ? tracks.audioTracks : subtitleOptions;

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative">
        <SelectorButtons
          hasAudioOptions={hasAudioOptions}
          hasSubtitleOptions={hasSubtitleOptions}
          openPanel={openPanel}
          onTogglePanel={togglePanel}
          t={t}
        />

        <TracksPanel
          openPanel={openPanel}
          closePanel={closePanel}
          panelTracks={panelTracks}
          selectedAudioTrack={selectedAudioTrack}
          selectedSubtitleTrack={selectedSubtitleTrack}
          handleDisableSubtitles={handleDisableSubtitles}
          handleAudioTrackChange={handleAudioTrackChange}
          handleSubtitleTrackChange={handleSubtitleTrackChange}
          formatAudioTrackLabel={formatAudioTrackLabel}
          formatSubtitleTrackLabel={formatSubtitleTrackLabel}
          t={t}
        />
      </div>
    </LazyMotion>
  );
}

export default TracksSelectors;
