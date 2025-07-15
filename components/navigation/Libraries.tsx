import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import React from 'react'
import { FlatList, Pressable } from 'react-native'
import useSWR from 'swr'
import Tertiary from '../text/Tertiary'
import { Link } from 'expo-router'
import { Library } from '@/data/interfaces/Media'

function Libraries() {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { data: libraries } = useSWR<Library[]>(
		serverUrl ? `${serverUrl}/libraries` : null,
		fetcher
	)

	if (!libraries) {
		return <div>Loading...</div>
	}

	return (
		<FlatList
			data={libraries}
			style={{ padding: 10 }}
			renderItem={({ item }) => (
				<Link
					asChild
					href={{
						pathname: '/library/[id]',
						params: {
							id: item.id,
							serverIP: serverUrl,
							type: item.type,
						},
					}}
				>
					<Pressable>
						<Tertiary style={{ color: 'white', padding: 10 }}>
							{item.name}
						</Tertiary>
					</Pressable>
				</Link>
			)}
		/>
	)
}

export default Libraries
