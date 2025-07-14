import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'

function Libraries() {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const { data: libraries } = useSWR(
		serverUrl ? `${serverUrl}/libraries` : null,
		fetcher
	)

	if (!libraries) {
		return <div>Loading...</div>
	}

	return <div>Libraries</div>
}

export default Libraries
