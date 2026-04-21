import { Info, Monitor, Music, Settings } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import NavigationButton from "@/components/navigation/NavigationButton";
import type { SettingsCategory } from "./settings-panel";

const CATEGORY_ICONS: Record<SettingsCategory, React.ReactNode> = {
	general: <Settings size="2dvh" />,
	audio: <Music size="2dvh" />,
	video: <Monitor size="2dvh" />,
	about: <Info size="2dvh" />,
};

const CATEGORY_LABEL_KEYS: Record<SettingsCategory, string> = {
	general: "general",
	audio: "audio",
	video: "video",
	about: "about",
};

interface SettingsCategoryListProps {
	categories: SettingsCategory[];
	activeCategory: SettingsCategory;
	onCategorySelect: (category: SettingsCategory) => void;
}

function SettingsCategoryList({
	categories,
	activeCategory,
	onCategorySelect,
}: SettingsCategoryListProps) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-1 flex-col gap-1 px-3">
			{categories.map((category) => (
				<NavigationButton
					key={category}
					customKey={`settings-category-${category}`}
					icon={CATEGORY_ICONS[category]}
					text={t(CATEGORY_LABEL_KEYS[category])}
					selected={activeCategory === category}
					onFocus={() => onCategorySelect(category)}
					onClick={() => onCategorySelect(category)}
					className="w-full justify-start"
					variant="ghost"
				/>
			))}
		</div>
	);
}

export default memo(SettingsCategoryList);
