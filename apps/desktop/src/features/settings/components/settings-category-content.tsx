import { memo } from "react";
import AboutSettings from "./categories/about-settings";
import AudioSettings from "./categories/audio-settings";
import GeneralSettings from "./categories/general-settings";
import VideoSettings from "./categories/video-settings";
import type { SettingsCategory } from "./settings-panel";

interface SettingsCategoryContentProps {
	category: SettingsCategory;
}

function SettingsCategoryContent({ category }: SettingsCategoryContentProps) {
	switch (category) {
		case "general":
			return <GeneralSettings />;
		case "audio":
			return <AudioSettings />;
		case "video":
			return <VideoSettings />;
		case "about":
			return <AboutSettings />;
	}
}

export default memo(SettingsCategoryContent);
