import { Outlet } from "react-router";
import BaseLayout from "@/features/top-bar-layout/base-layout";

const TopBarLayout = () => {
	return (
		<BaseLayout>
			<Outlet />
		</BaseLayout>
	);
};

export default TopBarLayout;
