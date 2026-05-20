import { useGetAnimatedArtwork } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { memo, useEffect, useRef, useState } from 'react';
import FadedCover from '@/shared/components/backgrounds/faded-cover';
import FlexBox from '@/shared/components/ui/flex-box';
import Image from '@/shared/components/ui/image';

interface ArtworkProps {
  imageSrc?: string;
  albumFolderPath?: string;
  shouldShowLyricsPanel: boolean;
  renderSongInfo: () => React.ReactNode;
}

const TEST_BACKGROUND_STYLE: 'classic' | 'background' = 'classic';

function Artwork({
  imageSrc,
  albumFolderPath,
  shouldShowLyricsPanel,
  renderSongInfo,
}: ArtworkProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

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

  if (TEST_BACKGROUND_STYLE === 'background') {
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
            className="h-[50vh] w-[50vh] object-cover rounded-3xl drop-shadow-2xl"
          />
        ) : (
          <Image
            url={imageSrc ?? ''}
            className="rounded-3xl drop-shadow-2xl"
            width="50vh"
            height="50vh"
          />
        )}
        {renderSongInfo()}
      </FlexBox>
    </div>
  );
}

export default memo(Artwork);
