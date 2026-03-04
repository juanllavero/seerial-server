import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '../ui/sidebar'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { HomeIcon } from '../ui/IconLibrary'
import { useTranslation } from 'react-i18next'

const NavHomeButton = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const location = useLocation()
	const inHome = useMemo(
		() => location.pathname.includes('/home'),
		[location.pathname]
	)

	console.log(`NavHomeButton [${new Date().toISOString()}]: `, {
		pathname: location.pathname,
		inHome,
	})

	const navigateHome = () => {
		navigate(`/home`)
	}

	const home = {
		id: '0',
		name: t('home'),
		logo: HomeIcon,
		action: navigateHome,
	}

	return (
		<SidebarGroup>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<a
							href={''}
							className={`flex items-center gap-2 ${
								inHome ? 'bg-accent' : ''
							}`}
							onClick={(e) => {
								e.preventDefault()
								navigateHome()
							}}
							style={{
								color: inHome ? 'var(--app-color)' : 'white',
							}}
						>
							<home.logo />
							<span
								className='font-semibold'
								style={{
									color: inHome ? 'var(--app-color)' : 'white',
								}}
							>
								{home.name}
							</span>
						</a>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	)
}

export default NavHomeButton
