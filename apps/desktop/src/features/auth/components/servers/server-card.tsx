import type { DiscoveredServer } from '@seerial/domain';
import { Server, WifiOff } from 'lucide-react';

interface ServerCardProps {
  server: DiscoveredServer;
  onSelect: (server: DiscoveredServer) => void;
}

function ServerCard({ server, onSelect }: ServerCardProps) {
  const isChecking = server.status === 'checking';
  const isOffline = server.status === 'offline';
  const isDisabled = isChecking || isOffline;

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onSelect(server)}
      disabled={isDisabled}
      className={`group relative flex flex-col items-center gap-4 rounded-2xl border p-6 transition-all duration-300 focus:outline-none ${
        isOffline
          ? 'cursor-not-allowed border-white/5 bg-white/3 opacity-50'
          : isChecking
            ? 'cursor-wait border-white/10 bg-white/5'
            : 'cursor-pointer border-white/10 bg-white/5 hover:scale-105 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-xl hover:shadow-cyan-900/30'
      } `}
    >
      {/* Checking overlay */}
      {isChecking && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {/* Icon */}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-xl transition-colors ${
          isOffline
            ? 'bg-white/5 text-white/30'
            : 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20'
        }`}
      >
        {isOffline ? <WifiOff size={28} /> : <Server size={28} />}
      </div>

      {/* Info */}
      <div className="text-center">
        <p className={`text-base font-semibold ${isOffline ? 'text-white/30' : 'text-white'}`}>
          {server.name === server.url ? extractHostname(server.url) : server.name}
        </p>
        <p className="mt-1 font-mono text-xs text-white/40">{extractHostname(server.url)}</p>
      </div>

      {/* Status badge */}
      {isOffline && (
        <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
          No disponible
        </span>
      )}
      {server.status === 'online' && (
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          En línea
        </span>
      )}
    </button>
  );
}

function extractHostname(url: string): string {
  try {
    const u = new URL(url);
    return u.port ? `${u.hostname}:${u.port}` : u.hostname;
  } catch {
    return url;
  }
}

export default ServerCard;
