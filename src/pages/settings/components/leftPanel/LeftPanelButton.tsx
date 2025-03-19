import { Button } from '@/components/ui/button'
import { SettingsSection } from '@/data/interfaces/Utils'
import React from 'react'

function LeftPanelButton({
  currentSection,
  setCurrentSection,
  section,
  label,
}: {
  currentSection: SettingsSection
  setCurrentSection: (section: SettingsSection) => void
  section: SettingsSection
  label: string
}) {
  return (
    <Button
      variant={'ghost'}
      style={{
        color: currentSection === section ? 'var(--app-color)' : 'white',
      }}
      onClick={() => setCurrentSection(section)}
    >
      {label}
    </Button>
  )
}

export default LeftPanelButton
