import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReactNode, useState } from 'react'
import FriendsTab from './components/FriendsTab'
import ProfileSettingsTab from './components/ProfileSettingsTab'
import ServersTab from './components/ServersTab'
import UserInfo from './components/UserInfo'
import { t } from 'i18next'
import { Button } from '@/components/ui/button'
import InvitationsDropdown from './components/InvitationsDropdown'

interface TabContent {
  title: string
  disabled?: boolean
  hidden?: boolean
  content: ReactNode | ReactNode[]
}

function ProfilePage() {
  const isMobile = useIsMobile()
  const [currentTab, setCurrentTab] = useState(t('profileSettings'))

  const tabs: TabContent[] = [
    {
      title: t('profileSettings'),
      content: <ProfileSettingsTab />,
    },
    {
      title: t('servers'),
      content: <ServersTab />,
    },
    {
      title: t('friends'),
      content: <FriendsTab />,
    },
  ]

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab)
  }

  return (
    <FlexBox
      direction="column"
      gap={isMobile ? 0.5 : 2}
      padding={isMobile ? '1rem' : '2rem'}
    >
      {/* User Info */}
      <UserInfo />

      {/* Tabs */}
      <Tabs
        value={currentTab} // Controlar la tab activa
        onValueChange={handleTabChange} // Manejar cambios de tab
        className="w-full"
      >
        <TabsList className={`mt-2 flex w-full`}>
          {tabs
            .filter((tab) => !tab.hidden)
            .map((tab) => (
              <TabsTrigger key={'Tab' + tab.title} value={tab.title}>
                {tab.title}
              </TabsTrigger>
            ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent
            key={tab.title}
            value={tab.title}
            className="py-4"
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {Array.isArray(tab.content)
              ? tab.content.map((item, index) => <div key={index}>{item}</div>)
              : tab.content}
          </TabsContent>
        ))}
      </Tabs>

      <InvitationsDropdown />
    </FlexBox>
  )
}

export default ProfilePage
