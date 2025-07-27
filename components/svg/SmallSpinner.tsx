import { memo } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

function SmallSpinner({ size }: { size?: number }) {
	return (
		<View
			className='flex items-center justify-center overflow-hidden rounded-lg'
			style={{ width: size, height: size }}
		>
			<Svg
				className='animate-spin text-gray-300'
				width={size}
				height={size}
				fill='none'
				viewBox='0 0 64 64'
			>
				<Path
					stroke='currentColor'
					d='M32 3a29 29 0 1 1 0 58 29 29 0 0 1 0-58Z'
				/>
				<Path stroke='currentColor' d='M32 3a29 29 0 0 1 27.576 37.976' />
			</Svg>
		</View>
	)
}

export default memo(SmallSpinner)
