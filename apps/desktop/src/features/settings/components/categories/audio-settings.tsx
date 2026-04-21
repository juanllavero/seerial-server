import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settings.store";
import SettingCheckbox from "../controls/setting-checkbox";

function AudioSettings() {
	const { t } = useTranslation();
	const settings = useSettingsStore((s) => s.settings);
	const updateSetting = useSettingsStore((s) => s.updateSetting);

	return (
		<div className="flex flex-col gap-1">
			<SettingCheckbox
				focusKey="settings-audio-normalizeMultichannel"
				label={t("normalizeMultichannel")}
				description={t("normalizeMultichannelDesc")}
				checked={settings.normalizeMultichannel}
				onChange={(v) => updateSetting("normalizeMultichannel", v)}
			/>
			<SettingCheckbox
				focusKey="settings-audio-exclusiveAudio"
				label={t("exclusiveAudio")}
				description={t("exclusiveAudioDesc")}
				checked={settings.exclusiveAudio}
				onChange={(v) => updateSetting("exclusiveAudio", v)}
			/>
		</div>
	);
}

export default memo(AudioSettings);
