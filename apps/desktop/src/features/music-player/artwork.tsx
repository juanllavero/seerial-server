import { useGetAnimatedArtwork } from '@seerial/api';
import { useLocalStorage } from '@seerial/hooks';
import { useServerStore } from '@seerial/stores';
import { memo, useEffect, useRef, useState } from 'react';
import FadedCover from '@/shared/components/backgrounds/faded-cover';
import FlexBox from '@/shared/components/ui/flex-box';
import Image from '@/shared/components/ui/image';
import SongInfo from './song-info';

interface ArtworkProps {
  imageSrc?: string;
  albumFolderPath?: string;
  shouldShowLyricsPanel: boolean;
}

function Artwork({ imageSrc, albumFolderPath, shouldShowLyricsPanel }: ArtworkProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [coverStyle] = useLocalStorage<'classic' | 'background'>('music_cover_style', 'classic');

  const { data: animatedBlob } = useGetAnimatedArtwork({
    enabled: !!albumFolderPath && !!serverUrl,
    params: albumFolderPath ? { localPath: albumFolderPath } : undefined,
    queryKey: ['images', 'animatedArtwork', serverUrl, albumFolderPath],
  });

  useEffect(() => {
    if (!animatedBlob) return;

    const url = URL.createObjectURL(animatedBlob);
    setVideoBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setVideoBlobUrl(null);
    };
  }, [animatedBlob]);

  if (coverStyle === 'background') {
    return <FadedCover imageSrc={imageSrc ?? ''} videoBlobUrl={videoBlobUrl} videoRef={videoRef} />;
  }

  return (
    <div
      className="absolute top-0 left-0 z-1 flex h-screen items-center justify-center transition-[width] duration-300 ease-in-out"
      style={{ width: shouldShowLyricsPanel ? '40dvw' : '100%' }}
    >
      <FlexBox direction="column" gap={1} align="center">
        {videoBlobUrl ? (
          <video
            ref={videoRef}
            src={videoBlobUrl}
            autoPlay
            loop
            muted
            playsInline
            className="size-[50vh] object-cover rounded-3xl drop-shadow-2xl"
          />
        ) : (
          <Image
            url={imageSrc ?? ''}
            className="rounded-3xl drop-shadow-2xl"
            width="50vh"
            height="50vh"
          />
        )}
        <SongInfo />
      </FlexBox>
    </div>
  );
}

export default memo(Artwork);
