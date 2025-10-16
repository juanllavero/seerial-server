import { AnimatedImage } from '@/components/images/AnimatedImage'
import Loading from '@/components/Loading'
import NavigationButton from '@/components/navigation/NavigationButton'
import NavigationGridView from '@/components/navigation/NavigationGridView'
import NavigationScrollView from '@/components/navigation/NavigationScrollView'
import FlexBox from '@/components/ui/FlexBox'
import { useServerStore } from '@/context/server.context'
import { Episode, Season } from '@/data/interfaces/Media'
import { authenticatedFetcher } from '@/lib/auth'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import useSWR from 'swr'

interface EpisodesListProps {
	selectedSeasonId: string
	selectedEpisode: Episode | null
	selectEpisode: (episode: Episode | null) => void
}

function EpisodesList({
	selectedSeasonId,
	selectedEpisode,
	selectEpisode,
}: EpisodesListProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const navigate = useNavigate()
	const { data: season, isLoading } = useSWR<Season>(
		serverUrl !== ''
			? `${serverUrl}/api/details/season?id=${selectedSeasonId}`
			: null,
		authenticatedFetcher
	)

	useEffect(() => {
		if (season && season.episodes.length > 0) {
			selectEpisode(season.episodes[0])
		} else {
			selectEpisode(null)
		}
	}, [selectedSeasonId, season])

	if (isLoading) return <Loading />
	return (
		<NavigationScrollView className='gap-5 pb-5 z-10'>
			{season?.episodes.map((episode) => (
				<div
					key={episode.id}
					className={`cursor-pointer border-4 border-transparent ${selectedEpisode?.id === episode.id ? ' border-white' : ''}`}
					style={{
						width: 300,
					}}
					onClick={() => {
						if (selectedEpisode?.id === episode.id) {
							navigate(`/video-player/${episode.video.id}`)
						} else {
							selectEpisode(episode)
						}
					}}
				>
					<AnimatedImage
						uri={episode.video.imgSrc}
						style={{
							aspectRatio: '16/9',
							objectFit: 'cover',
						}}
					/>
				</div>
			))}
		</NavigationScrollView>
	)
}

export default EpisodesList
