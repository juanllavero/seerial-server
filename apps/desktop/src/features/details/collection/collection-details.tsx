import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import {
	useGetCollectionContent,
	useGetCollectionMusicExtras,
} from "@seerial/api";
import {
	type Collection,
	type DetailsData,
	type LibraryItem,
	type LibraryType,
	LibraryTypes,
} from "@seerial/domain";
import { useDataStore, useGradientStore } from "@seerial/stores";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { shallow } from "zustand/shallow";
import BackgroundImage from "@/components/backgrounds/BackgroundImage";
import NavigationScrollView from "@/components/navigation/NavigationScrollView";
import ListTitle from "@/components/text/ListTitle";
import Subtitle from "@/components/text/Subtitle";
import Tertiary from "@/components/text/Tertiary";
import FlexBox from "@/components/ui/FlexBox";
import Image from "@/components/ui/Image";
import { useSettingsStore } from "@/features/settings/stores/settings.store";
import Page from "@/shared/components/page";
import { useKeyboardBack } from "@/shared/hooks/use-keyboard-back";
import { NavigationFocusKeys } from "@/shared/navigation/constants";
import ContentCard from "@/shared/ui/card";
import MusicExtraCard from "./music-extra-card";

interface MusicExtra {
	title: string;
	src: string;
	type: string;
}

type CollectionSectionKey = "albums" | "movies" | "shows";

interface CollectionSection {
	key: CollectionSectionKey;
	title: string;
	items: LibraryItem[];
	itemType: "album" | "movie" | "series";
	aspectRatio: string;
}

interface CollectionContentData {
	movies: LibraryItem[];
	series: LibraryItem[];
	albums: LibraryItem[];
}

function getOrderedSectionKeys(
	libraryType: LibraryType | undefined,
): CollectionSectionKey[] {
	switch (libraryType) {
		case "Movies":
			return ["movies"];
		case "Music":
			return ["albums"];
		case "Shows":
			return ["shows"];
		default:
			return ["shows", "movies", "albums"];
	}
}

interface CollectionDetailsProps {
	collectionId: string;
	collection: Collection | undefined;
	isLoading: boolean;
	details: DetailsData | undefined;
	libraryType: LibraryType | undefined;
}

