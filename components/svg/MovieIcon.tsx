import * as React from 'react'
import Svg, { SvgProps, Rect, Path } from 'react-native-svg'
import { memo } from 'react'
const MovieIcon = ({
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
		className='lucide lucide-film-icon lucide-film'
		{...props}
	>
		<Rect color={color} width={18} height={18} x={3} y={3} rx={2} />
		<Path
			color={color}
			d='M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4'
		/>
	</Svg>
)
export default memo(MovieIcon)
