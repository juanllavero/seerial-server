import { ModalWrapper } from '@/components/ModalWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import AddFriendModal from './AddFriendModal'

function FriendsTab() {
  return (
    <FlexBox direction="column" gap={1}>
      <FlexBox gap={1} align="center" justify="space-between" width={'100%'}>
        <FlexBox gap={1} width={'100%'} maxWidth={'30rem'}>
          <Input placeholder="Search user..." />
          <Button>Search</Button>
        </FlexBox>

        <ModalWrapper
          title="Add Friend"
          tabs={[
            {
              title: 'By Email',
              content: <AddFriendModal />,
            },
          ]}
          button={<Button variant={'outline'}>Add Friend</Button>}
        />
      </FlexBox>
    </FlexBox>
  )
}

export default FriendsTab
