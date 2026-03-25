import { getSignedVideoStreamUrl, useGetVideo } from '@seerial/api';
import type { Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import VideoPlayer from '@/features/video-player/video-player';
import Loading from '@/shared/components/loading';

function VideoPlayerPage() {
  const { videoId } = useParams();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  const {
    data: video,
    isLoading: loadingVideo,
    mutate,
  } = useGetVideo<Video>(videoId ?? '', {
    enabled: !!videoId && serverUrl !== '',
  });

  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const getSignedStreamUrl = useCallback(async (video: Video, serverUrl: string) => {
    const url = await getSignedVideoStreamUrl({
      filePath: video.fileSrc,
      expiresIn: '2m',
    });
    return `${serverUrl}${url}`;
  }, []);

  const loadVideo = useCallback(async (url: string) => {
    try {
      await invoke('load_url', { url });
      setVideoLoaded(true);
    } catch (e) {
      console.error(e);
      setVideoLoaded(false);
      setVideoError(true);
    }
  }, []);

  useEffect(() => {
    if (!video || !serverUrl) return;
    getSignedStreamUrl(video, serverUrl).then(setVideoSrc);
  }, [video, serverUrl, getSignedStreamUrl]);

  useEffect(() => {
    invoke('embed_mpv').catch(console.error);
  }, []);

  useEffect(() => {
    if (videoSrc && (videoSrc.startsWith('http') || videoSrc.startsWith('https'))) {
      loadVideo(videoSrc);
    }
  }, [videoSrc, loadVideo]);

  if (!video || loadingVideo || !videoLoaded) {
    return <Loading />;
  }

  if (videoError) {
    return <div>Error loading video.</div>;
  }

  return <VideoPlayer mutateVideo={mutate} video={video} />;
}

export default memo(VideoPlayerPage);
