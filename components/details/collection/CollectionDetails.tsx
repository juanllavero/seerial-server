import { useServerStore } from '@/context/server.context'
import { Collection, CollectionImages } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React from 'react'
import { ScrollView, View } from 'react-native'
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
		<>
			{/* Collection Info */}
			<CollectionInfo collection={collection} type={type} />

			{/* Collection Content */}
			<CollectionContent collection={collection} type={type} />
		</>
	)
}

export default CollectionDetails
