import FlexBox from '@/components/ui/FlexBox'
import { useEffect, useState } from 'react'
import { Invitation } from '@/data/interfaces/Users'
import { acceptInvitation, getInvitations, rejectInvitation } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'
import { t } from 'i18next'

function InvitationsTab() {
  const [invitations, setInvitations] = useState<Invitation[] | null>(null)
  const updateInterval = 3000

  const updateInvitations = async () => {
    setInvitations(await getInvitations())
  }

  useEffect(() => {
    updateInvitations()
    const interval = setInterval(updateInvitations, updateInterval)
    return () => clearInterval(interval)
  }, [])

  return (
    <FlexBox direction="column" gap={1}>
      {!invitations ? (
        <FlexBox justify="center" align="center" width={'100%'} padding="1rem">
          <SmallSpinner />
        </FlexBox>
      ) : invitations && invitations.length > 0 ? (
        invitations.map((invitation) => (
          <FlexBox
            key={invitation.id}
            gap={1}
            align="center"
            className="hover:bg-secondary rounded-md transition-colors"
            padding="1rem"
            justify="space-between"
            width={'100%'}
          >
            <FlexBox direction="column" gap={0.2}>
              <span className="text-lg font-black">
                {invitation.fromUser.name}
              </span>
              <span>{invitation.fromUser.email}</span>
            </FlexBox>
            <FlexBox gap={1}>
              <Button
                variant="destructive"
                onClick={() => rejectInvitation(invitation.id)}
              >
                {t('rejectButton')}
              </Button>
              <Button onClick={() => acceptInvitation(invitation.id)}>
                {t('acceptButton')}
              </Button>
            </FlexBox>
          </FlexBox>
        ))
      ) : (
        <span>{t('noInvitations')}</span>
      )}
    </FlexBox>
  )
}

export default InvitationsTab