function CollectionDetails({
	collectionId,
	collection,
	isLoading,
	details,
	libraryType,
}: CollectionDetailsProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const setGradientImageSrc = useGradientStore(
		(state) => state.setGradientImageSrc,
	);
	const { lastFocusedElementId, setLastFocusedElementId } = useDataStore(
		(s) => ({
			lastFocusedElementId: s.lastFocusedElementId,
			setLastFocusedElementId: s.setLastFocusedElementId,
		}),
		shallow,
	);
	const { cardRoundness } = useSettingsStore(
		(s) => ({
			cardRoundness: s.settings.cardRoundness,
		}),
		shallow,
	);
	useKeyboardBack();

	const { data: collectionContent } =
		useGetCollectionContent<CollectionContentData>(collectionId, {
			enabled: !!collectionId,
		});

	const { data: musicExtras } = useGetCollectionMusicExtras<MusicExtra[]>(
		collectionId,
		{
			enabled: !!collectionId && libraryType === LibraryTypes.MUSIC,
		},
	);

	// Split albums into singles and normal albums if libraryType is MUSIC
	let singles: LibraryItem[] = [];
	let normalAlbums: LibraryItem[] = [];
	if (libraryType === LibraryTypes.MUSIC && collectionContent?.albums) {
		singles = collectionContent.albums.filter((album) => {
			const title =
				typeof album.title === "string" ? album.title.toLowerCase() : "";
			const isSingleTitle = title.includes("single") || title.includes("sigle");
			const isShort = album.numberOfItems < 4;
			return isSingleTitle || isShort;
		});
		normalAlbums = collectionContent.albums.filter((album) => {
			const title =
				typeof album.title === "string" ? album.title.toLowerCase() : "";
			const isSingleTitle = title.includes("single") || title.includes("sigle");
			const isShort = album.numberOfItems < 4;
			return !(isSingleTitle || isShort);
		});
	}

	const sectionsByKey: Record<CollectionSectionKey, CollectionSection> = {
		shows: {
			key: "shows",
			title: t("shows"),
			items: collectionContent?.series ?? [],
			itemType: "series",
			aspectRatio: "2/3",
		},
		movies: {
			key: "movies",
			title: t("movies"),
			items: collectionContent?.movies ?? [],
			itemType: "movie",
			aspectRatio: "2/3",
		},
		albums: {
			key: "albums",
			title: t("albums"),
			items:
				libraryType === LibraryTypes.MUSIC
					? normalAlbums
					: (collectionContent?.albums ?? []),
			itemType: "album",
			aspectRatio: "1",
		},
	};

	// Add a section for singles if music library
	const orderedSections: CollectionSection[] = (() => {
		if (libraryType === LibraryTypes.MUSIC) {
			// Always show singles first, then albums, then the rest
			const singlesSection: CollectionSection = {
				key: "albums",
				title: t("singles"),
				items: singles,
				itemType: "album",
				aspectRatio: "1",
			};
			// Only include section if there are singles
			return [
				...(singles.length > 0 ? [singlesSection] : []),
				...getOrderedSectionKeys(libraryType)
					.map((key) => sectionsByKey[key])
					.filter((section) => section.items.length > 0),
			];
		} else {
			return getOrderedSectionKeys(libraryType)
				.map((key) => sectionsByKey[key])
				.filter((section) => section.items.length > 0);
		}
	})();

	// (moved above, see new logic for orderedSections)

	const firstFocusedElementId = (() => {
		const firstSection = orderedSections[0];
		const firstItem = firstSection?.items[0];

		if (!firstSection || !firstItem) {
			return undefined;
		}

		return `${firstSection.key}-${firstItem.id}`;
	})();

	const allPageItemIds = useMemo(() => {
		const ids = new Set<string>();
		for (const section of orderedSections) {
			for (const item of section.items) {
				ids.add(`${section.key}-${item.id}`);
			}
		}
		musicExtras?.forEach((_, i) => {
			ids.add(`extra-${i}`);
		});
		return ids;
	}, [orderedSections, musicExtras]);

	const isRestoringFocus =
		!!lastFocusedElementId && allPageItemIds.has(lastFocusedElementId);

	const [isScrollRestoring, setIsScrollRestoring] = useState(
		() => isRestoringFocus,
	);

	const hasFocusedRef = useRef(false);

	useEffect(() => {
		if (!firstFocusedElementId || hasFocusedRef.current) {
			return;
		}

		hasFocusedRef.current = true;

		const idToFocus =
			isRestoringFocus && lastFocusedElementId
				? lastFocusedElementId
				: firstFocusedElementId;

		const focusFrame = window.requestAnimationFrame(() => {
			setLastFocusedElementId(idToFocus);
			setFocus(idToFocus);
			setIsScrollRestoring(false);
		});

		return () => window.cancelAnimationFrame(focusFrame);
	}, [
		firstFocusedElementId,
		isRestoringFocus,
		lastFocusedElementId,
		setLastFocusedElementId,
	]);

	const imageWidth = libraryType === LibraryTypes.MUSIC ? "45vh" : "45vh";
	const imageHeight = libraryType === LibraryTypes.MUSIC ? "45vh" : "68vh";

	useEffect(() => {
		const src =
			details?.coverSrc ??
			collection?.coverSrc ??
			collection?.backgroundSrc ??
			"";
		setGradientImageSrc(src);
		return () => setGradientImageSrc("");
	}, [
		details?.coverSrc,
		collection?.coverSrc,
		collection?.backgroundSrc,
		setGradientImageSrc,
	]);

	if (!isLoading && !collection) return <span>Collection not found</span>;

	return (
		<Page direction="row" align="end" justify="end" padding="0" gap={0}>
			<BackgroundImage
				imageSrc={
					details?.backgroundSrc ??
					collection?.backgroundSrc ??
					collection?.coverSrc
				}
				index={0}
			/>

			<FlexBox
				direction="column"
				align="center"
				justify="center"
				padding="2dvh 0"
				gap={2}
				width={"30dvw"}
				height={"100%"}
				className="z-50"
			>
				<Image
					url={details?.coverSrc ?? collection?.coverSrc ?? ""}
					width={imageWidth}
					height={imageHeight}
					className={cardRoundness}
				/>

				<FlexBox direction="column" align="center">
					<Subtitle className="line-clamp-2 max-h-[8vh] leading-none text-center">
						{details?.title ?? collection?.title ?? ""}
					</Subtitle>
					<Tertiary>{details?.year ?? "N/A"}</Tertiary>
				</FlexBox>
			</FlexBox>

			<NavigationScrollView
				direction="vertical"
				className="w-[70dvw] max-h-[85dvh] gap-6 pb-[5dvh] z-50"
				scrollMode="center"
				focusedElementId={lastFocusedElementId}
				isRestoringFocus={isScrollRestoring}
			>
				{orderedSections.map((section, sectionIndex) => (
					<FlexBox
						key={section.key}
						direction="column"
						gap={1.5}
						width="100%"
						css={{ minWidth: 0 }}
					>
						<ListTitle>{section.title}</ListTitle>

						<NavigationScrollView
							direction="horizontal"
							className="z-10 w-full min-w-0 gap-5"
							scrollMode="center"
							focusedElementId={lastFocusedElementId}
							isRestoringFocus={isScrollRestoring}
						>
							{section.items.map((item) => (
								<ContentCard
									key={item.id}
									customKey={`${section.key}-${item.id}`}
									title={item.title}
									subtitle={item.years}
									imgSrc={item.coverSrc ?? ""}
									width={"25vh"}
									aspectRatio={section.aspectRatio}
									onFocus={() => {
										setLastFocusedElementId(`${section.key}-${item.id}`);
									}}
									onArrowPress={
										sectionIndex === 0
											? (direction) => {
													if (direction === "up") {
														setFocus(NavigationFocusKeys.topBar.container);
														return true;
													}
												}
											: undefined
									}
									action={() => {
										navigate(`/details/${section.itemType}/${item.id}`, {
											state: {
												cachedDetails: item.details,
												collectionId,
												libraryType,
											},
										});
									}}
								/>
							))}
						</NavigationScrollView>
					</FlexBox>
				))}

				{musicExtras && musicExtras.length > 0 && (
					<FlexBox
						direction="column"
						gap={1.5}
						width="100%"
						css={{ minWidth: 0 }}
					>
						<ListTitle>{t("extras")}</ListTitle>

						<NavigationScrollView
							direction="horizontal"
							className="z-10 w-full min-w-0 gap-5"
							scrollMode="center"
							focusedElementId={lastFocusedElementId}
							isRestoringFocus={isScrollRestoring}
						>
							{musicExtras.map((extra, index) => (
								<MusicExtraCard
									key={`extra-${extra.src}`}
									customKey={`extra-${index}`}
									src={extra.src}
									title={extra.title}
									subtitle={extra.type}
									width="30vh"
									onFocus={() => setLastFocusedElementId(`extra-${index}`)}
									action={() =>
										navigate(
											`/video-player/file?path=${encodeURIComponent(extra.src)}&title=${encodeURIComponent(`${collection?.title ? `${collection.title} - ` : ""}${extra.title}`)}`,
										)
									}
								/>
							))}
						</NavigationScrollView>
					</FlexBox>
				)}
			</NavigationScrollView>
		</Page>
	);
}

export default memo(CollectionDetails);
