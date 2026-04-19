import TopBar from "./components/top-bar";

const BaseLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div
			className="seerial-app-shell w-full h-full m-0 flex flex-col items-center"
			style={{ backgroundColor: "var(--seerial-app-shell-background, black)" }}
		>
			<TopBar />
			{children}
		</div>
	);
};

export default BaseLayout;
