import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { RepeateMode, type Song } from '@seerial/domain';
import { useMusicStore } from '@seerial/stores';
import { motion } from 'framer-motion';
import { t } from 'i18next';
import { Repeat, Repeat1, Shuffle } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { NavigationButton, NavigationContainer } from '@/shared/components/navigation';
import { Tertiary } from '@/shared/components/text';
import FlexBox from '@/shared/components/ui/flex-box';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

interface QueueMenuProps {
  isOpen: boolean;
  onClose: (state: boolean) => void;
}

function QueueMenu({ isOpen, onClose }: QueueMenuProps) {
  const {
    currentSong,
    songQueue,
    repeateMode,
    setRepeateMode,
    isShuffling,
    setIsShuffling,
    handleSongSelect,
  } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      songQueue: state.songQueue,
      repeateMode: state.repeateMode,
      setRepeateMode: state.setRepeateMode,
      isShuffling: state.isShuffling,
      setIsShuffling: state.setIsShuffling,
      handleSongSelect: state.handleSongSelect,
    }),
    shallow,
  );

  const currentSongQueueIndex = useMemo(() => {
    if (!currentSong?.id) {
      return -1;
    }

    return songQueue.findIndex((song) => song.id === currentSong.id);
  }, [currentSong?.id, songQueue]);

  const getSafeDiscNumber = useCallback((song: Song): number => {
    return song.discNumber > 0 ? song.discNumber : 1;
  }, []);

  function getQueueSongLabel(song: Song, shouldIncludeDiscPrefix: boolean): string {
    const discPrefix = shouldIncludeDiscPrefix ? `${getSafeDiscNumber(song)}.` : '';
    const trackPrefix = song.trackNumber > 0 ? `${song.trackNumber}.` : '';
    const orderPrefix = `${discPrefix}${trackPrefix}`;

    if (!orderPrefix) {
      return song.title;
    }

    return `${orderPrefix} ${song.title}`;
  }

  const shouldIncludeDiscPrefixInQueue = useMemo(() => {
    const queueDiscNumbers = new Set(songQueue.map((song) => getSafeDiscNumber(song)));
    return queueDiscNumbers.size > 1;
  }, [songQueue, getSafeDiscNumber]);

  const toggleRepeatMode = useCallback(() => {
    setRepeateMode(
      repeateMode === RepeateMode.NONE
        ? RepeateMode.REPEAT_ALL
        : repeateMode === RepeateMode.REPEAT_ALL
          ? RepeateMode.REPEAT_ONE
          : RepeateMode.NONE,
    );
  }, [repeateMode, setRepeateMode]);

  const getQueueSongFocusKey = useCallback((index: number): string => {
    return `player-queue-song-${index}`;
  }, []);

  const selectSongFromQueue = useCallback(
    (index: number) => {
      handleSongSelect(index);
      onClose(false);

      window.setTimeout(() => {
        setFocus(NavigationFocusKeys.player.timeline);
      }, 30);
    },
    [onClose, handleSongSelect],
  );

  useEffect(() => {
    if (!isOpen) return;

    window.setTimeout(() => {
      if (currentSongQueueIndex >= 0) {
        setFocus(getQueueSongFocusKey(currentSongQueueIndex));
        return;
      }

      setFocus(NavigationFocusKeys.player.repeatButton);
    }, 30);
  }, [isOpen, currentSongQueueIndex, getQueueSongFocusKey]);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        key="queue-menu-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed inset-0 z-35 bg-black/45"
        onClick={() => onClose(false)}
      />
      <NavigationContainer
        isFocusBoundary
        focusBoundaryDirections={['up', 'down', 'left', 'right']}
        className="fixed right-[8vh] top-[10vh] z-40 h-[80vh] w-[56vh]"
      >
        <motion.div
          key="queue-menu-panel"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden rounded-[2.2vh] border border-white/10 bg-black/50 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between px-[2.4vh] py-[2vh]">
            <Tertiary className="text-[2.1vh] font-semibold text-white">{t('upNext')}</Tertiary>
            <FlexBox align="center" gap={0.6}>
              <NavigationButton
                customKey={NavigationFocusKeys.player.repeatButton}
                hideText
                variant="ghost"
                selected={repeateMode !== RepeateMode.NONE}
                onClick={toggleRepeatMode}
              >
                {repeateMode === RepeateMode.REPEAT_ONE ? (
                  <Repeat1 size={'1.9vh'} />
                ) : (
                  <Repeat size={'1.9vh'} />
                )}
              </NavigationButton>
              <NavigationButton
                customKey={NavigationFocusKeys.player.shuffleButton}
                title={t('shuffle')}
                hideText
                variant="ghost"
                selected={isShuffling}
                onClick={() => setIsShuffling(!isShuffling)}
              >
                <Shuffle size={'1.9vh'} />
              </NavigationButton>
            </FlexBox>
          </div>

          <div className="overflow-y-auto px-[1.4vh] py-[1.2vh]">
            {songQueue.map((song, index) => (
              <NavigationButton
                key={song.id ?? `${song.title}-${song.fileSrc}`}
                customKey={getQueueSongFocusKey(index)}
                text={getQueueSongLabel(song, shouldIncludeDiscPrefixInQueue)}
                variant="ghost"
                className="w-full justify-start rounded-2xl!"
                selected={song.id === currentSong?.id}
                onClick={() => selectSongFromQueue(index)}
              />
            ))}
          </div>
        </motion.div>
      </NavigationContainer>
    </>
  );
}

export default memo(QueueMenu);
