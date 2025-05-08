import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { useServerStore } from '@/context/server.context'
import {
  AudioTrack,
  SubtitleTrack,
  VideoTrack,
} from '@/data/interfaces/MediaInfo'
import { formatDate } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { useNavigate, useParams } from '@tanstack/react-router'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'

function EpisodeDetailsPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { serverIP } = useServerStore()
  const { episodeId } = useParams({
    from: '/details/episode/$episodeId',
  })

  const { data: episode, isLoading } = useSWR(
    episodeId ? `http://${serverIP}/details/episode?id=${episodeId}` : null,
    fetcher,
  )

  const [selectedVideoTrack, setSelectedVideoTrack] =
    useState<VideoTrack | null>(null)
  const [selectedAudioTrack, setSelectedAudioTrack] =
    useState<AudioTrack | null>(null)
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] =
    useState<SubtitleTrack | null>(null)

  useEffect(() => {
    if (!episode) return

    const fetchData = async () => {
      const result = await fetch(`http://${serverIP}/updateMediaInfo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episode: episode,
        }),
      })

      if (!result.ok) {
        return
      }

      const data = await result.json()

      // const audioTrack = getAudioTrack(
      //   selectedLibrary,
      //   selectedSeason,
      //   data.audioTracks,
      // )
      // const subtitleTrack = getSubtitleTrack(
      //   selectedLibrary,
      //   selectedSeason,
      //   data.subtitleTracks,
      // )

      const videoTrack = data.videoTracks[0] ?? null

      // setSelectedVideoTrack(videoTrack)
      // setSelectedAudioTrack(audioTrack)
      // setSelectedSubtitleTrack(subtitleTrack)

      // if (videoTrack) {
      //   for (const videoTrack of selectedEpisode.videoTracks) {
      //     videoTrack.selected = false
      //   }
      //   videoTrack.selected = true
      // }

      // if (audioTrack) {
      //   for (const audioTrack of selectedEpisode.audioTracks) {
      //     audioTrack.selected = false
      //   }
      //   audioTrack.selected = true
      // }

      // if (subtitleTrack) {
      //   for (const subTrack of selectedEpisode.subtitleTracks) {
      //     subTrack.selected = false
      //   }
      //   subtitleTrack.selected = true
      // }

      // updateEpisode({
      //   libraryId: selectedLibrary.id,
      //   showId: selectedSeries.id,
      //   episode: {
      //     ...selectedEpisode,
      //     videoTracks: selectedEpisode.videoTracks.map((track) =>
      //       track.id === (videoTrack?.id ?? '') ? (videoTrack ?? track) : track,
      //     ),
      //     audioTracks: selectedEpisode.audioTracks.map((track) =>
      //       track.id === (audioTrack?.id ?? '') ? (audioTrack ?? track) : track,
      //     ),
      //     subtitleTracks: selectedEpisode.subtitleTracks.map((track) =>
      //       track.id === (subtitleTrack?.id ?? '')
      //         ? (subtitleTrack ?? track)
      //         : track,
      //     ),
      //   },
      // })
    }

    fetchData()
  }, [episode])

  if (isLoading) {
    return <Loading />
  }

  // const handleVideoTrackChange = (key: string) => {
  //   const trackToSelect = selectedEpisode.videoTracks.find(
  //     (track) => track.id.toString() === key,
  //   )

  //   if (trackToSelect) {
  //     for (const subTrack of selectedEpisode.videoTracks) {
  //       subTrack.selected = false
  //     }

  //     trackToSelect.selected = true

  //     updateEpisode({
  //       libraryId: selectedLibrary.id,
  //       showId: selectedSeries.id,
  //       episode: {
  //         ...selectedEpisode,
  //         videoTracks: selectedEpisode.videoTracks.map((track) =>
  //           track.id.toString() === key ? (trackToSelect ?? track) : track,
  //         ),
  //       },
  //     })
  //   }
  // }

  // const handleAudioTrackChange = (key: string) => {
  //   const trackToSelect = selectedEpisode.audioTracks.find(
  //     (track) => track.id.toString() === key,
  //   )

  //   if (trackToSelect) {
  //     for (const audioTrack of selectedEpisode.audioTracks) {
  //       audioTrack.selected = false
  //     }

  //     trackToSelect.selected = true

  //     updateEpisode({
  //       libraryId: selectedLibrary.id,
  //       showId: selectedSeries.id,
  //       episode: {
  //         ...selectedEpisode,
  //         audioTracks: selectedEpisode.audioTracks.map((track) =>
  //           track.id.toString() === key ? (trackToSelect ?? track) : track,
  //         ),
  //       },
  //     })
  //   }
  // }

  // const handleSubtitleTrackChange = (key: string) => {
  //   const trackToSelect = selectedEpisode.subtitleTracks.find(
  //     (track) => track.id.toString() === key,
  //   )

  //   if (trackToSelect) {
  //     for (const subTrack of selectedEpisode.subtitleTracks) {
  //       subTrack.selected = false
  //     }

  //     trackToSelect.selected = true

  //     updateEpisode({
  //       libraryId: selectedLibrary.id,
  //       showId: selectedSeries.id,
  //       episode: {
  //         ...selectedEpisode,
  //         subtitleTracks: selectedEpisode.subtitleTracks.map((track) =>
  //           track.id.toString() === key ? (trackToSelect ?? track) : track,
  //         ),
  //       },
  //     })
  //   }
  // }

  return (
    <FlexBox
      className="details-container"
      gap={2}
      wrap="nowrap"
      padding="10rem 3rem"
      height={'100%'}
    >
      <FlexBox>
        <LazyImage
          url={episode.video.imgSrc}
          width={500}
          maxHeight={300}
          height={300}
          errorSrc={'/img/Default_video_thumbnail.jpg'}
        />
      </FlexBox>

      <FlexBox direction="column" gap={1}>
        <FlexBox direction="column">
          {/* <span
            onClick={() => navigate({ to: `/details/series/${seriesId}` })}
            className="cursor-pointer text-4xl font-bold uppercase"
          >
            {selectedSeries.name}
          </span> */}
          <span className="text-2xl font-semibold">{episode.name}</span>
        </FlexBox>
        <FlexBox gap={1}>
          <span>
            {t('seasonLetter')}
            {episode.seasonNumber}
            {t('episodeLetter')}
            {episode.episodeNumber}
          </span>
          <span>{formatDate(episode.year)}</span>
          <span>{episode.video.runtime.toFixed()}min</span>
        </FlexBox>
        <span>{episode.overview}</span>

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
          {/* <FlexBox
            direction="column"
            justify="center"
            align="start"
            gap={1}
            width={'100%'}
            height={'10rem'}
          >
            {episode.videoTracks && episode.videoTracks.length > 1 ? (
              <SelectableWrapper
                defaultValue={selectedVideoTrack?.displayTitle ?? ''}
                onValueChange={handleVideoTrackChange}
                options={
                  selectedEpisode.videoTracks
                    ? selectedEpisode.videoTracks.map((track: VideoTrack) => ({
                        key: track.id.toString(),
                        value: track.displayTitle,
                      }))
                    : []
                }
              />
            ) : (
              <span className="font-semibold">
                {selectedVideoTrack?.displayTitle ?? ''}
              </span>
            )}

            {selectedEpisode.audioTracks &&
            selectedEpisode.audioTracks.length > 1 ? (
              <SelectableWrapper
                defaultValue={
                  selectedAudioTrack
                    ? `${useLanguageName(selectedAudioTrack?.languageTag ?? '', i18n.language)} ${selectedAudioTrack?.displayTitle}`
                    : ''
                }
                onValueChange={handleAudioTrackChange}
                options={
                  selectedEpisode.audioTracks
                    ? selectedEpisode.audioTracks.map((track: AudioTrack) => ({
                        key: track.id.toString(),
                        value: `${useLanguageName(track.languageTag, i18n.language)} ${track.displayTitle}`,
                      }))
                    : []
                }
              />
            ) : (
              <span className="font-semibold">
                {selectedAudioTrack?.displayTitle ?? ''}
              </span>
            )}

            {selectedEpisode.subtitleTracks &&
            selectedEpisode.subtitleTracks.length > 1 ? (
              <SelectableWrapper
                defaultValue={
                  selectedSubtitleTrack
                    ? `${useLanguageName(selectedSubtitleTrack?.languageTag ?? '', i18n.language)} ${selectedSubtitleTrack?.displayTitle}`
                    : ''
                }
                onValueChange={handleSubtitleTrackChange}
                options={
                  selectedEpisode.subtitleTracks
                    ? selectedEpisode.subtitleTracks.map(
                        (track: SubtitleTrack) => ({
                          key: track.id.toString(),
                          value: `${useLanguageName(track.languageTag, i18n.language)} ${track.displayTitle}`,
                        }),
                      )
                    : []
                }
              />
            ) : (
              <span className="font-semibold">
                {selectedSubtitleTrack?.displayTitle ?? ''}
              </span>
            )}
          </FlexBox> */}
        </FlexBox>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeDetailsPage
