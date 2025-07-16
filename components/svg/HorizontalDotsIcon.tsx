import * as React from 'react'
import Svg, { Circle } from 'react-native-svg'
import { memo } from 'react'
const HorizontalDotsIcon = (props: any) => (
	<Svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		stroke='currentColor'
		strokeLinecap='round'
		strokeLinejoin='round'
		strokeWidth={2}
		className='lucide lucide-ellipsis-icon lucide-ellipsis'
		{...props}
	>
		<Circle cx={12} cy={12} r={1} />
		<Circle cx={19} cy={12} r={1} />
		<Circle cx={5} cy={12} r={1} />
	</Svg>
)
export default memo(HorizontalDotsIcon)
