import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { memo } from 'react'
const StopIcon = ({
	color,
	size,
	...props
}: {
	color?: string
	size?: number
}) => (
	<Svg
		fill={color ?? '#FFFFFF'}
		height={size ?? 18}
		viewBox='0 0 48 48'
		width={size ?? 18}
		{...props}
	>
		<Path
			d='M36 9H12C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12V36C9 36.7956 9.31607 37.5587 9.87868 38.1213C10.4413 38.6839 11.2044 39 12 39H36C36.7956 39 37.5587 38.6839 38.1213 38.1213C38.6839 37.5587 39 36.7956 39 36V12C39 11.2044 38.6839 10.4413 38.1213 9.87868C37.5587 9.31607 36.7956 9 36 9Z'
			fill={color ?? '#FFFFFF'}
		></Path>
	</Svg>
)
export default memo(StopIcon)
