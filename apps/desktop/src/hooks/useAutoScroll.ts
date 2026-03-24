import { useEffect, useRef } from 'react';

export type ScrollMode = 'top' | 'center';

interface UseAutoScrollProps {
    scrollMode: ScrollMode;
    focusedElementId?: string;
    containerRef: React.RefObject<HTMLDivElement | null>;
    debug?: boolean;
}

function calculateItemsPerRow(
    container: HTMLDivElement,
    firstElement: HTMLElement,
): number {
    const allItems = Array.from(container.querySelectorAll('[data-focus-key]')) as HTMLElement[];

    if (allItems.length <= 1) {
        return 1;
    }

    const elementHeight = firstElement.offsetHeight;
    const firstItemTop = allItems[0].offsetTop;

    for (let i = 1; i < allItems.length; i++) {
        if (Math.abs(allItems[i].offsetTop - firstItemTop) > elementHeight * 0.5) {
            return i;
        }
    }

    return allItems.length;
}

function calculateTopModeScroll(
    focusedElement: HTMLElement,
    container: HTMLDivElement,
): number {
    const allItems = Array.from(container.querySelectorAll('[data-focus-key]')) as HTMLElement[];
    const focusedIndex = allItems.indexOf(focusedElement);

    if (focusedIndex < 0) {
        return container.scrollTop;
    }

    const itemsPerRow = calculateItemsPerRow(container, focusedElement);
    const focusedRowIndex = Math.floor(focusedIndex / itemsPerRow);
    const rowHeight = focusedElement.offsetHeight;
    const targetScrollTop = focusedRowIndex * rowHeight;

    const containerHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // Don't scroll if all content fits
    if (scrollHeight <= containerHeight) {
        return 0;
    }

    // Ensure we don't scroll past the end
    const maxScroll = scrollHeight - containerHeight;
    return Math.min(targetScrollTop, maxScroll);
}

function calculateCenterModeScroll(
    focusedElement: HTMLElement,
    container: HTMLDivElement,
): number {
    const elementOffsetTop = focusedElement.offsetTop;
    const elementHeight = focusedElement.offsetHeight;
    const containerHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;

    const centerPosition = containerHeight / 2 - elementHeight / 2;
    let targetScrollTop = elementOffsetTop - centerPosition;

    // Clamp to valid range
    targetScrollTop = Math.max(0, targetScrollTop);
    const maxScroll = scrollHeight - containerHeight;
    return Math.min(targetScrollTop, maxScroll);
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
            if (debug) console.log(`[useAutoScroll] Found element with selector: ${selector}`);
            return element;
        }
    }

    if (debug) {
        console.log(`[useAutoScroll] Element not found with focusedElementId: ${focusedElementId}`);
        console.log('[useAutoScroll] Available elements:', Array.from(container.querySelectorAll('[data-focus-key]')).map((el) => (el as HTMLElement).getAttribute('data-focus-key')));
    }

    return null;
}

function calculateScrollTopMode(
    focusedElement: HTMLElement,
    container: HTMLDivElement,
    scrollMode: ScrollMode,
): number {
    if (scrollMode === 'top') {
        return calculateTopModeScroll(focusedElement, container);
    }
    return calculateCenterModeScroll(focusedElement, container);
}

/**
 * Hook that automatically scrolls a container to keep the focused element visible.
 * Supports two modes:
 * - 'top': Focused row always at the top of the container (when possible)
 * - 'center': Focused row always at the center of the container (when possible)
 */
export function useAutoScroll({
    scrollMode,
    focusedElementId,
    containerRef,
    debug = false,
}: UseAutoScrollProps) {
    const lastFocusedIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const shouldReturn = !focusedElementId || !containerRef.current || lastFocusedIdRef.current === focusedElementId;

        if (!focusedElementId && debug) {
            console.log('[useAutoScroll] Early return: focusedElementId is empty');
        }
        if (!containerRef.current && debug) {
            console.log('[useAutoScroll] Early return: containerRef.current is null');
        }
        if (lastFocusedIdRef.current === focusedElementId && debug) {
            console.log('[useAutoScroll] Early return: same focusedElementId as before');
        }

        if (shouldReturn) {
            return;
        }

        if (debug) console.log(`[useAutoScroll] Focus changed: ${lastFocusedIdRef.current} -> ${focusedElementId}`);

        lastFocusedIdRef.current = focusedElementId;

        const timeoutId = setTimeout(() => {
            const container = containerRef.current;
            if (!container) {
                if (debug) console.log('[useAutoScroll] Timeout: containerRef.current is null');
                return;
            }

            const focusedElement = findFocusedElement(container, focusedElementId, debug);
            if (!focusedElement) {
                return;
            }

            const targetScrollTop = calculateScrollTopMode(focusedElement, container, scrollMode);

            if (debug) console.log(`[useAutoScroll] Scrolling to ${targetScrollTop} (mode: ${scrollMode})`);

            container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth',
            });
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [focusedElementId, scrollMode, containerRef, debug]);
}
