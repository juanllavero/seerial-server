import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { isAbsolutePath } from '@/utils/utils'
import React from 'react'
import { ImageBackground } from 'react-native'

function Background() {
	const serverUrl = useServerStore((state) => state.serverUrl)
	const currentBackground = useDataStore((state) => state.currentBackground)

	const url = currentBackground
		? currentBackground.startsWith('http')
			? currentBackground
			: currentBackground.startsWith('local')
				? currentBackground.replace('local', '')
				: isAbsolutePath(currentBackground)
					? `${serverUrl}/image?path=${encodeURIComponent(currentBackground)}`
					: `${serverUrl}/${currentBackground.replace('resources/img', 'img')}`
		: ''

	console.log({ url })

	return (
		<ImageBackground
			source={{ uri: url }}
			resizeMode='cover'
			className='flex-1 absolute z-999 w-screen h-screen'
		/>
	)
}

export default Background
