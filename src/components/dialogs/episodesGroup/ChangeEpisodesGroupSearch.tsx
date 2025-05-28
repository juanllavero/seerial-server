import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { EpisodeGroupResult } from '@/data/interfaces/Utils'
import { getEpisodeGroupType } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './ChangeEpisodesGroupSearch.css'

function ChangeEpisodesGroupSearch() {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { episodesGroupDialog, closeEpisodesGroupDialog } = useDialogStore()
  const [episodeGroupsResults, setEpisodeGroupsResults] = useState<
    EpisodeGroupResult[]
  >([])

  useEffect(() => {
    search()
  }, [])

  const search = () => {
    fetch(
      `https://${selectedServer?.ip}/episodeGroups/search?id=${episodesGroupDialog.seriesToEdit?.id}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setEpisodeGroupsResults(data)
      })
      .catch((error) => console.error(error))
  }

  const saveIdentification = async (id: string) => {
    if (!selectedServer) return

    const serverIP = selectedServer.ip
    await connectWS(serverIP)
    fetch(`https://${serverIP}/updateEpisodeGroup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        showId: episodesGroupDialog.seriesToEdit?.id,
        themdbId: episodesGroupDialog.seriesToEdit?.themdbId,
        episodeGroupId: id,
      }),
    })

    closeEpisodesGroupDialog()
  }

  return (
    <FlexBox direction="column" gap={1} height={'35rem'} width={'35rem'}>
      <FlexBox
        direction="column"
        scroll="vertical"
        hideScrollbar
        height={'100%'}
        width={'100%'}
      >
        {/* Results List */}
        {episodeGroupsResults && episodeGroupsResults.length > 0 ? (
          episodeGroupsResults.map(
            (result: EpisodeGroupResult, index: number) => (
              <FlexBox
                className="episode-group-card"
                key={index}
                onClick={() => saveIdentification(result.id)}
                padding="1rem"
                width={'100%'}
                gap={1}
              >
                <FlexBox direction="column" gap={0.5}>
                  <span className="font-semibold">
                    {result.name} ({getEpisodeGroupType(result.type)})
                  </span>
                  <span className="text-sm" style={{ color: 'lightgray' }}>
                    {result.group_count} {t('groups')}, {result.episode_count}{' '}
                    {t('episodes')}
                  </span>
                  <span className="mt-1 line-clamp-4 text-ellipsis">
                    {result.description}
                  </span>
                </FlexBox>
              </FlexBox>
            ),
          )
        ) : episodeGroupsResults && episodeGroupsResults.length === 0 ? (
          <span>{t('noResults')}</span>
        ) : (
          <Loading />
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default ChangeEpisodesGroupSearch
