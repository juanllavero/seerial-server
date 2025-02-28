import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LangToggle from '@/components/LangToggle'
import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useServerStore } from '@/context/server.context'
import useFetch from '@/hooks/useFetch'
import { Library } from '@/data/interfaces/Media'
import useDataStore from '@/context/data.context'
import Loading from '@/components/Loading'
import { DropdownContent } from '@/data/interfaces/Utils'
import DropdownWrapper from '@/components/DropdownWrapper'

export default function HomePage() {
  const { t } = useTranslation()
  const { setLibraries } = useDataStore()
  const { serverIP } = useServerStore()
  const { fetchData, isLoading, error } = useFetch<Library[]>()

  const content: DropdownContent = {
    title: 'My Account',
    items: [
      {
        separator: false,
        items: [
          {
            title: 'Profile',
            shortcut: '⇧⌘P',
            action: () => console.log('Profile clicked'),
          },
          {
            title: 'Billing',
            shortcut: '⌘B',
            action: () => console.log('Billing clicked'),
          },
          {
            title: 'Settings',
            shortcut: '⌘S',
            action: () => console.log('Settings clicked'),
          },
          {
            title: 'Keyboard shortcuts',
            shortcut: '⌘K',
            action: () => console.log('Keyboard shortcuts clicked'),
          },
        ],
      },
      { separator: true, items: [] },
      {
        separator: false,
        items: [
          { title: 'Team', action: () => console.log('Team clicked') },
          {
            title: 'Invite users',
            action: () => {},
            items: [
              {
                items: [
                  {
                    title: 'Email',
                    action: () => console.log('Invite via Email'),
                  },
                  {
                    title: 'Message',
                    action: () => console.log('Invite via Message'),
                  },
                ],
              },
              { separator: true, items: [] },
              {
                items: [
                  {
                    title: 'More...',
                    action: () => console.log('More options'),
                  },
                ],
              },
            ],
          },
          {
            title: 'New Team',
            shortcut: '⌘+T',
            action: () => console.log('New Team clicked'),
          },
        ],
      },
      { separator: true, items: [] },
      {
        separator: false,
        items: [
          { title: 'GitHub', action: () => console.log('GitHub clicked') },
          { title: 'Support', action: () => console.log('Support clicked') },
          {
            title: 'API',
            action: () => console.log('API clicked'),
            disabled: true,
          },
        ],
      },
      { separator: true, items: [] },
      {
        separator: false,
        items: [
          {
            title: 'Log out',
            shortcut: '⇧⌘Q',
            action: () => console.log('Log out clicked'),
          },
        ],
      },
    ],
  }

  useEffect(() => {
    if (serverIP !== '') {
      fetchData(`https://${serverIP}/libraries`, (data) => {
        setLibraries(data)
      })
    }
  }, [serverIP])

  if (isLoading) {
    return <Loading />
  } else if (error) {
    return (
      <div>
        <h1>{error.message}</h1>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <span>
          <h1 className="font-mono text-4xl font-bold">{t('appName')}</h1>
          <p
            className="text-muted-foreground text-end text-sm uppercase"
            data-testid="pageTitle"
          >
            {t('titleHomePage')}
          </p>
        </span>
        <LangToggle />

        <DropdownWrapper
          content={content}
          button={<Button>Open Mine</Button>}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Show Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
