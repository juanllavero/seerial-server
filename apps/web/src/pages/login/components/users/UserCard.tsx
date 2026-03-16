import type { BasicUser } from '@seerial/domain';
import { UserIcon } from 'lucide-react';

interface UserCardProps {
  user: BasicUser;
  isSelected: boolean;
  onSelect: (user: BasicUser) => void;
}

function UserCard({ user, isSelected, onSelect }: UserCardProps) {
  return (
    <button
      onClick={() => onSelect(user)}
      className={`group relative flex flex-col items-center gap-4 rounded-2xl border p-6 transition-all duration-300 focus:outline-none ${
        isSelected
          ? 'scale-105 border-cyan-400/40 bg-white/10 shadow-xl shadow-cyan-900/30'
          : 'cursor-pointer border-white/10 bg-white/5 hover:scale-105 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-xl hover:shadow-cyan-900/30'
      }`}
    >
      {/* Icon */}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-xl transition-colors ${
          isSelected
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20'
        }`}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <UserIcon size={28} />
        )}

        {user.type === 'admin' && (
          <div className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold shadow">
            ★
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="text-base font-semibold text-white">{user.username}</p>
        {user.type === 'admin' && (
          <p className="mt-1 text-xs font-medium text-yellow-400">Administrador</p>
        )}
      </div>
    </button>
  );
}

export default UserCard;
