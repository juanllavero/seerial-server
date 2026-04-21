import { Subtitles, Volume2 } from "lucide-react";
import Tertiary from "@/components/text/Tertiary";
import { Card } from "@/components/ui/card";
import FlexBox from "@/components/ui/FlexBox";

interface DetailsTechnicalInfoProps {
	videoInfo?: string;
	audioInfo?: string;
	subtitleInfo?: string;
}

function DetailsTechnicalInfo({
	videoInfo,
	audioInfo,
	subtitleInfo,
}: DetailsTechnicalInfoProps) {
	if (!videoInfo && !audioInfo && !subtitleInfo) {
		return null;
	}

	return (
		<FlexBox direction="row" gap={2}>
			{videoInfo && (
				<Card className="px-3 border-none">
					<Tertiary>{videoInfo}</Tertiary>
				</Card>
			)}
			{audioInfo && (
				<Card className="px-3 border-none flex items-center gap-3">
					<Volume2 />
					<Tertiary>{audioInfo}</Tertiary>
				</Card>
			)}
			{subtitleInfo && (
				<Card className="px-3 border-none flex items-center gap-3">
					<Subtitles />
					<Tertiary>{subtitleInfo}</Tertiary>
				</Card>
			)}
		</FlexBox>
	);
}

export default DetailsTechnicalInfo;
