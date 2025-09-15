import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { Invitation, SearchableUser } from '@/data/interfaces/Users'
import { getInvitations, searchUsers, sendInvitation } from '@/lib/auth'
import { showToast } from '@/utils/ReactUtils'
import React, { useEffect, useState } from 'react'

function AddFriendModal() {
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
          placeholder="Search user..."
          width={'100%'}
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
        />
        <Button onClick={async () => setUsers(await searchUsers(searchQuery))}>
          Search
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
              align="center"
              width={'100%'}
            >
              <FlexBox direction="column" gap={0.1}>
                <span>{user.name}</span>
                <span>{user.email}</span>
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
                Send Request
              </Button>
            </FlexBox>
          ))
        ) : (
          <span>No users found</span>
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default AddFriendModal
