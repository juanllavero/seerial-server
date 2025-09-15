import FlexBox from '@/components/ui/FlexBox'
import { useAuth } from '@/context/auth.context'
import { useState } from 'react'
import ServerCard from './ServerCard'

interface FriendServer {
  id: string
  name: string
  ownerName: string
  borrowedLibraries: {
    id: string
    name: string

    type: 'shows' | 'movies' | 'music'
  }[]
}

function ServersTab() {
  const { user } = useAuth()

  const servers = user?.servers || []

  const [friendsServers, setFriendsServers] = useState<FriendServer[]>([
    {
      id: 'server1',
      name: 'Friend Server 1',
      ownerName: 'Alice',
      borrowedLibraries: [
        {
          id: 'lib1',
          name: 'Movies',
          type: 'movies',
        },
        {
          id: 'lib2',
          name: 'My Music Collection',
          type: 'music',
        },
      ],
    },
    {
      id: 'server2',
      name: 'Friend Server 2',
      ownerName: 'Bob',
      borrowedLibraries: [
        {
          id: 'lib3',
          name: 'Shows',
          type: 'shows',
        },
        {
          id: 'lib4',
          name: 'My Movies',
          type: 'movies',
        },
      ],
    },
  ])

  if (servers.length === 0) {
    return <div>No servers available.</div>
  }

  return (
    <FlexBox direction="column" gap={1} scroll="vertical">
      <span>Own Servers</span>
      {servers.map((server) => (
        <ServerCard
          key={'Server Card ' + server.id}
          name={server.name}
          owner={user?.name || ''}
          id={server.id}
        />
      ))}
      <span>Friends' Servers</span>
      {friendsServers.map((server) => (
        <ServerCard
          key={'Server Card ' + server.id}
          name={server.name}
          owner={server.ownerName}
          borrowedLibraries={server.borrowedLibraries}
          id={server.id}
        />
      ))}
    </FlexBox>
  )
}

export default ServersTab
