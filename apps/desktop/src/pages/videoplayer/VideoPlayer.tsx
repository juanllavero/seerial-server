import { Video } from '@seerial/domain';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import useSWR from 'swr';
import Loading from '@/components/Loading';
import FlexBox from '@/components/ui/FlexBox';
import { useServerStore } from '@/context/server.context';
import { authenticatedFetch, authenticatedFetcher } from '@/lib/auth';
import Controls from './components/controls/Controls';
import TopBar from './components/TopBar';

export default function VideoPlayer() {
  const { videoId } = useParams();
  const [showControls, setShowControls] = useState(true);
  const serverUrl = useServerStore((state) => state.serverUrl);

  // Get video data
  const {
    data: video,
    isLoading: loadingVideo,
    mutate,
  } = useSWR<Video>(
    videoId && serverUrl !== '' ? `${serverUrl}/api/details/video?id=${videoId}` : null,
    authenticatedFetcher,
  );

  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  async function getSignedStreamUrl(video: any, serverUrl: string) {
    const res = await authenticatedFetch(`${serverUrl}/api/get-video-url`, 'POST', {
      filePath: video.fileSrc,
      expiresIn: '2m',
    });

    const url = await res.json();
    return `${serverUrl}${url}`;
  }

  useEffect(() => {
    if (!video || !serverUrl) return;
    getSignedStreamUrl(video, serverUrl).then(setVideoSrc);
  }, [video?.id, serverUrl]);

  useEffect(() => {
    invoke('embed_mpv').catch(console.error);
  }, []);

  useEffect(() => {
    if (videoSrc && (videoSrc.startsWith('http') || videoSrc.startsWith('https'))) {
      loadVideo(videoSrc);
    }
  }, [videoSrc]);

  const loadVideo = async (url: string) => {
    try {
      await invoke('load_url', {
        url: url,
      });

      setVideoLoaded(true);
    } catch (e) {
      console.error(e);
      setVideoLoaded(false);
      setVideoError(true);
    }
  };

  if (!video || loadingVideo || !videoLoaded) {
    return <Loading />;
  }

  if (videoError) {
    return <div>Error loading video.</div>;
  }

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
        <Controls video={video} mutateVideo={mutate} />
      </FlexBox>
    </FlexBox>
  );
}
