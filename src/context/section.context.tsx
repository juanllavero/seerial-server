import { create } from 'zustand'
import { SettingsSections, WindowSections } from '@/data/enums/Sections'

interface SectionStore {
  currentWindowSection: WindowSections
  setCurrentWindowSection: (section: WindowSections) => void
  currentSettingsSection: SettingsSections
  setCurrentSettingsSection: (section: SettingsSections) => void
}

export const useSectionStore = create<SectionStore>((set) => ({
  currentWindowSection: WindowSections.General,
  setCurrentWindowSection: (section) => set({ currentWindowSection: section }),
  currentSettingsSection: SettingsSections.ClientGeneral,
  setCurrentSettingsSection: (section) =>
    set({ currentSettingsSection: section }),
}))
