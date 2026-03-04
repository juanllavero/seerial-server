import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React, { memo } from 'react'
import { ScrollView } from 'react-native'
import useSWR from 'swr'
import CollectionInfo from './CollectionInfo'
import CollectionContent from './CollectionContent'

interface CollectionDetailsProps {
	id: string
	type: string
}

function CollectionDetails({ id, type }: CollectionDetailsProps) {
	const serverUrl = useServerStore((state) => state.serverUrl)

	const { data: collection } = useSWR<Collection>(
		serverUrl
			? `${serverUrl}/details/collection?id=${id}&type=${type}`
			: null,
		fetcher
	)

	if (!collection) {
		return null
	}

	return (
		<ScrollView
			showsHorizontalScrollIndicator={false}
			className='w-full h-full px-10 pt-20 pb-20'
		>
			{/* Collection Info */}
			<CollectionInfo collection={collection} type={type} />

			{/* Collection Content */}
			<CollectionContent collection={collection} type={type} />
		</ScrollView>
	)
}

export default memo(CollectionDetails)
