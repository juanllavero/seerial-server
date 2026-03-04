import FlexBox from '@/components/ui/FlexBox'
import { VideoInfo as VideoInfoData } from '@/data/interfaces/Media'
import { formatTimeForView } from '@/utils/utils'

interface VideoInfoProps {
	videoInfo?: VideoInfoData
	duration?: number
}

function VideoInfo({ videoInfo, duration }: VideoInfoProps) {
	if (!videoInfo) return null
	return (
		<FlexBox direction='column' gap={0.5}>
			<span className='font-black text-5xl'>{videoInfo.title}</span>
			{videoInfo.subtitle !== '' && (
				<span className='font-bold text-3xl'>{videoInfo.subtitle}</span>
			)}
			<FlexBox gap={0.5} align='center'>
				<span className='font-semibold text-xl'>{videoInfo.info}</span>
				{duration && duration > 0 ? (
					<span className='font-semibold text-xl'>
						{formatTimeForView(duration / 60)}
					</span>
				) : null}
			</FlexBox>
		</FlexBox>
	)
}

export default VideoInfo
