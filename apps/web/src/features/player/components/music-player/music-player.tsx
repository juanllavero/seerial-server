import { useGetAlbum } from '@seerial/api';
import type { Album } from '@seerial/domain';
import { useGradientStore, useMusicStore } from '@seerial/stores';
import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';

function MusicPlayer() {
  const { currentSong, initializeAudioRef, getAudioSrc, setAlbum } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      initializeAudioRef: state.initializeAudioRef,
      getAudioSrc: state.getAudioSrc,
      setAlbum: state.setAlbum,
    }),
    shallow,
  );
  const generateGradient = useGradientStore((state) => state.generateGradient);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  // Get Album details
  const { data: album } = useGetAlbum<Album>(currentSong?.albumId ?? '', {
    enabled: Boolean(currentSong?.albumId),
  });

  useEffect(() => {
    if (localAudioRef.current) {
      const cleanup = initializeAudioRef(localAudioRef);

      return cleanup;
    }
  }, [initializeAudioRef]);

  // Handle gradient background
  useEffect(() => {
    if (album) {
      setAlbum(album);
      generateGradient(album.coverSrc, true);
    }
  }, [album, generateGradient, setAlbum]);

  if (!album || !currentSong) return null;

  return (
    <audio
      ref={localAudioRef}
      src={`/api/${getAudioSrc()}`}
      onError={(e) => console.error('Audio loading error:', e)}
      autoPlay
    >
      <track kind="captions" label="Captions" />
    </audio>
  );
}

export default MusicPlayer;
