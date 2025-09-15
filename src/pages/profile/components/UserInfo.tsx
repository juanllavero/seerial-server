import FlexBox from '@/components/ui/FlexBox'
import { useAuth } from '@/context/auth.context'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'

function UserInfo() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <FlexBox gap={3} align="center">
      <Avatar className="h-30 w-30">
        <AvatarImage
          className="rounded-full"
          src={user.image}
          alt={user.name}
        />
        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
      </Avatar>

      <FlexBox direction="column" gap={0.5}>
        <span className="text-2xl font-black">{user.name}</span>
        <span>{user.email}</span>
      </FlexBox>
    </FlexBox>
  )
}

export default UserInfo
