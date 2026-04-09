import { API, api } from '@seerial/api';
import type { BasicUser, PersistedServer } from '@seerial/domain';
import { setCookie } from '@seerial/domain';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/shared/ui/input';
import UserCard from './user-card';

type View = 'profiles' | 'manual' | 'addUser';

interface AuthResponse {
  token?: string;
  user?: BasicUser;
}

interface UserSelectorProps {
  server: PersistedServer;
  users: BasicUser[];
  onServerChange: () => void;
  onLogin: (user: BasicUser) => void;
}

function UserSelector({ server, users, onServerChange, onLogin }: UserSelectorProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<View>(users.length > 0 ? 'profiles' : 'manual');

  const [selectedUser, setSelectedUser] = useState<BasicUser | null>(null);
  const [profilePassword, setProfilePassword] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserType, setNewUserType] = useState('normal');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  const doLogin = async (loginUsername: string, loginPassword: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>(API.users.login, {
        username: loginUsername,
        password: loginPassword ?? '',
      });
      setCookie('token', response.token ?? '', 90);
      if (response.user) {
        onLogin(response.user);
      }
      navigate('/home');
    } catch {
      showError('Contraseña incorrecta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileLogin = () => {
    if (!selectedUser) return;

    doLogin(selectedUser.username, profilePassword);
  };
  const handleManualLogin = () => doLogin(username, password);

  const handleAddUser = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>(API.users.create, {
        username: newUsername,
        password: newPassword,
        type: newUserType,
      });
      setCookie('token', response.token ?? '', 90);
      if (response.user) {
        onLogin(response.user);
      }
      navigate('/home');
    } catch {
      showError('Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndGoBack = () => {
    setSelectedUser(null);
    setError('');
    setView(users.length > 0 ? 'profiles' : 'manual');
  };

  // ── Profiles view ──────────────────────────────────────────────────────────
  if (view === 'profiles') {
    return (
      <>
        {/* Server info + back */}
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onServerChange}
            className="flex items-center gap-2 text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">{server.name}</span>
          </button>
        </div>

        <h1 className="mb-10 text-center text-4xl font-bold tracking-tight text-white">
          ¿Quién eres?
        </h1>

        {/* User grid */}
        <div className="mb-8 flex flex-wrap justify-center gap-8">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUser?.id === user.id}
              onSelect={(u) => {
                setSelectedUser(u === selectedUser ? null : u);
                setProfilePassword('');
                setError('');
              }}
            />
          ))}
        </div>

        {/* Password input for selected user */}
        {selectedUser && (
          <div className="animate-in fade-in mx-auto mb-8 max-w-md duration-300">
            <Input
              type="password"
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleProfileLogin()}
              disabled={isLoading}
              placeholder={`Contraseña para ${selectedUser.username}`}
              className="mb-4 w-full rounded-md bg-black px-5 py-7"
              autoFocus
            />
            {error && (
              <p className="mb-3 animate-pulse text-sm font-medium text-red-400">{error}</p>
            )}
            <PrimaryButton onClick={handleProfileLogin} isLoading={isLoading}>
              Iniciar Sesión
            </PrimaryButton>
          </div>
        )}

        {/* Secondary actions */}
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <SecondaryButton
            onClick={() => {
              setView('manual');
              setSelectedUser(null);
              setError('');
            }}
          >
            Acceder manualmente
          </SecondaryButton>
          <SecondaryButton
            onClick={() => {
              setView('addUser');
              setError('');
            }}
          >
            Añadir usuario
          </SecondaryButton>
        </div>
      </>
    );
  }

  // ── Manual login view ──────────────────────────────────────────────────────
  if (view === 'manual') {
    return (
      <>
        <BackButton onClick={resetAndGoBack} />
        <h1 className="mb-10 text-center text-4xl font-bold tracking-tight text-white">
          Acceder manualmente
        </h1>
        <div className="mx-auto max-w-md space-y-5">
          <FieldInput
            label="Usuario"
            value={username}
            onChange={setUsername}
            placeholder="Introduce tu usuario"
          />
          <FieldInput
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            onEnter={handleManualLogin}
            placeholder="Introduce tu contraseña"
          />
          {error && <ErrorText>{error}</ErrorText>}
          <PrimaryButton
            onClick={handleManualLogin}
            isLoading={isLoading}
            disabled={!username.trim()}
          >
            Acceder
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              setView('addUser');
              setError('');
            }}
          >
            Añadir usuario
          </SecondaryButton>
        </div>
      </>
    );
  }

  // ── Add user view ──────────────────────────────────────────────────────────
  return (
    <>
      <BackButton onClick={resetAndGoBack} />
      <h1 className="mb-10 text-center text-4xl font-bold tracking-tight text-white">
        Añadir usuario
      </h1>
      <div className="mx-auto max-w-md space-y-5">
        <FieldInput
          label="Usuario"
          value={newUsername}
          onChange={setNewUsername}
          placeholder="Nombre de usuario"
        />
        <FieldInput
          label="Contraseña"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Contraseña"
        />
        <div>
          <label htmlFor="userType" className="mb-2 block text-sm font-medium text-white/70">
            Tipo de usuario
          </label>
          <select
            id="userType"
            value={newUserType}
            onChange={(e) => setNewUserType(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md bg-black p-4 text-white focus:outline-none disabled:opacity-50"
          >
            <option value="normal">Usuario Regular</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton
          onClick={handleAddUser}
          isLoading={isLoading}
          disabled={!newUsername.trim() || (newUserType === 'admin' && !newPassword.trim())}
        >
          Añadir
        </PrimaryButton>
      </div>
    </>
  );
}

// ── Small sub-components ───────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-8 flex items-center gap-2 text-white/50 transition-colors hover:text-white focus:outline-none"
    >
      <ArrowLeft size={20} />
      <span>Volver</span>
    </button>
  );
}

function PrimaryButton({
  onClick,
  isLoading,
  disabled,
  children,
}: {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      className="bg-app-color hover:bg-app-color/90 focus:ring-app-color flex w-full items-center justify-center rounded-xl py-4 text-lg font-semibold text-black shadow-lg transition-all focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-black/20 border-t-black" />
      ) : (
        children
      )}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus:ring-app-color flex w-full items-center justify-center rounded-xl bg-white py-4 text-lg font-semibold text-black shadow transition-all hover:opacity-90 focus:ring-4 focus:outline-none"
    >
      {children}
    </button>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  onEnter,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={label} className="mb-2 block text-sm font-medium text-white/70">
        {label}
      </label>
      <Input
        id={label}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        className="w-full rounded-md bg-black px-5 py-7"
      />
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="animate-pulse text-sm font-medium text-red-400">{children}</p>;
}

export default UserSelector;
