import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { formatTime } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import './NextSongs.css'
import { memo } from 'react'
import LRCVisualizer from '../lyrics/LRCVisualizer'

function Lyrics() {
  const { songQueue, currentSong, selectSong } = useMusicStore()
  const { selectedServer } = useServerStore()

  return (
    <FlexBox
      direction="column"
      gap={1}
      scroll="vertical"
      width={'100%'}
      height="100%"
      padding="0 0.5rem"
      className="rounded-lg"
    >
      <LRCVisualizer />
    </FlexBox>
  )
}

export default memo(Lyrics)
