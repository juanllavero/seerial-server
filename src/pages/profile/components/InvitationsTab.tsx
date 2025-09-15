import FlexBox from '@/components/ui/FlexBox'
import { useEffect, useState } from 'react'
import { Invitation } from '@/data/interfaces/Users'
import { getInvitations } from '@/lib/auth'

function InvitationsTab() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const updateInterval = 3000

  const updateInvitations = async () => {
    setInvitations(await getInvitations())
  }

  useEffect(() => {
    const interval = setInterval(updateInvitations, updateInterval)
    return () => clearInterval(interval)
  }, [])

  return (
    <FlexBox direction="column" gap={1}>
      {invitations && invitations.length > 0 ? (
        invitations.map((invitation) => (
          <FlexBox
            key={invitation.id}
            gap={1}
            align="center"
            justify="space-between"
            width={'100%'}
          >
            <span>{invitation.fromUser.name}</span>
          </FlexBox>
        ))
      ) : (
        <span>No invitations</span>
      )}
    </FlexBox>
  )
}

export default InvitationsTab
