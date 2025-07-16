import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { memo } from 'react'
const EditIcon = ({
	size,
	color,
	...props
}: {
	size?: number
	color?: string
}) => (
	<Svg
		width={size ?? 24}
		height={size ?? 24}
		fill='none'
		viewBox='0 0 48 48'
		stroke='currentColor'
		strokeLinecap='round'
		strokeLinejoin='round'
		strokeWidth={2}
		{...props}
	>
		<Path
			fill={color ?? '#FFFFFF'}
			d='M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4'
		/>
	</Svg>
)
export default memo(EditIcon)
