import { createWithEqualityFn } from 'zustand/traditional'

interface DataState {
	selectedLibraryId: string | null
	currentBackground?: string
	isContent: boolean
	loadingContent: boolean

	// GET
	selectLibrary: (libraryId: string | null) => void

	// SET
	setCurrentBackground: (background: string | undefined) => void
	setIsContent: (isContent: boolean) => void
	setLoadingContent: (loadingContent: boolean) => void
}

const useDataStore = createWithEqualityFn<DataState>((set) => ({
	selectedLibraryId: null,
	currentBackground: undefined,
	isContent: false,
	loadingContent: false,

	selectLibrary(libraryId: string | null) {
		set(() => ({
			selectedLibraryId: libraryId,
		}))
	},

	setCurrentBackground(background: string | undefined) {
		set(() => ({
			currentBackground: background,
		}))
	},

	setIsContent(isContent: boolean) {
		set(() => ({
			isContent: isContent,
		}))
	},

	setLoadingContent(loadingContent: boolean) {
		set(() => ({
			loadingContent: loadingContent,
		}))
	},
}))

export default useDataStore
