import type { AudioTrack, SubtitleTrack, Video, VideoInfo } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { Captions, Music2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NavigationButton from '@/components/navigation/NavigationButton';
import { Button } from '@/components/ui/button';
import DropdownWrapper from '@/components/ui/DropdownWrapper';
import FlexBox from '@/components/ui/FlexBox';
import { authenticatedFetch } from '@/lib/auth';
import { useLanguageName } from '@/localization/TrackLanguages';
import { getAudioTrack, getSubtitleTrack } from '@/utils/utils';

type Track = [number, string];

interface TracksSelectorsProps {
  video: Video;
  videoInfo?: VideoInfo;
  mutateVideo: () => void;
}

function TracksSelectors({ video, videoInfo, mutateVideo }: TracksSelectorsProps) {
  const { i18n } = useTranslation();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(
    video?.audioTracks?.find((track) => track.selected) || null,
  );
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<SubtitleTrack | null>(
    video?.subtitleTracks?.find((track) => track.selected) || null,
  );
  const [tracks, setTracks] = useState<{
    audioTracks: AudioTrack[];
    subtitleTracks: SubtitleTrack[];
  }>({
    audioTracks: video?.audioTracks || [],
    subtitleTracks: video?.subtitleTracks || [],
  });

  const handleAudioTrackChange = async (track: AudioTrack) => {
    setSelectedAudioTrack(track);
    await invoke('set_audio_track', { trackId: track.id }).catch(console.error);
  };

  const handleSubtitleTrackChange = async (track: SubtitleTrack) => {
    setSelectedSubtitleTrack(track);
    await invoke('set_subtitle_track', { trackId: track.id }).catch(console.error);
  };

  useEffect(() => {
    if (!video || !videoInfo) return;

    const fetchData = async () => {
      const result = await authenticatedFetch(`${serverUrl}/api/updateMediaInfo`, 'PUT', {
        videoId: video.id,
      });

      if (!result || !result.ok) {
        return;
      }

      const data = await result.json();

      const { videoTracks, audioTracks, subtitleTracks } = data;
      setTracks({ audioTracks, subtitleTracks });

      const audioTrack = getAudioTrack(videoInfo.preferAudioLan, video);
      const subtitleTrack = getSubtitleTrack(
        videoInfo.preferSubtitleLan,
        videoInfo.subsMode,
        video,
      );
      const videoTrack = videoTracks[0] ?? null;

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

      mutateVideo();
    };

    fetchData();
  }, [video, videoInfo, mutateVideo]);

  return (
    <>
      {tracks.audioTracks && tracks.audioTracks.length > 1 && (
        <DropdownWrapper
          onOpenChange={setDropdownOpen}
          content={{
            items: [
              {
                items: tracks.audioTracks.map((track) => ({
                  title: `${useLanguageName(track.languageTag ?? '', i18n.language)} ${track.displayTitle} ${selectedAudioTrack?.id === track.id ? '✓' : ''}`,
                  action: () => {
                    handleAudioTrackChange(track);
                  },
                })),
              },
            ],
          }}
          button={
            <NavigationButton
              transparent
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Music2 />
            </NavigationButton>
          }
        />
      )}
      {tracks.subtitleTracks &&
        tracks.subtitleTracks.filter(
          (track) => track.codec !== 'HDMV_PGS_SUBTITLE' && track.codec !== 'DVD_SUBTITLE',
        ).length > 1 && (
          <DropdownWrapper
            onOpenChange={setDropdownOpen}
            content={{
              items: [
                {
                  items: tracks.subtitleTracks
                    .filter(
                      (track) =>
                        track.codec !== 'HDMV_PGS_SUBTITLE' && track.codec !== 'DVD_SUBTITLE',
                    )
                    .map((track) => ({
                      title: `${track.title} ${track.displayTitle} ${selectedSubtitleTrack?.id === track.id ? '✓' : ''}`,
                      action: () => {
                        handleSubtitleTrackChange(track);
                      },
                    })),
                },
              ],
            }}
            button={
              <NavigationButton
                transparent
                className="p-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Captions />
              </NavigationButton>
            }
          />
        )}
    </>
  );
}

export default TracksSelectors;
