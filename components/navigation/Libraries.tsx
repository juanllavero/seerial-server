import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import React, { memo, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import { router } from 'expo-router'
import { Library } from '@/data/interfaces/Media'
import Button from '../buttons/NavBarButton'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import useDataStore from '@/context/data.context'
import { shallow } from 'zustand/shallow'
import { scaledPixels } from '@/hooks/useScale'
import { FilmIcon, Music, TvMinimal } from 'lucide-react-native'

interface LibrariesProps {
	onReady?: () => void
}

function Libraries({ onReady }: LibrariesProps) {
	const { sidebarOpen, setSidebarOpen } = useDataStore(
		(state) => ({
			sidebarOpen: state.sidebarOpen,
			setSidebarOpen: state.setSidebarOpen,
		}),
		shallow
	)
	const serverUrl = useServerStore((state) => state.serverUrl)

	const { data: libraries } = useSWR<Library[]>(
		serverUrl ? `${serverUrl}/libraries` : null,
		fetcher
	)

	const handlePress = useCallback(
		(item: Library) => {
			setSidebarOpen(false)
			router.push({
				pathname: '/library/[id]',
				params: {
					id: item.id,
					serverIP: serverUrl,
					type: item.type,
				},
			})
		},
		[serverUrl]
	)

	useEffect(() => {
		if (libraries && onReady) {
			onReady()
		}
	}, [libraries, onReady])

	if (!libraries || libraries.length === 0) {
		return null
	}

	return (
		<>
			{libraries.map((library) => (
				<Button
					text={library.name}
					key={library.id}
					iconSize={scaledPixels(17)}
					onPress={() => handlePress(library)}
					hideText={!sidebarOpen}
					icon={
						library.type === LibraryTypes.SHOWS
							? TvMinimal
							: library.type === LibraryTypes.MUSIC
								? Music
								: FilmIcon
					}
				/>
			))}
		</>
	)
}

export default memo(Libraries)
