import { createContext, useContext } from "react";

export interface SelectOption {
	label: string;
	value: string;
}

export interface OptionsRequest {
	options: SelectOption[];
	value: string;
	label: string;
	onChange: (value: string) => void;
	returnFocusKey: string;
}

interface SettingsOptionsContextValue {
	openOptions: (request: OptionsRequest) => void;
}

export const SettingsOptionsContext =
	createContext<SettingsOptionsContextValue | null>(null);

export function useSettingsOptions() {
	const ctx = useContext(SettingsOptionsContext);
	if (!ctx)
		throw new Error(
			"useSettingsOptions must be used inside SettingsOptionsContext",
		);
	return ctx;
}
