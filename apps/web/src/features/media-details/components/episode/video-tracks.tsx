import { useGetVideoMediaInfo, useUpdateVideoMediaInfo } from '@seerial/api';
import {
  type AudioTrack,
  getAudioTrack,
  getSubtitleTrack,
  type SubtitleTrack,
  type Video,
  type VideoTrack,
} from '@seerial/domain';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageName } from '@/shared/localization/track-languages';
import FlexBox from '@/shared/ui/flex-box';
import Loading from '@/shared/ui/loading';
import SelectableWrapper from '@/shared/ui/selectable-wrapper';

interface VideoInfo {
  title: string;
  subtitle: string;
  preferAudioLan: string;
  preferSubtitleLan: string;
  subsMode: string;
}

interface VideoTracksProps {
  video: Video | null;
  mutate: () => void;
}

function VideoTracks({ video, mutate }: VideoTracksProps) {
  const { i18n } = useTranslation();
  // Get video info
  const { data: videoInfo, isLoading } = useGetVideoMediaInfo<VideoInfo>(video?.id ?? '', {
    enabled: Boolean(video?.id),
  });
  const { mutateAsync: updateVideoMediaInfo } = useUpdateVideoMediaInfo<Video>(video?.id ?? '');

  const [selectedVideoTrack, setSelectedVideoTrack] = useState<VideoTrack | null>(
    video?.videoTracks?.find((track: VideoTrack) => track.selected) || null,
  );
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(
    video?.audioTracks?.find((track: AudioTrack) => track.selected) || null,
  );
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<SubtitleTrack | null>(
    video?.subtitleTracks?.find((track: SubtitleTrack) => track.selected) || null,
  );
  const [tracks, setTracks] = useState<{
    videoTracks: VideoTrack[];
    audioTracks: AudioTrack[];
    subtitleTracks: SubtitleTrack[];
  }>({
    videoTracks: video?.videoTracks || [],
    audioTracks: video?.audioTracks || [],
    subtitleTracks: video?.subtitleTracks || [],
  });

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!video || !videoInfo || hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      const data = await updateVideoMediaInfo().catch(() => null);

      if (!data) {
        return;
      }

      const { videoTracks = [], audioTracks = [], subtitleTracks = [] } = data;
      setTracks({ videoTracks, audioTracks, subtitleTracks });

      const audioTrack = getAudioTrack(videoInfo.preferAudioLan, video);
      const subtitleTrack = getSubtitleTrack(
        videoInfo.preferSubtitleLan,
        videoInfo.subsMode,
        video,
      );
      const videoTrack = videoTracks[0] ?? null;

      setSelectedVideoTrack(videoTrack);
      setSelectedAudioTrack(audioTrack);
      setSelectedSubtitleTrack(subtitleTrack);

      if (videoTrack && videoTracks) {
        for (const videoTrack of videoTracks) {
          videoTrack.selected = false;
        }
        videoTrack.selected = true;
      }

      if (audioTrack && audioTracks) {
        for (const audioTrack of audioTracks) {
          audioTrack.selected = false;
        }
        audioTrack.selected = true;
      }

      if (subtitleTrack && subtitleTracks) {
        for (const subTrack of subtitleTracks) {
          subTrack.selected = false;
        }
        subtitleTrack.selected = true;
      }

      mutate();
    };

    fetchData();
  }, [mutate, updateVideoMediaInfo, video, videoInfo]);

  const handleVideoTrackChange = (key: string, _value: string) => {
    setSelectedVideoTrack(tracks.videoTracks.find((track) => track.id === Number(key)) ?? null);
  };

  const handleAudioTrackChange = (key: string, _value: string) => {
    setSelectedAudioTrack(tracks.audioTracks.find((track) => track.id === Number(key)) ?? null);
  };

  const handleSubtitleTrackChange = (key: string, _value: string) => {
    setSelectedSubtitleTrack(
      tracks.subtitleTracks.find((track) => track.id === Number(key)) ?? null,
    );
  };

  if (isLoading) return <Loading />;

  if (!video || !videoInfo || !tracks || tracks.audioTracks.length === 0) return null;

  return (
    <FlexBox gap={1} padding="0 0 0 1rem">
      <FlexBox
        direction="column"
        justify="center"
        align="start"
        gap={1}
        width={'6rem'}
        height={'10rem'}
      >
        <FlexBox justify="center" align="center" height={'2rem'}>
          <span style={{ color: 'lightgray' }}>{t('video')}</span>
        </FlexBox>
        <FlexBox justify="center" align="center" height={'2rem'}>
          <span style={{ color: 'lightgray' }}>{t('audio')}</span>
        </FlexBox>
        <FlexBox justify="center" align="center" height={'2rem'}>
          <span style={{ color: 'lightgray' }}>{t('subs')}</span>
        </FlexBox>
      </FlexBox>
      <FlexBox
        direction="column"
        justify="center"
        align="start"
        gap={1}
        width={'100%'}
        height={'10rem'}
      >
        {tracks.videoTracks &&
        tracks.videoTracks.filter((track) => track.codec !== 'MJPEG')?.length > 1 ? (
          <SelectableWrapper
            value={selectedVideoTrack?.displayTitle ?? ''}
            onValueChange={handleVideoTrackChange}
            options={
              tracks.videoTracks
                ? tracks.videoTracks
                    .filter((track) => track.codec !== 'MJPEG')
                    .map((track: VideoTrack) => ({
                      key: track.id.toString(),
                      value: track.displayTitle,
                    }))
                : []
            }
          />
        ) : (
          <span className="font-semibold">{selectedVideoTrack?.displayTitle ?? t('none')}</span>
        )}

        {tracks.audioTracks && tracks.audioTracks.length > 1 ? (
          <SelectableWrapper
            value={
              selectedAudioTrack
                ? `${useLanguageName(selectedAudioTrack?.languageTag ?? '', i18n.language)} ${selectedAudioTrack?.displayTitle}`
                : ''
            }
            onValueChange={handleAudioTrackChange}
            options={
              tracks.audioTracks
                ? tracks.audioTracks.map((track: AudioTrack) => ({
                    key: track.id.toString(),
                    value: `${useLanguageName(track.languageTag, i18n.language)} ${track.displayTitle}`,
                  }))
                : []
            }
          />
        ) : (
          <span className="font-semibold">
            {selectedAudioTrack
              ? `${useLanguageName(selectedAudioTrack?.languageTag ?? '', i18n.language)} ${selectedAudioTrack?.displayTitle}`
              : ''}
          </span>
        )}

        {tracks.subtitleTracks && tracks.subtitleTracks.length > 1 ? (
          <SelectableWrapper
            value={
              selectedSubtitleTrack
                ? `${selectedSubtitleTrack.title} ${selectedSubtitleTrack.displayTitle}`
                : t('none')
            }
            onValueChange={handleSubtitleTrackChange}
            options={
              tracks.subtitleTracks
                ? [
                    {
                      key: 'none',
                      value: t('none'),
                    },
                    ...tracks.subtitleTracks
                      .filter(
                        (track) =>
                          track.codec !== 'HDMV_PGS_SUBTITLE' && track.codec !== 'DVD_SUBTITLE',
                      )
                      .map((track: SubtitleTrack) => ({
                        key: track.id.toString(),
                        value: `${track.title} ${track.displayTitle}`,
                      })),
                  ]
                : []
            }
          />
        ) : (
          <span className="font-semibold">
            {`${selectedSubtitleTrack?.title} ${selectedSubtitleTrack?.displayTitle}`}
          </span>
        )}
      </FlexBox>
    </FlexBox>
  );
}

export default VideoTracks;
