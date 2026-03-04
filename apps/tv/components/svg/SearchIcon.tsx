import * as React from 'react'
import Svg, { Path, Circle } from 'react-native-svg'
import { memo } from 'react'
const SearchIcon = (props: any) => (
	<Svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		stroke='currentColor'
		strokeLinecap='round'
		strokeLinejoin='round'
		strokeWidth={2}
		className='lucide lucide-search-icon lucide-search'
		{...props}
	>
		<Path d='m21 21-4.34-4.34' />
		<Circle cx={11} cy={11} r={8} />
	</Svg>
)
export default memo(SearchIcon)
