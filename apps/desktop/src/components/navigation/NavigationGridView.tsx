import {
	FocusContext,
	useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import { type ScrollMode, useAutoScroll } from "@/hooks/useAutoScroll";
import "@/styles/utils.css";
import { memo, useRef } from "react";

interface NavigationScrollViewProps {
	children: React.ReactNode;
	className?: string;
	customFocusKey?: string;
	style?: React.CSSProperties;
	scrollMode?: ScrollMode;
	focusedElementId?: string;
	isRestoringFocus?: boolean;
}

const NavigationGridView = ({
	children,
	className,
	customFocusKey,
	style,
	scrollMode = "start",
	focusedElementId,
	isRestoringFocus = true,
}: NavigationScrollViewProps) => {
	const { ref, focusKey } = useFocusable({
		trackChildren: true,
		focusKey: customFocusKey,
		saveLastFocusedChild: true,
	});

	const containerRef = useRef<HTMLDivElement | null>(null);

	// Use auto scroll hook
	useAutoScroll({
		scrollMode,
		focusedElementId,
		containerRef,
		isRestoringFocus,
	});

	return (
		<FocusContext.Provider value={focusKey}>
			<div
				ref={(node) => {
					// Assign to containerRef
					containerRef.current = node;
					// Assign to the norigin ref if it's an object type
					if (ref && node && typeof ref !== "function") {
						const refObject = ref as React.RefObject<HTMLDivElement | null>;
						refObject.current = node;
					}
				}}
				className={`
          flex flex-row flex-wrap overflow-y-auto hide-scrollbar
          ${isRestoringFocus ? "scroll-auto" : "scroll-smooth"}
          ${className || ""}
        `}
				style={style}
			>
				{children}
			</div>
		</FocusContext.Provider>
	);
};

export default memo(NavigationGridView);
