import type { Library } from "@seerial/domain";
import { useDataStore, useGradientStore } from "@seerial/stores";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import NavigationScrollView from "@/components/navigation/NavigationScrollView";
import Page from "@/shared/components/page";
import LibraryContentList from "./components/library-content-list";

interface ToSeeProps {
	moviesLibraries: Library[];
	seriesLibraries: Library[];
}

function ToSee({ moviesLibraries, seriesLibraries }: ToSeeProps) {
	const location = useLocation();
	const lastFocusedElementId = useDataStore(
		(state) => state.lastFocusedElementId,
	);
	const prevLocationRef = useRef<string>("");
	const lastFocusIdRef = useRef<string | undefined>(undefined);
	const isFirstLoadRef = useRef(true);
	const [isRestoringFocus, setIsRestoringFocus] = useState(true);
	const setGradientImageSrc = useGradientStore(
		(state) => state.setGradientImageSrc,
	);
	const handleSelectBackground = (src: string | undefined) =>
		setGradientImageSrc(src ?? "");

	useEffect(() => {
		if (
			lastFocusedElementId &&
			lastFocusIdRef.current !== undefined &&
			lastFocusIdRef.current !== lastFocusedElementId
		) {
			setIsRestoringFocus(false);
		}

		lastFocusIdRef.current = lastFocusedElementId;
	}, [lastFocusedElementId]);

	useEffect(() => {
		if (isFirstLoadRef.current) {
			setIsRestoringFocus(true);
			isFirstLoadRef.current = false;
		} else {
			setIsRestoringFocus(prevLocationRef.current.includes("/details"));
		}

		prevLocationRef.current = location.pathname;
	}, [location.pathname]);

	return (
		<Page padding="0">
			{moviesLibraries.length === 0 && seriesLibraries.length === 0 ? (
				"Congratulations! You have nothing left to watch."
			) : (
				<NavigationScrollView
					direction="vertical"
					className="z-10 min-h-0 w-full flex-1 gap-6 pb-20 pr-2"
					scrollMode="center"
					focusedElementId={lastFocusedElementId}
					isRestoringFocus={isRestoringFocus}
				>
					{moviesLibraries.length > 0 &&
						moviesLibraries.map((library) => (
							<LibraryContentList
								key={library.id}
								libraryName={library.name}
								libraryId={library.id}
								watched={false}
								focusedElementId={lastFocusedElementId}
								isRestoringFocus={isRestoringFocus}
								selectBackground={handleSelectBackground}
							/>
						))}
					{seriesLibraries.length > 0 &&
						seriesLibraries.map((library) => (
							<LibraryContentList
								key={library.id}
								libraryName={library.name}
								libraryId={library.id}
								watched={false}
								focusedElementId={lastFocusedElementId}
								isRestoringFocus={isRestoringFocus}
								selectBackground={handleSelectBackground}
							/>
						))}
				</NavigationScrollView>
			)}
		</Page>
	);
}

export default ToSee;
