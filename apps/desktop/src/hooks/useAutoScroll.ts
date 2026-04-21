import { useEffect, useRef } from "react";

export type ScrollMode = "start" | "center";
export type ScrollAxis = "vertical" | "horizontal";

interface UseAutoScrollProps {
	scrollMode: ScrollMode;
	scrollAxis?: ScrollAxis;
	focusedElementId?: string;
	containerRef: React.RefObject<HTMLDivElement | null>;
	isRestoringFocus?: boolean;
	debug?: boolean;
}

function calculateTopModeScroll(
	focusedElement: HTMLElement,
	container: HTMLDivElement,
): number {
	const containerRect = container.getBoundingClientRect();
	const elementRect = focusedElement.getBoundingClientRect();
	const elementOffsetTop =
		elementRect.top - containerRect.top + container.scrollTop;

	const containerHeight = container.clientHeight;
	const scrollHeight = container.scrollHeight;

	// Don't scroll if all content fits
	if (scrollHeight <= containerHeight) {
		return 0;
	}

	// Ensure we don't scroll past the end
	const maxScroll = scrollHeight - containerHeight;
	return Math.min(elementOffsetTop, maxScroll);
}

const CENTER_SCROLL_TOLERANCE = 80;

function calculateCenterModeScroll(
	focusedElement: HTMLElement,
	container: HTMLDivElement,
): number {
	const containerRect = container.getBoundingClientRect();
	const elementRect = focusedElement.getBoundingClientRect();
	const elementOffsetTop =
		elementRect.top - containerRect.top + container.scrollTop;
	const elementHeight = focusedElement.offsetHeight;
	const containerHeight = container.clientHeight;
	const scrollHeight = container.scrollHeight;

	const centerPosition = containerHeight / 2 - elementHeight / 2;
	let targetScrollTop = elementOffsetTop - centerPosition;

	// Clamp to valid range
	targetScrollTop = Math.max(0, targetScrollTop);
	const maxScroll = scrollHeight - containerHeight;
	targetScrollTop = Math.min(targetScrollTop, maxScroll);

	// Skip scroll if already within tolerance, but not when at a boundary (first/last item)
	const isAtBoundary = targetScrollTop === 0 || targetScrollTop === maxScroll;
	if (
		!isAtBoundary &&
		Math.abs(container.scrollTop - targetScrollTop) <= CENTER_SCROLL_TOLERANCE
	) {
		return container.scrollTop;
	}

	return targetScrollTop;
}

function calculateHorizontalStartModeScroll(
	focusedElement: HTMLElement,
	container: HTMLDivElement,
): number {
	const containerRect = container.getBoundingClientRect();
	const elementRect = focusedElement.getBoundingClientRect();
	const elementScrollLeft =
		elementRect.left - containerRect.left + container.scrollLeft;

	const containerWidth = container.clientWidth;
	const scrollWidth = container.scrollWidth;

	if (scrollWidth <= containerWidth) {
		return 0;
	}

	const maxScroll = scrollWidth - containerWidth;
	return Math.min(elementScrollLeft, maxScroll);
}

function calculateHorizontalCenterModeScroll(
	focusedElement: HTMLElement,
	container: HTMLDivElement,
): number {
	const containerRect = container.getBoundingClientRect();
	const elementRect = focusedElement.getBoundingClientRect();
	const elementScrollLeft =
		elementRect.left - containerRect.left + container.scrollLeft;

	const elementWidth = focusedElement.offsetWidth;
	const containerWidth = container.clientWidth;
	const scrollWidth = container.scrollWidth;

	const centerPosition = containerWidth / 2 - elementWidth / 2;
	let targetScrollLeft = elementScrollLeft - centerPosition;

	targetScrollLeft = Math.max(0, targetScrollLeft);
	const maxScroll = scrollWidth - containerWidth;
	targetScrollLeft = Math.min(targetScrollLeft, maxScroll);

	// Skip scroll if already within tolerance, but not when at a boundary (first/last item)
	const isAtBoundary = targetScrollLeft === 0 || targetScrollLeft === maxScroll;
	if (
		!isAtBoundary &&
		Math.abs(container.scrollLeft - targetScrollLeft) <= CENTER_SCROLL_TOLERANCE
	) {
		return container.scrollLeft;
	}

	return targetScrollLeft;
}

function findFocusedElement(
	container: HTMLDivElement,
	focusedElementId: string,
	debug?: boolean,
): HTMLElement | null {
	const selectors = [
		`[data-focus-key="${focusedElementId}"]`,
		`[data-focus-key='${focusedElementId}']`,
	];

	for (const selector of selectors) {
		const element = container.querySelector(selector) as HTMLElement | null;
		if (element) {
			if (debug)
				console.log(`[useAutoScroll] Found element with selector: ${selector}`);
			return element;
		}
	}

	if (debug) {
		console.log(
			`[useAutoScroll] Element not found with focusedElementId: ${focusedElementId}`,
		);
		console.log(
			"[useAutoScroll] Available elements:",
			Array.from(container.querySelectorAll("[data-focus-key]")).map((el) =>
				(el as HTMLElement).getAttribute("data-focus-key"),
			),
		);
	}

	return null;
}

