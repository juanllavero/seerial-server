import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { formatTime } from '@/utils/ReactUtils'
import { MediaSearchResult } from './Test'

interface DownloadMediaCardProps {
  result: MediaSearchResult
  downloadMedia: (result: MediaSearchResult) => void
}

function DownloadMediaCard({ result, downloadMedia }: DownloadMediaCardProps) {
  return (
    <FlexBox onClick={() => downloadMedia(result)} padding="1rem" gap={1}>
      <FlexBox width={'30%'}>
        <LazyImage
          src={result.thumbnail}
          alt={result.title ?? 'Media result image'}
          width={'100%'}
          height={'auto'}
        />
      </FlexBox>

      <FlexBox direction="column" gap={0.5} width={'75%'}>
        <span className="font-semibold">{result.title}</span>
        <span className="text-sm" style={{ color: 'lightgray' }}>
          {formatTime(result.duration)}
        </span>
      </FlexBox>
    </FlexBox>
  )
}

export default DownloadMediaCard
