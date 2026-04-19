import { useGradientStore } from "@seerial/stores";
import { useMatch } from "react-router-dom";
import GradientBackground from "@/components/backgrounds/GradientBackground";
import TopBar from "./components/top-bar";

const BaseLayout = ({ children }: { children: React.ReactNode }) => {
	const gradientImageSrc = useGradientStore((state) => state.gradientImageSrc);

	const isMovieDetails = useMatch("details/movie/:movieId");
	const isSeriesDetails = useMatch("details/series/:seriesId");
	const isAlbumDetails = useMatch("details/album/:albumId");
	const hideTopBar = !!(isMovieDetails || isSeriesDetails || isAlbumDetails);

	return (
		<div
			className="seerial-app-shell w-full h-full m-0 flex flex-col items-center justify-end"
			style={{ backgroundColor: "var(--seerial-app-shell-background, black)" }}
		>
			<GradientBackground imageSrc={gradientImageSrc} index={0} />
			{!hideTopBar && <TopBar />}
			{children}
		</div>
	);
};

export default BaseLayout;
