import {
	FocusContext,
	useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";

function NavigationContainer({
	children,
	className,
	customFocusKey,
	isFocusBoundary = false,
	focusBoundaryDirections,
}: {
	children: React.ReactNode;
	className?: string;
	customFocusKey?: string;
	isFocusBoundary?: boolean;
	focusBoundaryDirections?: ("left" | "right" | "up" | "down")[];
}) {
	const { ref, focusKey } = useFocusable({
		trackChildren: true,
		focusKey: customFocusKey,
		saveLastFocusedChild: true,
		isFocusBoundary,
		focusBoundaryDirections,
	});

	return (
		<FocusContext.Provider value={focusKey}>
			<div ref={ref} className={className}>
				{children}
			</div>
		</FocusContext.Provider>
	);
}

export default NavigationContainer;
