import { shallow } from 'zustand/shallow'
import { useServerStore } from '@/context/auth.store'
import { UserType } from '@/utils/constants'

export const useIsAdmin = () => {
  const user = useServerStore((state) => state.currentUser, shallow)
  const isAdmin = user?.type === UserType.ADMIN

  return isAdmin
}
