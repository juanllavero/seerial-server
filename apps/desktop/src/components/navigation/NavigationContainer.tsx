import {
	useFocusable,
	FocusContext,
} from '@noriginmedia/norigin-spatial-navigation'

function NavigationContainer({
	children,
	className,
	customFocusKey,
}: {
	children: React.ReactNode
	className?: string
	customFocusKey?: string
}) {
	const { ref, focusKey } = useFocusable({
		trackChildren: true,
		focusKey: customFocusKey,
		saveLastFocusedChild: true,
	})

	return (
		<FocusContext.Provider value={focusKey}>
			<div ref={ref} className={className}>
				{children}
			</div>
		</FocusContext.Provider>
	)
}

export default NavigationContainer
