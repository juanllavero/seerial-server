import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { Invitation, SearchableUser } from '@/data/interfaces/Users'
import { getInvitations, searchUsers, sendInvitation } from '@/lib/auth'
import { showToast } from '@/utils/ReactUtils'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'
import { User2Icon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

function AddFriendModal() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [users, setUsers] = React.useState<SearchableUser[]>([])
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const [invitations, setInvitations] = useState<Invitation[]>([])

  const updateInvitations = async () => {
    setInvitations(await getInvitations())
  }

  useEffect(() => {
    updateInvitations()
  }, [])

  return (
    <FlexBox
      direction="column"
      gap={1}
      height={'50dvh'}
      width={isMobile || isTablet ? '100%' : '35rem'}
    >
      <FlexBox gap={1} width={'100%'}>
        <Input
          placeholder={`${t('searchUser')}...`}
          width={'100%'}
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
        />
        <Button onClick={async () => setUsers(await searchUsers(searchQuery))}>
          {t('searchButton')}
        </Button>
      </FlexBox>
      <FlexBox
        width={'100%'}
        direction="column"
        gap={1}
        scroll="vertical"
        hideScrollbar
      >
        {users && users.length > 0 ? (
          users.map((user) => (
            <FlexBox
              key={user.id}
              justify="space-between"
              className="hover:bg-secondary rounded-md transition-colors"
              padding="1rem"
              align="center"
              width={'100%'}
            >
              <FlexBox align="center" gap={1}>
                <Avatar className="h-15 w-15">
                  <AvatarImage
                    className="rounded-full"
                    src={user.image}
                    alt={user.name}
                  />
                  <AvatarFallback className="flex h-full items-center justify-center rounded-full bg-stone-800">
                    <User2Icon size={30} />
                  </AvatarFallback>
                </Avatar>
                <FlexBox direction="column" gap={0.1}>
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                </FlexBox>
              </FlexBox>
              <Button
                disabled={invitations.some(
                  (invitation) => invitation.fromUser.id === user.id,
                )}
                onClick={async () => {
                  const message = await sendInvitation(user.id)
                  if (message) showToast('error', message)
                  updateInvitations()
                }}
              >
                {t('sendFriendRequest')}
              </Button>
            </FlexBox>
          ))
        ) : (
          <span>{t('noUsersFound')}</span>
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default AddFriendModal
