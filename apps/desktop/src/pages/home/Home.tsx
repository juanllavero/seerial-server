import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useServerStore } from '../../context/server.context'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { Skeleton } from '../../components/ui/skeleton'
import ContentCard from '../../components/Card'
import NavigationScrollView from '@/components/navigation/NavigationScrollView'
import Page from '@/components/Page'
import HomeInfo from './components/HomeInfo'
import { ContinueWatchingElement } from '@/data/interfaces/Lists'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { authenticatedFetcher } from '@/lib/auth'
import GradientBackground from '@/components/backgrounds/GradientBackground'
import TransparentImage from './components/TransparentImage'

function Home() {
	const { currentUser } = useServerStore()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { server, serverUrl } = useServerStore()
	const [selectedElement, setSelectedElement] =
		useState<ContinueWatchingElement | null>(null)

	// Get Continue Watching items
	const { data: continueWatching, isLoading } = useSWR<
		ContinueWatchingElement[]
	>(
		server
			? `${serverUrl}/api/continueWatching?userId=${currentUser?.id ?? null}`
			: null,
		authenticatedFetcher
	)

	useEffect(() => {
		if (continueWatching && continueWatching.length > 0)
			setFocus(`continueWatchingCard-${continueWatching[0].id}`)
	}, [continueWatching])

	const goToContent = (url: string) => {
		navigate(url)
	}

	const skeletons = Array.from({ length: 10 }, (_, index) => (
		<Skeleton
			key={'ContinueWatching ' + index}
			className={'w-[280px] h-[400px]'}
		/>
	))

	return (
		<Page justify='end'>
			<GradientBackground
				imageSrc={
					selectedElement?.backgroundImage ?? selectedElement?.posterImage
				}
				index={0}
			/>

			<TransparentImage imageSrc={selectedElement?.backgroundImage ?? ''} />

			<HomeInfo selectedElement={selectedElement} />

			<span className='text-xl z-10'>{t('continueWatching')}</span>

			{/* <LogoIntro /> */}

			<NavigationScrollView
				direction='horizontal'
				className='gap-10 w-full z-10'
				customFocusKey='continueWatching'
			>
				{continueWatching && continueWatching.length > 0
					? continueWatching.map((element: ContinueWatchingElement) => (
							<ContentCard
								imgSrc={element.posterImage ?? ''}
								customKey={`continueWatchingCard-${element.id}`}
								height={'35dvh'}
								title={element.title}
								onFocus={() => setSelectedElement(element)}
								action={() => {
									if (element.id === selectedElement?.id) {
										goToContent(
											`/details/${element.episodeId ? 'episode' : 'movie'}/${element.episodeId ? element.episodeId : element.movieId}`
										)
									} else {
										setSelectedElement(element)
									}
								}}
							/>
						))
					: !isLoading
						? skeletons
						: t('noContent')}
			</NavigationScrollView>
		</Page>
	)
}

export default Home
