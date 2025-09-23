import FlexBox from '@/components/ui/FlexBox'
import { memo, useEffect, useState } from 'react'
import { Invitation } from '@/data/interfaces/Users'
import { acceptInvitation, getInvitations, rejectInvitation } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'
import { t } from 'i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Check, X } from 'lucide-react'

function InvitationsDropdown() {
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

  if (!invitations || invitations.length === 0) return null

  return (
    <FlexBox className="absolute top-10 right-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            title={t('invitations')}
            className="hover:bg-accent relative rounded-full bg-black px-2"
          >
            <Bell className="text-white" />
            <FlexBox className="absolute top-0 right-0 items-center justify-center rounded-full bg-white">
              <span
                className="flex h-5 w-5 items-center justify-center text-xs font-semibold"
                style={{ color: 'black' }}
              >
                {invitations ? invitations.length : 0}
              </span>
            </FlexBox>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-5">
          <FlexBox direction="column" gap={0.2}>
            {!invitations ? (
              <FlexBox
                justify="center"
                align="center"
                width={'100%'}
                padding="1rem"
              >
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
                  width={'30rem'}
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
                      title={t('rejectButton')}
                      onClick={() => rejectInvitation(invitation.id)}
                    >
                      <X size={18} />
                    </Button>
                    <Button
                      title={t('acceptButton')}
                      onClick={() => acceptInvitation(invitation.id)}
                    >
                      <Check size={18} />
                    </Button>
                  </FlexBox>
                </FlexBox>
              ))
            ) : (
              <span>{t('noInvitations')}</span>
            )}
          </FlexBox>
        </DropdownMenuContent>
      </DropdownMenu>
    </FlexBox>
  )
}

export default memo(InvitationsDropdown)
