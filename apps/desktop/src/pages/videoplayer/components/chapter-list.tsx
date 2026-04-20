import {
	FocusContext,
	setFocus,
	useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import type { Chapter } from "@seerial/domain";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import NavigationScrollView from "@/components/navigation/NavigationScrollView";
import ListTitle from "@/components/text/ListTitle";
import { NavigationFocusKeys } from "@/shared/navigation/constants";
import ChapterCard from "./chapter-card";

interface ChapterListProps {
	chapters: Chapter[];
	position: number;
	isExpanded: boolean;
	onExpand: () => void;
	onCollapse: () => void;
}

function getActiveChapterIndex(chapters: Chapter[], position: number): number {
	let activeIndex = 0;
	for (let i = 0; i < chapters.length; i++) {
		if (chapters[i].time <= position) {
			activeIndex = i;
		}
	}
	return activeIndex;
}

function ChapterList({
	chapters,
	position,
	isExpanded,
	onExpand,
	onCollapse,
}: ChapterListProps) {
	const { t } = useTranslation();
	const activeIndex = getActiveChapterIndex(chapters, position);
	const activeChapterId = `chapter-${activeIndex}`;

	const { ref, focusKey } = useFocusable({
		focusKey: NavigationFocusKeys.player.chapters,
		trackChildren: true,
		saveLastFocusedChild: false,
		onFocus: onExpand,
		onBlur: onCollapse,
		onArrowPress: (direction) => {
			if (direction === "up") {
				onCollapse();
				setFocus(NavigationFocusKeys.player.timeline);
				return false;
			}
			return true;
		},
	});

	useEffect(() => {
		if (isExpanded) {
			setFocus(activeChapterId);
		}
	}, [isExpanded, activeChapterId]);

	const handleChapterEnter = useCallback((chapterTime: number) => {
		invoke("set_position", { position: chapterTime }).catch(console.error);
	}, []);

	if (!chapters.length) return null;

	return (
		<FocusContext.Provider value={focusKey}>
			<div ref={ref} className="w-full flex flex-col gap-2">
				<ListTitle>{t("chapters")}</ListTitle>
				<NavigationScrollView
					customFocusKey={`${NavigationFocusKeys.player.chapters}-scroll`}
					direction="horizontal"
					scrollMode="center"
					focusedElementId={activeChapterId}
					isRestoringFocus={false}
					className="gap-4 pb-2"
				>
					{chapters.map((chapter, i) => (
						<ChapterCard
							key={`chapter-time-${chapter.time}`}
							chapter={chapter}
							isActive={i === activeIndex}
							focusKey={`chapter-${i}`}
							onEnterPress={() => handleChapterEnter(chapter.time)}
							onFocus={() => {}}
						/>
					))}
				</NavigationScrollView>
			</div>
		</FocusContext.Provider>
	);
}

export default ChapterList;
