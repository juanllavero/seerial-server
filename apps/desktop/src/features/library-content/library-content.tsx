import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { type LibraryItem, LibraryTypes } from "@seerial/domain";
import { useDataStore, useGradientStore } from "@seerial/stores";
import { memo, useEffect } from "react";
import { useNavigate } from "react-router";
import { shallow } from "zustand/shallow";
import NavigationGridView from "@/components/navigation/NavigationGridView";
import { LibraryContentItemType } from "@/data/enums/enums";
import { useSettingsStore } from "@/features/settings/stores/settings.store";
import type { ScrollMode } from "@/hooks/useAutoScroll";
import Page from "@/shared/components/page";
import ContentCard from "@/shared/ui/card";

const GRID_GAP_REM = 1.25;

interface LibraryContentProps {
	content: LibraryItem[] | undefined;
	libraryType?: string;
	selectedElement: LibraryItem | null;
	setSelectedElement: (item: LibraryItem) => void;
	scrollMode?: ScrollMode;
	isRestoringFocus?: boolean;
}

function LibraryContent({
	content,
	libraryType,
	selectedElement,
	setSelectedElement,
	scrollMode = "start",
	isRestoringFocus = true,
}: LibraryContentProps) {
	const navigate = useNavigate();
	const setGradientImageSrc = useGradientStore(
		(state) => state.setGradientImageSrc,
	);

	useEffect(() => {
		setGradientImageSrc(selectedElement?.coverSrc ?? "");
	}, [selectedElement?.coverSrc, setGradientImageSrc]);
	const itemsPerRow = useSettingsStore((s) => s.settings.cardsPerRow);
	const isMusicLibrary = libraryType === LibraryTypes.MUSIC;
	const finalItemsPerRow = isMusicLibrary ? itemsPerRow - 1 : itemsPerRow; // Music libraries have smaller cards, so we can fit more in the same space.
	const cardWidth = `calc((100% - ${(finalItemsPerRow - 1) * GRID_GAP_REM}rem) / ${finalItemsPerRow})`;

	const { lastFocusedElementId, setLastFocusedElementId } = useDataStore(
		(state) => ({
			lastFocusedElementId: state.lastFocusedElementId,
			setLastFocusedElementId: state.setLastFocusedElementId,
		}),
		shallow,
	);

	useEffect(() => {
		if (
			lastFocusedElementId &&
			content?.find((item) => item.id === lastFocusedElementId)
		) {
			setFocus(lastFocusedElementId);
		} else if (content && content.length > 0) {
			setFocus(content[0].id);
		}
	}, [lastFocusedElementId, content]);

	return (
		<Page padding="0 4dvh">
			<NavigationGridView
				className="z-10 flex-1 gap-5 content-start pt-[2dvh] pb-[4dvh]"
				style={{ gap: `${GRID_GAP_REM}rem` }}
				scrollMode={scrollMode}
				focusedElementId={lastFocusedElementId}
				isRestoringFocus={isRestoringFocus}
			>
				{content?.map((item) => (
					// Music libraries should always render square covers.
					// Fallback to album type check for mixed/legacy payloads.
					<ContentCard
						key={item.id}
						customKey={item.id}
						title={item.title}
						subtitle={item.years}
						width={cardWidth}
						onFocus={() => {
							setSelectedElement(item);
							setLastFocusedElementId(item.id);
						}}
						aspectRatio={
							isMusicLibrary || item.type === LibraryContentItemType.ALBUM
								? "1"
								: "2/3"
						}
						imgSrc={item.coverSrc ?? ""}
						action={() => {
							navigate(
								`/details/${item.type}/${item.id}${item.type === "collection" ? `/${libraryType}` : ""}`,
								{
									state: {
										cachedDetails: item.details,
										libraryType: libraryType,
									},
								},
							);
						}}
					/>
				))}
			</NavigationGridView>
		</Page>
	);
}

export default memo(LibraryContent);
