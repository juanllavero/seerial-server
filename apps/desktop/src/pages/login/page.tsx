import type { BasicUser, DiscoveredServer } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import { LoginLayout, ServerSelector, UserSelector } from '@/features/auth';
import Loading from '@/shared/components/loading';

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

  if (selectedServer && currentUser) {
    return <Loading />;
  }

  // ── Step 1: select server ──────────────────────────────────────────────────
  if (!selectedServer) {
    const handleServerSelected = (server: DiscoveredServer) => {
      setSelectedServer({ name: server.name, url: server.url });
      setDiscoveredUsers(server.users);
    };

    return (
      <LoginLayout>
        <ServerSelector onServerSelected={handleServerSelected} />
      </LoginLayout>
    );
  }

  // ── Step 2: select/login user ──────────────────────────────────────────────
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