function calculateScrollStartMode(
	focusedElement: HTMLElement,
	container: HTMLDivElement,
	scrollMode: ScrollMode,
): number {
	if (scrollMode === "start") {
		return calculateTopModeScroll(focusedElement, container);
	}
	return calculateCenterModeScroll(focusedElement, container);
}

function calculateScrollLeftMode(
	focusedElement: HTMLElement,
	container: HTMLDivElement,
	scrollMode: ScrollMode,
): number {
	if (scrollMode === "start") {
		return calculateHorizontalStartModeScroll(focusedElement, container);
	}
	return calculateHorizontalCenterModeScroll(focusedElement, container);
}

function shouldSkipAutoScroll(
	focusedElementId: string | undefined,
	container: HTMLDivElement | null,
	lastFocusedId: string | undefined,
	debug: boolean,
): boolean {
	if (!focusedElementId) {
		if (debug)
			console.log("[useAutoScroll] Early return: focusedElementId is empty");
		return true;
	}

	if (!container) {
		if (debug)
			console.log("[useAutoScroll] Early return: containerRef.current is null");
		return true;
	}

	if (lastFocusedId === focusedElementId) {
		if (debug)
			console.log(
				"[useAutoScroll] Early return: same focusedElementId as before",
			);
		return true;
	}

	return false;
}

function logScrollTarget(
	scrollAxis: ScrollAxis,
	targetScrollTop: number,
	targetScrollLeft: number,
	scrollMode: ScrollMode,
	isRestoringFocus: boolean,
	debug: boolean,
): void {
	if (!debug) {
		return;
	}

	const targetPosition =
		scrollAxis === "horizontal" ? targetScrollLeft : targetScrollTop;
	console.log(
		`[useAutoScroll] Scrolling to ${targetPosition} (axis: ${scrollAxis}, mode: ${scrollMode}, animate: ${!isRestoringFocus}, isRestoringFocus: ${isRestoringFocus})`,
	);
}

function applyContainerScroll(
	container: HTMLDivElement,
	scrollAxis: ScrollAxis,
	targetScrollTop: number,
	targetScrollLeft: number,
	isRestoringFocus: boolean,
): void {
	if (isRestoringFocus) {
		if (scrollAxis === "horizontal") {
			container.scrollLeft = targetScrollLeft;
			return;
		}

		container.scrollTop = targetScrollTop;
		return;
	}

	container.scrollTo({
		top: scrollAxis === "horizontal" ? container.scrollTop : targetScrollTop,
		left: scrollAxis === "horizontal" ? targetScrollLeft : container.scrollLeft,
		behavior: "smooth",
	});
}

/**
 * Hook that automatically scrolls a container to keep the focused element visible.
 * Supports two modes:
 * - 'top': Focused row always at the top of the container (when possible)
 * - 'center': Focused row always at the center of the container (when possible)
 *
 * Behavior:
 * - When isRestoringFocus is true (coming from another screen): direct scroll, no animation
 * - When isRestoringFocus is false (user navigation): smooth animated scroll
 */
export function useAutoScroll({
	scrollMode,
	scrollAxis = "vertical",
	focusedElementId,
	containerRef,
	isRestoringFocus = true,
	debug = false,
}: UseAutoScrollProps) {
	const lastFocusedIdRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (
			shouldSkipAutoScroll(
				focusedElementId,
				containerRef.current,
				lastFocusedIdRef.current,
				debug,
			)
		) {
			return;
		}

		const currentFocusedElementId = focusedElementId;
		if (!currentFocusedElementId) {
			return;
		}

		if (debug)
			console.log(
				`[useAutoScroll] Focus changed: ${lastFocusedIdRef.current} -> ${currentFocusedElementId}`,
			);

		lastFocusedIdRef.current = currentFocusedElementId;

		const timeoutId = setTimeout(() => {
			const container = containerRef.current;
			if (!container) {
				if (debug)
					console.log("[useAutoScroll] Timeout: containerRef.current is null");
				return;
			}

			const focusedElement = findFocusedElement(
				container,
				currentFocusedElementId,
				debug,
			);
			if (!focusedElement) {
				return;
			}

			const targetScrollTop = calculateScrollStartMode(
				focusedElement,
				container,
				scrollMode,
			);
			const targetScrollLeft = calculateScrollLeftMode(
				focusedElement,
				container,
				scrollMode,
			);

			logScrollTarget(
				scrollAxis,
				targetScrollTop,
				targetScrollLeft,
				scrollMode,
				isRestoringFocus,
				debug,
			);

			applyContainerScroll(
				container,
				scrollAxis,
				targetScrollTop,
				targetScrollLeft,
				isRestoringFocus,
			);
		}, 0);

		return () => clearTimeout(timeoutId);
	}, [
		focusedElementId,
		scrollMode,
		scrollAxis,
		containerRef,
		isRestoringFocus,
		debug,
	]);
}
