import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { memo } from 'react'
const PauseIcon = ({
	color,
	size,
	...props
}: {
	color?: string
	size?: number
}) => (
	<Svg
		fill={color ?? '#FFFFFF'}
		height={size ?? 22}
		viewBox='0 0 48 48'
		width={size ?? 22}
		{...props}
	>
		<Path
			d='M13 8C13 6.89543 13.8954 6 15 6H17C18.1046 6 19 6.89543 19 8V40C19 41.1046 18.1046 42 17 42H15C13.8954 42 13 41.1046 13 40V8Z'
			fill={color ?? '#FFFFFF'}
		></Path>
		<Path
			d='M29 8C29 6.89543 29.8954 6 31 6H33C34.1046 6 35 6.89543 35 8V40C35 41.1046 34.1046 42 33 42H31C29.8954 42 29 41.1046 29 40V8Z'
			fill={color ?? '#FFFFFF'}
		></Path>
	</Svg>
)
export default memo(PauseIcon)
