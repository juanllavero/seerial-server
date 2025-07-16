import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { MusicExtra } from '@/data/interfaces/Music'
import HorizontalList from '@/components/lists/HorizontalList'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import AppText from '@/components/text/AppText'
import { Dimensions, FlatList, Pressable, View } from 'react-native'
import VideoThumbnail from './VideoThumbnail'
import Tertiary from '@/components/text/Tertiary'
import Secondary from '@/components/text/Secondary'

interface ExtrasListProps {
	collection: Collection
}

function ExtrasList({ collection }: ExtrasListProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { height } = Dimensions.get('window')

	const { data: extras, isLoading } = useSWR<MusicExtra[]>(
		serverUrl !== '' ? `${serverUrl}/musicExtras/${collection.id}` : null,
		fetcher
	)

	const getExtraTypeTranslation = (type: string) => {
		switch (type) {
			case 'lyrics':
				return 'Lyrics Video'
			case 'video':
				return 'Music Video'
			case 'behindTheScenes':
				return 'Behind the scenes'
			case 'live':
				return 'Live'
			case 'interview':
				return 'Interview'
			case 'concert':
				return 'Concert'
			default:
				return ''
		}
	}

	if (isLoading) return <AppText>Loading...</AppText>

	if (!extras || extras.length === 0) return null

	return (
		<HorizontalList
			title='Extras'
			items={extras}
			renderItem={({ item }) => (
				<Pressable key={'Extra media ' + item.src} className='space-y-2'>
					<VideoThumbnail
						key={item.src}
						height={height * 0.25}
						videoUrl={`${serverUrl}/video-file?path=${item.src}`}
					/>
					<View className='flex flex-col'>
						<Tertiary>{item.title}</Tertiary>
						<Tertiary className='text-xl sm:text-md md:text-lg lg:text-xl'>
							{getExtraTypeTranslation(item.type)}
						</Tertiary>
					</View>
				</Pressable>
			)}
			contentContainerStyle={{ gap: 10 }}
		/>
	)
}

export default ExtrasList
