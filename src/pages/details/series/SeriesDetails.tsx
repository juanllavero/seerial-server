import Loading from '@/components/Loading'
import Page from '@/components/Page'
import { useServerStore } from '@/context/server.context'
import { Season, Series } from '@/data/interfaces/Media'
import { memo, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import EpisodesList from './components/EpisodesList'
import { authenticatedFetcher } from '@/lib/auth'

function SeriesDetails() {
	const { seriesId } = useParams()
	const { serverUrl } = useServerStore(
		(state) => ({
			serverUrl: state.serverUrl,
		}),
		shallow
	)
	const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)

	const { data: show, isLoading } = useSWR<Series>(
		serverUrl !== '' ? `${serverUrl}/details/series?id=${seriesId}` : null,
		authenticatedFetcher
	)

	useEffect(() => {
		if (show && show.seasons.length > 0) {
			setSelectedSeason(show.seasons[0])
		}
	}, [show])

	if (isLoading) {
		return <Loading />
	}

	if (!isLoading && !show) return <span>Series not found</span>

	return (
		<Page padding='0 2rem'>
			{selectedSeason && (
				<EpisodesList selectedSeasonId={selectedSeason.id} />
			)}
		</Page>
	)
}

export default memo(SeriesDetails)
