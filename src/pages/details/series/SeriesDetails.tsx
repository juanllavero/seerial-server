import Loading from '@/components/Loading'
import Page from '@/components/Page'
import { useServerStore } from '@/context/server.context'
import { Episode, Season, Series } from '@/data/interfaces/Media'
import { memo, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import EpisodesList from './components/EpisodesList'
import { authenticatedFetcher } from '@/lib/auth'
import SeasonSelector from './components/SeasonSelector'
import DetailsInfo from '../components/DetailsInfo'
import { t } from 'i18next'
import { formatDate, formatTimeForView } from '@/utils/utils'
import GradientBackground from '@/components/backgrounds/GradientBackground'

function SeriesDetails() {
	const { seriesId } = useParams()
	const { serverUrl } = useServerStore(
		(state) => ({
			serverUrl: state.serverUrl,
		}),
		shallow
	)
	const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
	const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)

	const { data: show, isLoading } = useSWR<Series>(
		serverUrl !== ''
			? `${serverUrl}/api/details/series?id=${seriesId}`
			: null,
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

	if (!show) return <span>Series not found</span>

	return (
		<Page padding='0 2rem' justify='end'>
			<GradientBackground
				imageSrc={selectedSeason?.backgroundSrc ?? show?.coverSrc}
				index={0}
			/>
			<DetailsInfo
				title={show.name}
				logoUrl={show.logoSrc}
				subtitle={selectedEpisode?.name}
				tagline={show.tagline}
				score={show.score}
				genres={show.genres}
				createdBy={show.creator}
				infoItems={[
					selectedEpisode
						? `${t('seasonLetter')}${selectedEpisode.seasonNumber}${t('episodeLetter')}${selectedEpisode.episodeNumber}`
						: '',
					formatDate(selectedEpisode ? selectedEpisode.year : show.year),
					selectedEpisode
						? formatTimeForView(selectedEpisode.video.runtime ?? 0)
						: '',
				]}
				overview={show.overview}
			/>
			{selectedSeason && (
				<EpisodesList
					selectedSeasonId={selectedSeason.id}
					selectedEpisode={selectedEpisode}
					selectEpisode={setSelectedEpisode}
				/>
			)}
			<SeasonSelector
				seasons={show.seasons}
				onSelectSeason={setSelectedSeason}
				selectedSeasonId={selectedSeason?.id}
			/>
		</Page>
	)
}

export default memo(SeriesDetails)
