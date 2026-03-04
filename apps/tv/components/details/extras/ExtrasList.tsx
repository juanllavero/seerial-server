import AppText from '@/components/text/AppText'
import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { MusicExtra } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import React, { memo, useCallback } from 'react'
import useSWR from 'swr'
import ExtraVideo from './ExtraVideo'
import HorizontalList from '@/components/lists/HorizontalList'

interface ExtrasListProps {
	collection: Collection
}

const ExtrasList = memo(function ExtrasList({ collection }: ExtrasListProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { data: extras, isLoading } = useSWR<MusicExtra[]>(
		serverUrl ? `${serverUrl}/musicExtras/${collection.id}` : null,
		fetcher
	)

	const renderExtraItem = useCallback(({ item }: { item: MusicExtra }) => {
		return <ExtraVideo key={'Extra Video: ' + item.src} item={item} />
	}, [])

	if (isLoading) return <AppText>Loading...</AppText>

	if (!extras || extras.length === 0) return null

	return (
		<HorizontalList<MusicExtra>
			title='Extras'
			items={extras}
			contentContainerStyle={{ padding: 15, gap: 35 }}
			renderItem={renderExtraItem}
		/>
	)
})

export default memo(ExtrasList)
