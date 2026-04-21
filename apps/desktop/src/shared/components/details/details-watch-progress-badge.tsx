import FlexBox from "@/components/ui/FlexBox";

interface DetailsWatchProgressBadgeProps {
	durationInfo: number;
	timeWatchedInfo: number;
}

function DetailsWatchProgressBadge({
	durationInfo,
	timeWatchedInfo,
}: DetailsWatchProgressBadgeProps) {
	const watchedMinutes = timeWatchedInfo / 60;
	const remainingMinutes = Math.max(durationInfo - watchedMinutes, 0);
	const watchProgress = Math.min((watchedMinutes / durationInfo) * 100, 100);
	const progressRadius = 10;
	const progressCircumference = 2 * Math.PI * progressRadius;
	const progressOffset =
		progressCircumference - (watchProgress / 100) * progressCircumference;

	return (
		<FlexBox
			justify="center"
			align="center"
			className="flex-row bg-black/30 rounded-2xl"
			padding="0.3rem 0.8rem"
			gap={0.8}
		>
			<svg
				aria-hidden="true"
				className="shrink-0"
				height="24"
				viewBox="0 0 24 24"
				width="24"
			>
				<circle
					cx="12"
					cy="12"
					r={progressRadius}
					stroke="rgba(255, 255, 255, 0.2)"
					strokeWidth="4"
					fill="none"
				/>
				<circle
					cx="12"
					cy="12"
					r={progressRadius}
					stroke="var(--app-color)"
					strokeDasharray={progressCircumference}
					strokeDashoffset={progressOffset}
					strokeLinecap="round"
					strokeWidth="4"
					fill="none"
					transform="rotate(-90 12 12)"
				/>
			</svg>
			<span className="text-[1.4vh] font-semibold opacity-90">{`${remainingMinutes.toFixed(0)} minutes remaining`}</span>
		</FlexBox>
	);
}

export default DetailsWatchProgressBadge;
