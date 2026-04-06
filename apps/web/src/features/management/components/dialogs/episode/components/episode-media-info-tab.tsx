import { useGetVideoMediaInfo, useUpdateVideoMediaInfo } from '@seerial/api';
import type { AudioTrack, MediaInfoData, SubtitleTrack, Video, VideoTrack } from '@seerial/domain';
import { getAudioTrackragetSubtitleTrackubtitleTr@seerial/domain from '@seerial/domain';
import { useEffect, useStateuseState react
import { useIsTabletoks/use-tashared/hooks/use-tablet
import FlexBox from '@/shared/ui/flex-box';
import Loading from '@/shared/ui/loading';

interface EpisodeMediaInfoTabProps {
  video: Video;
}

interface VideoInfo {
  title: string;
  subtitle: string;
  preferAudioLan: string;
  preferSubtitleLan: string;
  subsMode: string;
}

interface SelectableTrack {
  id: number;
  selected: boolean;
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchMediaInfoWithRetry = async (
  fetchMediaInfo: () => Promise<MediaInfoData>,
): Promise<MediaInfoData | null> => {
  try {
    return await fetchMediaInfo();
  } catch {}

  await wait(2000);

  try {
    return await fetchMediaInfo();
  } catch {}

  await wait(2000);

  return null;
};

const applySelectedTrack = <T extends SelectableTrack>(
  tracks: T[],
  selectedTrackId: number | null,
): T[] => {
  if (selectedTrackId === null) {
    return tracks;
  }

  return tracks.map((track) => ({
    ...track,
    selected: track.id === selectedTrackId,
  }));
};

const buildMediaInfoData = (
  data: MediaInfoData,
  videoInfo: VideoInfo,
  video: Video,
): MediaInfoData => {
  const selectedVideoTrackId = data.videoTracks[0]?.id ?? null;
  const selectedAudioTrackId = getAudioTrack(videoInfo.preferAudioLan, video)?.id ?? null;
  const selectedSubtitleTrackId =
    getSubtitleTrack(videoInfo.preferSubtitleLan, videoInfo.subsMode, video)?.id ?? null;

  return {
    ...data,
    videoTracks: applySelectedTrack(data.videoTracks, selectedVideoTrackId),
    audioTracks: applySelectedTrack(data.audioTracks, selectedAudioTrackId),
    subtitleTracks: applySelectedTrack(data.subtitleTracks, selectedSubtitleTrackId),
  };
};

function EpisodeMediaInfoTab({ video }: EpisodeMediaInfoTabProps) {
  const isTablet = useIsTablet();
  const [loaded, setLoaded] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfoData | null>(null);

  // Get video info
  const { data: videoInfo } = useGetVideoMediaInfo<VideoInfo>(video.id, {
    enabled: Boolean(video.id),
  });
  const { mutateAsync: updateVideoMediaInfo } = useUpdateVideoMediaInfo<MediaInfoData>(video.id);

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      if (!videoInfo) return;

      setLoaded(false);

      const data = await fetchMediaInfoWithRetry(() => updateVideoMediaInfo());

      if (!isActive) {
        return;
      }

      if (!data) {
        setLoaded(true);
        return;
      }

      setMediaInfo(buildMediaInfoData(data, videoInfo, video));

      setLoaded(true);
    };

    void fetchData();

    return () => {
      isActive = false;
    };
  }, [updateVideoMediaInfo, video, videoInfo]);

  const getVideoInfo = (track: VideoTrack) => {
    const mediaInfoFieldsVideo = [
      { key: 'Codec', value: track.codec },
      { key: 'Codec Extended', value: track.codecExt },
      { key: 'Bitrate', value: track.bitrate },
      { key: 'Frame Rate', value: track.framerate },
      { key: 'Coded Height', value: track.codedHeight },
      { key: 'Coded Width', value: track.codedWidth },
      { key: 'Chroma Location', value: track.chromaLocation },
      { key: 'Color Space', value: track.colorSpace },
      { key: 'Aspect Ratio', value: track.aspectRatio },
      { key: 'Profile', value: track.profile },
      { key: 'Ref Frames', value: track.refFrames },
      { key: 'Color Range', value: track.colorRange },
      { key: 'Display Title', value: track.displayTitle },
    ];

    return (
      <>
        {mediaInfoFieldsVideo.map(
          (field) =>
            field.value && (
              <div key={`video-media-${field.key}`}>
                <span className="mr-2" style={{ color: 'lightgray' }}>
                  {field.key}
                </span>
                <span className="font-semibold">{field.value}</span>
              </div>
            ),
        )}
      </>
    );
  };

  const getAudioInfo = (track: AudioTrack) => {
    const mediaInfoFieldsAudio = [
      { key: 'Codec', value: track.codec },
      { key: 'Codec Extended', value: track.codecExt },
      { key: 'Channels', value: track.channels },
      { key: 'Channel Layout', value: track.channelLayout },
      { key: 'Bitrate', value: track.bitrate },
      { key: 'Language', value: track.language },
      { key: 'Language tag', value: track.languageTag },
      { key: 'Bit Depth', value: track.bitDepth },
      { key: 'Profile', value: track.profile },
      { key: 'Sampling Rate', value: track.samplingRate },
      { key: 'Display Title', value: track.displayTitle },
    ];

    return (
      <>
        {mediaInfoFieldsAudio.map(
          (field) =>
            field.value && (
              <div key={`audio-media-${field.key}`}>
                <span className="mr-2" style={{ color: 'lightgray' }}>
                  {field.key}
                </span>
                <span className="font-semibold">{field.value}</span>
              </div>
            ),
        )}
      </>
    );
  };

  const getSubtitleInfo = (track: SubtitleTrack) => {
    const mediaInfoFieldsSubs = [
      { key: 'Codec', value: track.codec },
      { key: 'Codec Extended', value: track.codecExt },
      { key: 'Language', value: track.language },
      { key: 'Language tag', value: track.languageTag },
      { key: 'Title', value: track.title },
      { key: 'Display Title', value: track.displayTitle },
    ];

    return (
      <>
        {mediaInfoFieldsSubs.map(
          (field) =>
            field.value && (
              <div key={`subs-media-${field.key}`}>
                <span className="mr-2" style={{ color: 'lightgray' }}>
                  {field.key}
                </span>
                <span className="font-semibold">{field.value}</span>
              </div>
            ),
        )}
      </>
    );
  };

  if (!loaded || !mediaInfo) {
    return (
      <FlexBox
        direction="column"
        gap={1}
        justify="space-between"
        height={isTablet ? '25rem' : '35rem'}
        hideScrollbar={isTablet}
        scroll="vertical"
      >
        <Loading />
      </FlexBox>
    );
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={isTablet ? '25rem' : '35rem'}
      width={isTablet ? '100%' : '50rem'}
      padding="0 0.5rem"
      hideScrollbar={isTablet}
      scroll="vertical"
    >
      <FlexBox direction="column" className="left-media-info">
        <span className="mb-1 text-lg font-semibold">Media info</span>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Duration</span>
          <span className="font-semibold">{mediaInfo.mediaInfo?.duration}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>File</span>
          <span className="font-semibold">{mediaInfo.mediaInfo?.file}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Location</span>
          <span className="font-semibold">{mediaInfo.mediaInfo?.location}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Bitrate</span>
          <span className="font-semibold">{mediaInfo.mediaInfo?.bitrate}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Size</span>
          <span className="font-semibold">{mediaInfo.mediaInfo?.size}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Container</span>
          <span className="font-semibold">{mediaInfo.mediaInfo?.container}</span>
        </FlexBox>
      </FlexBox>
      <FlexBox direction="column" gap={1}>
        {mediaInfo.videoTracks?.map((track: VideoTrack) => (
          <div key={`video-${track.id}`}>
            <span className="mt-2 mb-1 text-lg font-semibold">Video</span>
            {getVideoInfo(track)}
          </div>
        ))}
        {mediaInfo.audioTracks?.map((audioTrack: AudioTrack) => (
          <div key={`audio-${audioTrack.id}`}>
            <span className="mt-2 mb-1 text-lg font-semibold">Audio</span>
            {getAudioInfo(audioTrack)}
          </div>
        ))}
        {mediaInfo.subtitleTracks?.map((track: SubtitleTrack) => (
          <div key={`subs-${track.id}`}>
            <span className="mt-2 mb-1 text-lg font-semibold">Subtitle</span>
            {getSubtitleInfo(track)}
          </div>
        ))}
      </FlexBox>
    </FlexBox>
  );
}

export default EpisodeMediaInfoTab;
