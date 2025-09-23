import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { SearchableUser } from '@/data/interfaces/Users'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'
import { Trash, User2Icon } from 'lucide-react'
import ShareServersModal from './ShareServersModal'
import { ModalWrapper } from '@/components/ModalWrapper'
import { useTranslation } from 'react-i18next'

function UserCard({ user }: { user: SearchableUser }) {
  const { t } = useTranslation()
  return (
    <FlexBox
      key={user.id}
      gap={1}
      align="center"
      className="hover:bg-secondary rounded-md transition-colors"
      padding="1rem"
      justify="space-between"
      width={'100%'}
    >
      <FlexBox gap={1} align="center">
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

        <FlexBox direction="column">
          <span className="text-lg font-black">{user.name}</span>
          <span>{user.email}</span>
        </FlexBox>
      </FlexBox>

      <FlexBox gap={0.5}>
        <Button variant="destructive">
          <Trash size={18} />
        </Button>
        <ModalWrapper
          title={t('shareServersButton')}
          tabs={[
            {
              title: '',
              content: <ShareServersModal toUserId={user.id} />,
            },
          ]}
          hideButtons
          button={
            <Button variant={'outline'}>{t('shareServersButton')}</Button>
          }
        />
      </FlexBox>
    </FlexBox>
  )
}

export default UserCard
