import { useGetVideoPlaybackInfo } from '@seerial/api';
import type { PlayBackInfo, Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { Tertiary } from '@/shared/components/text';
import FlexBox from '@/shared/components/ui/flex-box';
import { useMpvPlayer } from '../../hooks/use-mpv-player';
import type { PlayerSettings } from '../../hooks/use-player-settings';
import Settings from '../settings';
import VideoInfoComponent from '../video-info';
import TimelineSlider from './timeline-slider';
import TracksSelectors from './tracks-selectors';

const END_TIME_FORMATTER = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

type ControlsMode = 'hidden' | 'full' | 'compact';

interface ControlsProps {
  video: Video;
  runtime?: number;
  controlsMode: ControlsMode;
  onSeekCommitted?: (position: number) => void;
  onTimelineFocusChange?: (focused: boolean) => void;
  onTracksPanelChange?: (open: boolean) => void;
  settings: PlayerSettings;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
}

function Controls({
  video,
  runtime,
  controlsMode,
  onSeekCommitted,
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
  const mpv = useMpvPlayer();
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
  const streamStartTimeRef = useRef(timeWatched ?? 0);

  const initializePosition = useCallback(async () => {
    const maxAttempts = 10;
    const retryInterval = 500;

    const tryGetDuration = async (attempt = 0): Promise<number> => {
      if (attempt >= maxAttempts) {
        return 0;
      }

      try {
        const dur = await mpv.getDuration();
        if (typeof dur === 'number') {
          return dur;
        }
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed to get duration:`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, retryInterval));
      return tryGetDuration(attempt + 1);
    };

    const dur = await tryGetDuration();
    setDuration(dur > 0 ? dur : video?.runtime ? video.runtime * 60 || 0 : 0);
    setPosition(streamStartTimeRef.current ?? 0);
  }, [video, mpv.getDuration]);

  const handlePlayPause = useCallback(() => {
    void mpv.togglePlayPause();
  }, [mpv.togglePlayPause]);

  useEffect(() => {
    if (!video) return;
    streamStartTimeRef.current = timeWatched && timeWatched > 0 ? timeWatched : 0;
    initializePosition();
  }, [video, timeWatched, initializePosition]);

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
    return END_TIME_FORMATTER.format(endsAt);
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
            title={playBackInfo?.title ?? video.title ?? ''}
            subtitle={playBackInfo?.subtitle ?? ''}
            info={playBackInfo?.info ?? ''}
            duration={duration}
          />

          <div className="absolute top-15 right-20">
            <Tertiary>{`${t('endsAt')} ${endTime}`}</Tertiary>
          </div>
        </FlexBox>
      )}
      <FlexBox direction="column" width={'100%'} justify="center" align="center" gap={1}>
        <TimelineSlider
          duration={duration}
          setDuration={setDuration}
          position={position}
          setPosition={setPosition}
          onSeekCommitted={onSeekCommitted}
          keyboardShortcutEnabled={controlsMode === 'compact' || isTimelineFocused}
          onFocusChange={handleTimelineFocusChange}
          togglePlayPause={handlePlayPause}
          playbackControls={{
            getPosition: mpv.getPosition,
            getDuration: mpv.getDuration,
            setPosition: mpv.setPosition,
          }}
        />
      </FlexBox>

      <FlexBox align="center" justify="end" height={'5dvh'} width={'100%'} gap={0.5}>
        {showFullControls && (
          <>
            <TracksSelectors
              video={video}
              videoInfo={playBackInfo?.mediaInfoData}
              playbackConfig={playBackInfo?.playBackConfig}
              onPanelChange={handleTracksPanelInternalChange}
            />
            <Settings
              onPanelChange={handleSettingsPanelChange}
              settings={settings}
              updateSetting={updateSetting}
            />
          </>
        )}
      </FlexBox>
    </FlexBox>
  );
}

export default memo(Controls);
