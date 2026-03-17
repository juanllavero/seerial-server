import type { DiscoveredServer } from '@seerial/domain';
import { useServerDiscovery } from '@seerial/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import AddServerDialog from './AddServerDialog';
import ServerCard from './ServerCard';

interface ServerSelectorProps {
  onServerSelected: (server: DiscoveredServer) => void;
}

function ServerSelector({ onServerSelected }: ServerSelectorProps) {
  const { servers, addServer } = useServerDiscovery();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const onlineServers = servers.filter((s: DiscoveredServer) => s.status !== 'offline');
  const offlineServers = servers.filter((s: DiscoveredServer) => s.status === 'offline');
  const allServers = [...onlineServers, ...offlineServers];

  return (
    <>
      <h1 className="mb-3 text-center text-4xl font-bold tracking-tight text-white">
        Selecciona un servidor
      </h1>
      <p className="mb-10 text-center text-sm text-white/40">
        Servidores encontrados en la red local
      </p>

      {/* Server grid */}
      {allServers.length === 0 ? (
        <div className="mb-10 flex flex-col items-center gap-3 py-12 text-white/30">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          <span className="text-sm">Buscando servidores...</span>
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4">
          {allServers.map((server: DiscoveredServer) => (
            <ServerCard key={server.key} server={server} onSelect={onServerSelected} />
          ))}
        </div>
      )}

      {/* Add server button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <Plus size={16} />
          Añadir servidor manualmente
        </button>
      </div>

      {/* Add server dialog */}
      <AddServerDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={addServer} />
    </>
  );
}

export default ServerSelector;
