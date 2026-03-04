import {
	useFocusable,
	FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'
import { memo } from 'react'

interface NavigationScrollViewProps {
	children: React.ReactNode
	className?: string
	customFocusKey?: string
	direction?: 'horizontal' | 'vertical'
}

const NavigationScrollView = ({
	children,
	className,
	customFocusKey,
	direction = 'horizontal',
}: NavigationScrollViewProps) => {
	const { ref, focusKey } = useFocusable({
		trackChildren: true,
		focusKey: customFocusKey,
		saveLastFocusedChild: true,
	})

	return (
		<FocusContext.Provider value={focusKey}>
			<div
				ref={ref}
				className={`
          flex h-fit ${direction === 'horizontal' ? 'flex-row overflow-x-auto' : 'flex-col overflow-y-auto'}
          ${className || ''}
        `}
			>
				{children}
			</div>
		</FocusContext.Provider>
	)
}

export default memo(NavigationScrollView)
