import FlexBox from '@/components/ui/FlexBox'
import { useAuth } from '@/context/auth.context'
import ServerCard from './ServerCard'
import { useTranslation } from 'react-i18next'

function ServersTab() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const servers = user?.servers || []

  if (servers.length === 0) {
    return <div>{t('noServers')}</div>
  }

  return (
    <FlexBox direction="column" gap={1} scroll="vertical">
      {servers.map((server) => (
        <ServerCard
          key={'Server Card ' + server.id}
          name={server.name}
          owner={server.owner?.email || ''}
          id={server.id}
        />
      ))}
    </FlexBox>
  )
}

export default ServersTab
