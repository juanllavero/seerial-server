import type { BasicUser } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { LoginLayout, UserSelector } from '@/features/auth';
import Loading from '@/shared/ui/loading';
import { LOCAL_SERVER } from '@/shared/lib/constants';
import { createServerClient } from '@seerial/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { selectedServer, currentUser, setSelectedServer, setCurrentUser } = useServerStore(
    (s) => ({
      selectedServer: s.selectedServer,
      currentUser: s.currentUser,
      setSelectedServer: s.setSelectedServer,
      setCurrentUser: s.setCurrentUser,
    }),
    shallow,
  );

  const [discoveredUsers, setDiscoveredUsers] = useState<BasicUser[]>([]);

  // Redirect immediately if session is fully restored
  useEffect(() => {
    if (selectedServer && currentUser) {
      navigate('/home');
    }
  }, [selectedServer, currentUser, navigate]);

  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [serverAvailable, setServerAvailable] = useState(false);

  useEffect(() => {
    const probeLocalServer = async () => {
      setIsCheckingServer(true);
      try {
        const client = createServerClient(LOCAL_SERVER.url);
        const response = await client.get('/servers');
        setDiscoveredUsers((response?.data?.data?.users as BasicUser[]) ?? []);
        setServerAvailable(true);
        setSelectedServer(LOCAL_SERVER);
      } catch {
        setDiscoveredUsers([]);
        setServerAvailable(false);
      } finally {
        setIsCheckingServer(false);
      }
    };

    probeLocalServer();
  }, [setSelectedServer]);

  if ((selectedServer && currentUser) || isCheckingServer) {
    return <Loading />;
  }

  if (!selectedServer || !serverAvailable) {
    return <h2>No server available</h2>;
  }

  // ── select/login user ──────────────────────────────────────────────
  return (
    <LoginLayout>
      <UserSelector
        server={selectedServer}
        users={discoveredUsers}
        onServerChange={() => {
          setSelectedServer(null);
          setDiscoveredUsers([]);
        }}
        onLogin={setCurrentUser}
      />
    </LoginLayout>
  );
}
