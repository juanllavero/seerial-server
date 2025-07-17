import * as React from 'react'
import Svg, { SvgProps, Path, Rect } from 'react-native-svg'
import { memo } from 'react'
const SeriesIcon = ({
	color,
	size,
	...props
}: SvgProps & { color?: string; size?: number }) => (
	<Svg
		width={size ?? 24}
		height={size ?? 24}
		fill='none'
		stroke='currentColor'
		strokeLinecap='round'
		strokeLinejoin='round'
		strokeWidth={2}
		className='lucide lucide-tv-minimal-icon lucide-tv-minimal'
		{...props}
	>
		<Path color={color} d='M7 21h10' />
		<Rect color={color} width={20} height={14} x={2} y={3} rx={2} />
	</Svg>
)
export default memo(SeriesIcon)
