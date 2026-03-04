import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { memo } from 'react'
const PrevTrackIcon = ({
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
		<Path d='M3 6H6V42H3V6Z' fill='#FFFFFF'></Path>
		<Path
			d='M39.7485 41.7978C39.9768 41.9303 40.236 42.0001 40.5 42C40.8978 42 41.2794 41.842 41.5607 41.5607C41.842 41.2794 42 40.8978 42 40.5V7.50001C41.9998 7.23664 41.9303 6.97795 41.7985 6.74997C41.6666 6.52199 41.477 6.33274 41.2488 6.20126C41.0206 6.06978 40.7618 6.00071 40.4985 6.00098C40.2351 6.00125 39.9764 6.07086 39.7485 6.20281L11.2485 22.7028C11.0212 22.8347 10.8325 23.0239 10.7014 23.2516C10.5702 23.4793 10.5012 23.7375 10.5012 24.0003C10.5012 24.2631 10.5702 24.5213 10.7014 24.749C10.8325 24.9767 11.0212 25.1659 11.2485 25.2978L39.7485 41.7978Z'
			fill='#FFFFFF'
		></Path>
	</Svg>
)
export default memo(PrevTrackIcon)
