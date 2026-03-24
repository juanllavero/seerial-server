import type { Video } from '@seerial/domain';
import { useState } from 'react';
import FlexBox from '@/components/ui/FlexBox';
import Controls from '@/pages/videoplayer/components/controls/Controls';
import TopBar from '../top-bar-layout/components/top-bar';

interface VideoPlayerProps {
  video: Video | undefined;
  mutateVideo: () => void;
}

export default function VideoPlayer({ video, mutateVideo }: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);

  return (
    <FlexBox
      className="absolute w-full h-full"
      css={{
        backgroundColor: showControls ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
      }}
      width={'100%'}
      height={'100%'}
      justify="space-between"
      direction="column"
    >
      <TopBar />

      <FlexBox
        width={'100%'}
        padding="1rem"
        justify="center"
        align="center"
        css={{
          background:
            'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 3%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0) 100%)',
        }}
      >
        <Controls video={video} mutateVideo={mutateVideo} />
      </FlexBox>
    </FlexBox>
  );
}
