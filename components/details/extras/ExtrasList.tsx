import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { MusicExtra } from '@/data/interfaces/Music'
import HorizontalList from '@/components/lists/HorizontalList'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import AppText from '@/components/text/AppText'
import { Dimensions, TouchableOpacity, View } from 'react-native'
import VideoThumbnail from './VideoThumbnail'
import Tertiary from '@/components/text/Tertiary'
import { useState } from 'react'
import ExtraVideo from './ExtraVideo'

interface ExtrasListProps {
	collection: Collection
}

function ExtrasList({ collection }: ExtrasListProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const [itemFocused, setItemFocused] = useState<MusicExtra | null>(null)
	const { height } = Dimensions.get('window')

	const { data: extras, isLoading } = useSWR<MusicExtra[]>(
		serverUrl !== '' ? `${serverUrl}/musicExtras/${collection.id}` : null,
		fetcher
	)

	if (isLoading) return <AppText>Loading...</AppText>

	if (!extras || extras.length === 0) return null

	return (
		<HorizontalList
			title='Extras'
			items={extras}
			contentContainerStyle={{ padding: 15, gap: 35 }}
			renderItem={({ item }) => (
				<ExtraVideo key={'Extra Video: ' + item.src} item={item} />
			)}
		/>
	)
}

export default ExtrasList
