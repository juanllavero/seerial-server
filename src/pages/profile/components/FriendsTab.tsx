import { ModalWrapper } from '@/components/ModalWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import AddFriendModal from './AddFriendModal'
import { SearchableUser } from '@/data/interfaces/Users'
import { useEffect, useState } from 'react'
import { getFriends } from '@/lib/auth'
import UserCard from './UserCard'
import { useTranslation } from 'react-i18next'
import Loading from '@/components/Loading'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'

function FriendsTab() {
  const { t } = useTranslation()
  const [friends, setFriends] = useState<SearchableUser[] | null>(null)
  const updateInterval = 3000

  const updateFriends = async () => {
    setFriends(await getFriends())
  }

  useEffect(() => {
    updateFriends()
    const interval = setInterval(updateFriends, updateInterval)
    return () => clearInterval(interval)
  }, [])
  return (
    <FlexBox direction="column" gap={1}>
      <FlexBox gap={1} align="center" justify="space-between" width={'100%'}>
        <FlexBox gap={1} width={'100%'} maxWidth={'30rem'}>
          <Input
            placeholder={`${t('searchUser')}...`}
            className={`w-full ${''}`}
          />
          <Button>{t('searchButton')}</Button>
        </FlexBox>

        <ModalWrapper
          title={t('addFriendButton')}
          hideButtons
          tabs={[
            {
              title: '',
              content: <AddFriendModal />,
            },
          ]}
          button={<Button variant={'outline'}>{t('addFriendButton')}</Button>}
        />
      </FlexBox>

      <FlexBox direction="column" gap={1} width={'100%'}>
        {!friends ? (
          <FlexBox
            justify="center"
            align="center"
            width={'100%'}
            padding="1rem"
          >
            <SmallSpinner />
          </FlexBox>
        ) : friends && friends.length > 0 ? (
          friends.map((user) => <UserCard key={user.id} user={user} />)
        ) : null}
      </FlexBox>
    </FlexBox>
  )
}

export default FriendsTab
