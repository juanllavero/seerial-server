import type { BasicUser } from '@seerial/domain'
import { useLocalStorage } from './use-local-storage'

const AUTH_USER_STORAGE_KEY = 'auth:user'

export const useIsAdmin = () => {
  const [user] = useLocalStorage<BasicUser | null>(AUTH_USER_STORAGE_KEY, null)
  return user?.type === 'admin'
}
