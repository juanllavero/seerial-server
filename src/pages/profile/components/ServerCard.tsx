import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { useIsServerOwner } from '@/hooks/useServerOwner'
import { Trash, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ServerCardProps {
  name: string
  owner: string
  borrowedLibraries?: {
    id: string
    name: string
    type: 'shows' | 'movies' | 'music'
  }[]
  id: string
}

function ServerCard({ name, owner, borrowedLibraries, id }: ServerCardProps) {
  const { t } = useTranslation()
  return (
    <FlexBox
      padding="1rem"
      justify="space-between"
      className="hover:bg-secondary rounded-md transition-colors"
      width={'100%'}
      gap={1}
      align="center"
    >
      <FlexBox direction="column" gap={0.1}>
        <h3>{name}</h3>
        <FlexBox align="center" gap={0.2}>
          <User size={16} />
          <span>{owner}</span>
        </FlexBox>
        <FlexBox gap={0.5} wrap="wrap">
          {borrowedLibraries &&
            borrowedLibraries.map((library) => (
              <Badge key={library.id}>{library.name}</Badge>
            ))}
        </FlexBox>
      </FlexBox>
      <FlexBox>
        <Button variant="destructive" title={t('removeButton')}>
          <Trash size={18} />
        </Button>
      </FlexBox>
    </FlexBox>
  )
}

export default ServerCard
