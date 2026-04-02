import { useGetVideoPlaybackInfo } from '@seerial/api';
import type { PlayBackInfo, Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import Tertiary from '@/components/text/Tertiary';
import FlexBox from '@/components/ui/FlexBox';
import type { PlayerSettings } from '../../hooks/use-player-settings';
import Settings from '../settings';
import VideoInfoComponent from '../video-info';
import TimelineSlider from './timeline-slider';
import TracksSelectors from './tracks-selectors';

type ControlsMode = 'hidden' | 'full' | 'compact';

interface ControlsProps {
  video: Video;
  runtime?: number;
  controlsMode: ControlsMode;
  onTimelineFocusChange?: (focused: boolean) => void;
  onTracksPanelChange?: (open: boolean) => void;
  settings: PlayerSettings;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
}

function Controls({
  video,
  runtime,
  controlsMode,
  onTimelineFocusChange,
  onTracksPanelChange,
  settings,
  updateSetting,
}: ControlsProps) {
  const { user, serverUrl } = useServerStore(
    (state) => ({
      user: state.currentUser,
      serverUrl: state.selectedServer?.url ?? '',
    }),
    shallow,
  );
  const { t } = useTranslation();
  const [duration, setDuration] = useState(runtime ? runtime * 60 : 0);
  const [position, setPosition] = useState(0);
  const [isTimelineFocused, setIsTimelineFocused] = useState(false);
  const openPanelsRef = useRef({ tracks: false, settings: false });

  const notifyPanelChange = useCallback(() => {
    const anyOpen = openPanelsRef.current.tracks || openPanelsRef.current.settings;
    onTracksPanelChange?.(anyOpen);
  }, [onTracksPanelChange]);

  const handleTracksPanelInternalChange = useCallback(
    (open: boolean) => {
      openPanelsRef.current.tracks = open;
      notifyPanelChange();
    },
    [notifyPanelChange],
  );

  const handleSettingsPanelChange = useCallback(
    (open: boolean) => {
      openPanelsRef.current.settings = open;
      notifyPanelChange();
    },
    [notifyPanelChange],
  );

  // Get playback config
  const { data: playBackInfo } = useGetVideoPlaybackInfo<PlayBackInfo>(video.id, {
    enabled: !!video.id && serverUrl !== '',
  });

  const watchedList = video?.watchLists?.find((list) => list.userId === user?.id);
  const timeWatched = watchedList?.timeWatched ?? 0;
  const [streamStartTime, setStreamStartTime] = useState(timeWatched ?? 0);

  const initializePosition = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 10;
    const retryInterval = 500;

    const tryGetDuration = async (): Promise<number> => {
      while (attempts < maxAttempts) {
        try {
          const dur = await invoke<number>('get_duration');
          if (typeof dur === 'number') {
            return dur;
          }
        } catch (error) {
          console.warn(`Attempt ${attempts + 1} failed to get duration:`, error);
        }
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
      return 0;
    };

    const dur = await tryGetDuration();
    setDuration(dur > 0 ? dur : video?.runtime ? video.runtime * 60 || 0 : 0);
    setPosition(streamStartTime ?? 0);
  }, [video, streamStartTime]);

  const handlePlayPause = useCallback(() => {
    invoke('toggle_play_pause').catch(console.error);
  }, []);

  useEffect(() => {
    if (!video) return;
    initializePosition();
    setStreamStartTime(timeWatched && timeWatched > 0 ? timeWatched : 0);
  }, [video, timeWatched, initializePosition]);

  // Space bar to toggle play/pause
  // useKeyboardShortcut({
  //   key: ' ',
  //   enabled: playerInputEnabled && !(controlsMode === 'compact' || isTimelineFocused),
  //   onKeyDown: useCallback(
  //     (e: KeyboardEvent) => {
  //       e.preventDefault();
  //       handlePlayPause();
  //     },
  //     [handlePlayPause],
  //   ),
  // });

  const handleTimelineFocusChange = useCallback(
    (focused: boolean) => {
      setIsTimelineFocused(focused);
      onTimelineFocusChange?.(focused);
    },
    [onTimelineFocusChange],
  );

  const endTime = useMemo(() => {
    const remainingSeconds = Math.max(duration - position, 0);
    const endsAt = new Date(Date.now() + remainingSeconds * 1000);
    return new Intl.DateTimeFormat([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(endsAt);
  }, [duration, position]);

  if (controlsMode === 'hidden') return null;

  const showFullControls = controlsMode === 'full';

  return (
    <FlexBox
      direction="column"
      gap={1.5}
      width={'90%'}
      padding="0 0 3rem 0"
      className="max-w-[170dvh]"
    >
      {showFullControls && (
        <FlexBox justify="space-between" gap={2} align="end" width={'100%'}>
          <VideoInfoComponent
            title={playBackInfo?.title ?? ''}
            subtitle={playBackInfo?.subtitle ?? ''}
            info={playBackInfo?.info ?? ''}
            duration={duration}
          />

          <div className="absolute top-15 right-20">
            <Tertiary>{`${t('endsAt')} ${endTime}`}</Tertiary>
          </div>

          <FlexBox align="center" justify="end" gap={0.5}>
            <Settings
              onPanelChange={handleSettingsPanelChange}
              settings={settings}
              updateSetting={updateSetting}
            />
            <TracksSelectors
              video={video}
              videoInfo={playBackInfo?.mediaInfoData}
              playbackConfig={playBackInfo?.playBackConfig}
              onPanelChange={handleTracksPanelInternalChange}
            />
          </FlexBox>
        </FlexBox>
      )}
      <FlexBox direction="column" width={'100%'} justify="center" align="center" gap={1}>
        <TimelineSlider
          duration={duration}
          setDuration={setDuration}
          position={position}
          setPosition={setPosition}
          keyboardShortcutEnabled={controlsMode === 'compact' || isTimelineFocused}
          onFocusChange={handleTimelineFocusChange}
          togglePlayPause={handlePlayPause}
        />
      </FlexBox>
    </FlexBox>
  );
}

export default memo(Controls);
