type ScrollAxis = 'horizontal' | 'vertical' | 'both';

interface ScrollContainerTowardsPointerParams {
    container: HTMLElement | null | undefined;
    sourceElement?: HTMLElement | null;
    pointer: {
        x: number;
        y: number;
    };
    axis?: ScrollAxis;
    edgeThreshold?: number;
    maxSpeed?: number;
}

function isScrollableElement(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element);
    const overflowY = computedStyle.overflowY;
    const overflowX = computedStyle.overflowX;

    const canScrollVertically = ['auto', 'scroll', 'overlay'].includes(overflowY);
    const canScrollHorizontally = ['auto', 'scroll', 'overlay'].includes(overflowX);

    return (
        (canScrollVertically && element.scrollHeight > element.clientHeight) ||
        (canScrollHorizontally && element.scrollWidth > element.clientWidth)
    );
}

function getScrollableAncestor(element: HTMLElement | null | undefined) {
    let currentElement = element?.parentElement ?? null;

    while (currentElement) {
        if (isScrollableElement(currentElement)) {
            return currentElement;
        }

        currentElement = currentElement.parentElement;
    }

    return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

function getScrollSpeed(distance: number, edgeThreshold: number, maxSpeed: number) {
    const normalizedDistance = Math.min(Math.max(distance, 0), edgeThreshold);
    const speed = Math.round((normalizedDistance / edgeThreshold) * maxSpeed);

    return Math.max(4, speed);
}

export function scrollContainerTowardsPointer({
    container,
    sourceElement,
    pointer,
    axis = 'vertical',
    edgeThreshold = 56,
    maxSpeed = 24,
}: ScrollContainerTowardsPointerParams) {
    const scrollContainer = container ?? getScrollableAncestor(sourceElement);

    if (!scrollContainer) return;

    const { clientHeight, clientWidth, scrollHeight, scrollWidth } = scrollContainer;
    const rect = scrollContainer.getBoundingClientRect();
    let scrollTop = 0;
    let scrollLeft = 0;

    const canScrollVertical = scrollHeight > clientHeight;
    const canScrollHorizontal = scrollWidth > clientWidth;

    if ((axis === 'vertical' || axis === 'both') && canScrollVertical) {
        const topDistance = pointer.y - rect.top;
        const bottomDistance = rect.bottom - pointer.y;

        if (topDistance >= 0 && topDistance < edgeThreshold) {
            scrollTop = -getScrollSpeed(edgeThreshold - topDistance, edgeThreshold, maxSpeed);
        } else if (bottomDistance >= 0 && bottomDistance < edgeThreshold) {
            scrollTop = getScrollSpeed(edgeThreshold - bottomDistance, edgeThreshold, maxSpeed);
        }
    }

    if ((axis === 'horizontal' || axis === 'both') && canScrollHorizontal) {
        const leftDistance = pointer.x - rect.left;
        const rightDistance = rect.right - pointer.x;

        if (leftDistance >= 0 && leftDistance < edgeThreshold) {
            scrollLeft = -getScrollSpeed(edgeThreshold - leftDistance, edgeThreshold, maxSpeed);
        } else if (rightDistance >= 0 && rightDistance < edgeThreshold) {
            scrollLeft = getScrollSpeed(edgeThreshold - rightDistance, edgeThreshold, maxSpeed);
        }
    }

    if (scrollTop === 0 && scrollLeft === 0) return;

    scrollContainer.scrollBy({ top: scrollTop, left: scrollLeft, behavior: 'auto' });
}