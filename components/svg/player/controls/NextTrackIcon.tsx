import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { memo } from 'react'
const NextTrackIcon = ({
	color,
	size,
	...props
}: {
	color?: string
	size?: number
}) => (
	<Svg
		fill='currentColor'
		height={size ?? 18}
		viewBox='0 0 48 48'
		width={size ?? 18}
		{...props}
	>
		<Path d='M42 6H45V42H42V6Z' fill='#FFFFFF'></Path>
		<Path
			d='M6.43934 41.5607C6.72064 41.842 7.10218 42 7.5 42C7.764 41.9999 8.02328 41.9299 8.2515 41.7972L36.7515 25.2972C36.9788 25.1653 37.1675 24.9761 37.2986 24.7484C37.4298 24.5207 37.4988 24.2625 37.4988 23.9997C37.4988 23.7369 37.4298 23.4787 37.2986 23.251C37.1675 23.0233 36.9788 22.8341 36.7515 22.7022L8.2515 6.2022C8.02352 6.07022 7.76481 6.00061 7.50139 6.00037C7.23797 6.00012 6.97913 6.06925 6.75091 6.2008C6.52269 6.33235 6.33314 6.52168 6.20132 6.74975C6.0695 6.97782 6.00007 7.23658 6 7.5V40.5C6 40.8978 6.15804 41.2793 6.43934 41.5607Z'
			fill='#FFFFFF'
		></Path>
	</Svg>
)
export default memo(NextTrackIcon)
