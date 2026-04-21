import {
	FocusContext,
	setFocus,
	useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { memo, useCallback, useEffect } from "react";
import type { OptionsRequest } from "./settings-options-context";

const SLIDE_TRANSITION = { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

interface OptionItemProps {
	focusKey: string;
	label: string;
	selected: boolean;
	onSelect: () => void;
	onGoBack: () => void;
}

function OptionItem({
	focusKey,
	label,
	selected,
	onSelect,
	onGoBack,
}: OptionItemProps) {
	const { ref, focused } = useFocusable({
		focusKey,
		onEnterPress: onSelect,
		onArrowPress: (direction) => {
			if (direction === "left") {
				onGoBack();
				return false;
			}
			return true;
		},
	});

	return (
		<button
			ref={ref}
			type="button"
			onClick={onSelect}
			className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
				focused ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/5"
			}`}
		>
			<span className="flex-1">{label}</span>
			{selected && <Check size={16} className="shrink-0 text-white" />}
		</button>
	);
}

interface SettingsOptionsPanelProps {
	data: OptionsRequest | null;
	onClose: () => void;
}

function SettingsOptionsPanel({ data, onClose }: SettingsOptionsPanelProps) {
	const { ref, focusKey } = useFocusable({
		focusKey: "settings-options-panel",
		trackChildren: true,
		saveLastFocusedChild: true,
		onArrowPress: (direction) => {
			if (direction === "left") {
				onClose();
				return false;
			}
			return true;
		},
	});

	const firstOptionKey = data ? `settings-option-0` : "";

	useEffect(() => {
		if (data) {
			const frame = window.requestAnimationFrame(() => {
				setFocus(firstOptionKey);
			});
			return () => window.cancelAnimationFrame(frame);
		}
	}, [data, firstOptionKey]);

	const handleSelect = useCallback(
		(value: string) => {
			data?.onChange(value);
			onClose();
		},
		[data, onClose],
	);

	return (
		<AnimatePresence>
			{data && (
				<motion.div
					initial={{ width: 0, opacity: 0 }}
					animate={{ width: 256, opacity: 1 }}
					exit={{ width: 0, opacity: 0 }}
					transition={SLIDE_TRANSITION}
					className="shrink-0 overflow-hidden border-l border-white/10"
				>
					<FocusContext.Provider value={focusKey}>
						<div ref={ref} className="flex h-full w-64 flex-col">
							<div className="px-5 pt-8 pb-4">
								<h2 className="text-sm font-semibold text-white/50">
									{data.label}
								</h2>
							</div>
							<div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
								{data.options.map((option, i) => (
									<OptionItem
										key={option.value}
										focusKey={`settings-option-${i}`}
										label={option.label}
										selected={option.value === data.value}
										onSelect={() => handleSelect(option.value)}
										onGoBack={onClose}
									/>
								))}
							</div>
						</div>
					</FocusContext.Provider>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default memo(SettingsOptionsPanel);
