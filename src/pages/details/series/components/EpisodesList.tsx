import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Season } from '@/data/interfaces/Media'
import { authenticatedFetcher } from '@/lib/auth'
import { useNavigate } from 'react-router'
import useSWR from 'swr'

interface EpisodesListProps {
	selectedSeasonId: string
}

function EpisodesList({ selectedSeasonId }: EpisodesListProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const navigate = useNavigate()
	const { data: season, isLoading } = useSWR<Season>(
		serverUrl !== ''
			? `${serverUrl}/details/season?id=${selectedSeasonId}`
			: null,
		authenticatedFetcher
	)

	if (isLoading) return <Loading />
	return (
		<div>
			{season?.episodes.map((episode) => (
				<div
					key={episode.id}
					onClick={() => {
						navigate(`/video-player/${episode.video.id}`)
					}}
				>
					{episode.name}
				</div>
			))}
		</div>
	)
}

export default EpisodesList
