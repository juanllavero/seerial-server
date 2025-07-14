import * as React from 'react'
import Svg, { SvgProps, Path, Circle } from 'react-native-svg'
import { memo } from 'react'
const MusicIcon = (props: SvgProps) => (
	<Svg
		width={24}
		height={24}
		fill='none'
		stroke='currentColor'
		strokeLinecap='round'
		strokeLinejoin='round'
		strokeWidth={2}
		className='lucide lucide-music-icon lucide-music'
		{...props}
	>
		<Path d='M9 18V5l12-2v13' />
		<Circle cx={6} cy={18} r={3} />
		<Circle cx={18} cy={16} r={3} />
	</Svg>
)
export default memo(MusicIcon)
