import { memo } from 'react'
import SmallSpinner from './SideBar/loading/SmallSpinner'
import { useSidebar } from './ui/sidebar'

function LoadingInsideSidebar() {
  const { state: sidebarState } = useSidebar()
  return (
    <div
      className={`flex h-full items-center justify-center pb-32 ${sidebarState === 'expanded' ? `pr-56` : `pr-14`}`}
    >
      <SmallSpinner size={40} />
    </div>
  )
}

export default memo(LoadingInsideSidebar)
