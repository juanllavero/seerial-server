import { useGetVideoMediaInfo, useGetVideoPlaybackInfo } from '@seerial/api';
import type { MediaInfoData, PlayBackConfig, Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { SettingsIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import NavigationButton from '@/components/navigation/NavigationButton';
import FlexBox from '@/components/ui/FlexBox';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import VideoInfoComponent from '../video-info';
import TimelineSlider from './timeline-slider';
import TracksSelectors from './tracks-selectors';
import VolumeSlider from './volume-slider';

type ControlsMode = 'hidden' | 'full' | 'compact';

interface ControlsProps {
  video: Video;
  runtime?: number;
  controlsMode: ControlsMode;
  onTimelineFocusChange?: (focused: boolean) => void;
}

function Controls({ video, runtime, controlsMode, onTimelineFocusChange }: ControlsProps) {
  const { user, serverUrl } = useServerStore(
    (state) => ({
      user: state.currentUser,
      serverUrl: state.selectedServer?.url ?? '',
    }),
    shallow,
  );
  const [duration, setDuration] = useState(runtime ? runtime * 60 : 0);
  const [position, setPosition] = useState(0);
  const [isTimelineFocused, setIsTimelineFocused] = useState(false);

  // Get video info
  const { data: videoInfo } = useGetVideoMediaInfo<MediaInfoData>(video.id, {
    enabled: !!video.id && serverUrl !== '',
  });

  // Get playback config
  const { data: playbackConfig } = useGetVideoPlaybackInfo<PlayBackConfig>(video.id, {
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
  useKeyboardShortcut({
    key: ' ',
    onKeyDown: useCallback(
      (e: KeyboardEvent) => {
        e.preventDefault();
        handlePlayPause();
      },
      [handlePlayPause],
    ),
  });

  const handleTimelineFocusChange = useCallback(
    (focused: boolean) => {
      setIsTimelineFocused(focused);
      onTimelineFocusChange?.(focused);
    },
    [onTimelineFocusChange],
  );

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
          <VideoInfoComponent videoInfo={videoInfo} duration={duration} />
          <FlexBox align="center" justify="end" gap={0.5}>
            <NavigationButton transparent className="p-2">
              <SettingsIcon />
            </NavigationButton>
            <TracksSelectors video={video} videoInfo={videoInfo} playbackConfig={playbackConfig} />
            <FlexBox>
              <VolumeSlider />
            </FlexBox>
          </FlexBox>
        </FlexBox>
      )}
      <FlexBox direction="column" width={'100%'} justify="center" align="center" gap={1}>
        <TimelineSlider
          duration={duration}
          setDuration={setDuration}
          position={position}
          setPosition={setPosition}
          isFocused={controlsMode === 'compact' || isTimelineFocused}
          onFocusChange={handleTimelineFocusChange}
        />
      </FlexBox>
    </FlexBox>
  );
}

export default memo(Controls);
