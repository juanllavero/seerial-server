import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type { Video } from '@seerial/domain';
import { useCallback, useEffect, useState } from 'react';
import ChapterList from '@/features/video-player/components/chapter-list';
import Controls from '@/features/video-player/components/controls/controls';
import VolumeIndicator from '@/features/video-player/components/controls/volume-slider';
import {
  useChapterThumbnails,
  usePlaybackPosition,
} from '@/features/video-player/hooks/use-chapter-thumbnails';
import { useMpvPlayer } from '@/features/video-player/hooks/use-mpv-player';
import { usePlayerSettings } from '@/features/video-player/hooks/use-player-settings';
import { useVolumeIndicator } from '@/features/video-player/hooks/use-volume-indicator';
import { NavigationContainer } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { usePlayerControlsVisibility } from '@/shared/hooks/use-player-controls-visibility';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

interface VideoPlayerProps {
  video: Video;
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const [isTimelineFocused, setIsTimelineFocused] = useState(false);
  const [tracksPanelOpen, setTracksPanelOpen] = useState(false);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);

  const mpv = useMpvPlayer();
  const playerInputEnabled = !tracksPanelOpen;

  const { settings, updateSetting } = usePlayerSettings();
  const { volume, visible: volumeVisible } = useVolumeIndicator({
    enabled: playerInputEnabled,
  });

  const hasChapters = !!video.chapters?.length;
  const chapterThumbnails = useChapterThumbnails(video.id, hasChapters);
  const chapters = chapterThumbnails ?? video.chapters ?? [];
  const position = usePlaybackPosition(hasChapters && chapters.length > 0);

  // Handle back navigation with a pre-action to stop the video before navigating back
  useKeyboardBack({
    preAction: () => {
      void mpv.stop();
      void mpv.embedMpv();
    },
    enabled: playerInputEnabled,
  });

  const handleTogglePlayPause = useCallback(() => {
    void mpv.togglePlayPause();
  }, [mpv.togglePlayPause]);

  const handleResumeIfPaused = useCallback(() => {
    void mpv.play();
  }, [mpv.play]);

  const { mode, isVisible } = usePlayerControlsVisibility({
    isTimelineFocused,
    enabled: playerInputEnabled,
    onTogglePlayPause: handleTogglePlayPause,
    onResumeIfPaused: handleResumeIfPaused,
  });

  // Set initial focus on the timeline when controls become fully visible
  const isFull = mode === 'full';
  const isCompact = mode === 'compact';
  useEffect(() => {
    if (isFull || isCompact) {
      setFocus(NavigationFocusKeys.player.timeline);
    }
  }, [isFull, isCompact]);

  useEffect(() => {
    if (!isVisible) {
      setChaptersExpanded(false);
    }
  }, [isVisible]);

  const handleTimelineFocusChange = useCallback((focused: boolean) => {
    setIsTimelineFocused(focused);
  }, []);

  const handleTracksPanelChange = useCallback((open: boolean) => {
    setTracksPanelOpen(open);
  }, []);

  const handleChaptersExpand = useCallback(() => {
    setChaptersExpanded(true);
  }, []);

  const handleChaptersCollapse = useCallback(() => {
    setChaptersExpanded(false);
  }, []);

  const showChapters = chapters.length > 0 && isVisible;

  return (
    <NavigationContainer customFocusKey={NavigationFocusKeys.player.container}>
      <VolumeIndicator volume={volume} visible={volumeVisible} />
      <FlexBox
        className="absolute w-full h-full overflow-hidden"
        css={{
          backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
          transition: 'background-color 0.3s ease',
        }}
        width={'100%'}
        height={'100%'}
        justify="end"
        direction="column"
      >
        <FlexBox
          width={'100%'}
          padding="1rem"
          justify="center"
          align="center"
          css={{
            background: isVisible
              ? 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 3%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0) 100%)'
              : 'transparent',
            visibility: isVisible ? 'visible' : 'hidden',
            pointerEvents: isVisible ? 'auto' : 'none',
          }}
        >
          <Controls
            video={video}
            controlsMode={mode}
            onTimelineFocusChange={handleTimelineFocusChange}
            onTracksPanelChange={handleTracksPanelChange}
            settings={settings}
            updateSetting={updateSetting}
          />
        </FlexBox>

        {showChapters && (
          <div
            className="w-full overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: chaptersExpanded ? '32vh' : '4vh',
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 100%)',
              pointerEvents: isVisible ? 'auto' : 'none',
            }}
          >
            <div className="pb-4">
              <ChapterList
                chapters={chapters}
                position={position}
                isExpanded={chaptersExpanded}
                onExpand={handleChaptersExpand}
                onCollapse={handleChaptersCollapse}
              />
            </div>
          </div>
        )}
      </FlexBox>
    </NavigationContainer>
  );
}
