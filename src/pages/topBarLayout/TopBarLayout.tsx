import BaseLayout from '@/layouts/BaseLayout'
import { Outlet } from 'react-router'

function TopBarLayout() {
	return (
		<BaseLayout>
			<Outlet />
		</BaseLayout>
	)
}

export default TopBarLayout
