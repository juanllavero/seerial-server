import { Store } from '@tauri-apps/plugin-store'

let storePromise: Promise<Store> | null = null

export function getAuthStore() {
	if (!storePromise) {
		storePromise = Store.load('.auth.dat')
	}
	return storePromise
}
