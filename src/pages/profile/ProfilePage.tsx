import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useServerStore } from '@/context/server.context'
import { ReactNode, useState } from 'react'
import FriendsTab from './components/FriendsTab'
import ProfileSettingsTab from './components/ProfileSettingsTab'
import ServersTab from './components/ServersTab'
import UserInfo from './components/UserInfo'
import InvitationsTab from './components/InvitationsTab'

interface TabContent {
  title: string
  disabled?: boolean
  hidden?: boolean
  content: ReactNode | ReactNode[]
}

function ProfilePage() {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const isMobile = useIsMobile()

  const [currentTab, setCurrentTab] = useState('Profile Settings')

  const tabs: TabContent[] = [
    {
      title: 'Profile Settings',
      content: <ProfileSettingsTab />,
    },
    {
      title: 'Servers',
      content: <ServersTab />,
    },
    {
      title: 'Friends',
      content: <FriendsTab />,
    },
    {
      title: 'Invitations',
      content: <InvitationsTab />,
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
    </FlexBox>
  )
}

export default ProfilePage
