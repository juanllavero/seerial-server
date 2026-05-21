import { API, api } from '@seerial/api';
import type { BasicUser, PersistedServer } from '@seerial/domain';
import { setCookie } from '@seerial/domain';
import { ArrowLeft } from 'lucide-react';
import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/shared/components/ui/input';
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

interface UserSelectorState {
  view: View;
  selectedUser: BasicUser | null;
  profilePassword: string;
  username: string;
  password: string;
  newUsername: string;
  newPassword: string;
  newUserType: string;
  error: string;
}

type UserSelectorAction =
  | { type: 'set-view'; value: View }
  | { type: 'set-selected-user'; value: BasicUser | null }
  | { type: 'set-profile-password'; value: string }
  | { type: 'set-username'; value: string }
  | { type: 'set-password'; value: string }
  | { type: 'set-new-username'; value: string }
  | { type: 'set-new-password'; value: string }
  | { type: 'set-new-user-type'; value: string }
  | { type: 'set-error'; value: string }
  | { type: 'clear-error' }
  | { type: 'reset-and-go-back'; hasProfiles: boolean };

function userSelectorReducer(
  state: UserSelectorState,
  action: UserSelectorAction,
): UserSelectorState {
  switch (action.type) {
    case 'set-view':
      return { ...state, view: action.value };
    case 'set-selected-user':
      return { ...state, selectedUser: action.value };
    case 'set-profile-password':
      return { ...state, profilePassword: action.value };
    case 'set-username':
      return { ...state, username: action.value };
    case 'set-password':
      return { ...state, password: action.value };
    case 'set-new-username':
      return { ...state, newUsername: action.value };
    case 'set-new-password':
      return { ...state, newPassword: action.value };
    case 'set-new-user-type':
      return { ...state, newUserType: action.value };
    case 'set-error':
      return { ...state, error: action.value };
    case 'clear-error':
      return { ...state, error: '' };
    case 'reset-and-go-back':
      return {
        ...state,
        selectedUser: null,
        error: '',
        view: action.hasProfiles ? 'profiles' : 'manual',
      };
    default:
      return state;
  }
}

function UserSelector({ server, users, onServerChange, onLogin }: UserSelectorProps) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(userSelectorReducer, {
    view: users.length > 0 ? 'profiles' : 'manual',
    selectedUser: null,
    profilePassword: '',
    username: '',
    password: '',
    newUsername: '',
    newPassword: '',
    newUserType: 'normal',
    error: '',
  });

  const {
    view,
    selectedUser,
    profilePassword,
    username,
    password,
    newUsername,
    newPassword,
    newUserType,
    error,
  } = state;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const showError = (msg: string) => {
    dispatch({ type: 'set-error', value: msg });
    setTimeout(() => dispatch({ type: 'clear-error' }), 5000);
  };

  const doLogin = async (loginUsername: string, loginPassword: string) => {
    setIsSubmitting(true);
    dispatch({ type: 'clear-error' });
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
      setIsSubmitting(false);
    }
  };

  const handleProfileLogin = () => {
    if (!selectedUser) return;

    doLogin(selectedUser.username, profilePassword);
  };
  const handleManualLogin = () => doLogin(username, password);

  const handleAddUser = async () => {
    setIsSubmitting(true);
    dispatch({ type: 'clear-error' });
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
      setIsSubmitting(false);
    }
  };

  const resetAndGoBack = () => {
    dispatch({ type: 'reset-and-go-back', hasProfiles: users.length > 0 });
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

        <h1 className="mb-10 text-center text-4xl font-semibold tracking-tight text-white">
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
                dispatch({ type: 'set-selected-user', value: u === selectedUser ? null : u });
                dispatch({ type: 'set-profile-password', value: '' });
                dispatch({ type: 'clear-error' });
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
              onChange={(e) => dispatch({ type: 'set-profile-password', value: e.target.value })}
              onKeyUp={(e) => e.key === 'Enter' && handleProfileLogin()}
              disabled={isSubmitting}
              placeholder={`Contraseña para ${selectedUser.username}`}
              className="mb-4 w-full rounded-md bg-stone-900 px-5 py-7"
            />
            {error && (
              <p className="mb-3 animate-pulse text-sm font-medium text-red-400">{error}</p>
            )}
            <PrimaryButton onClick={handleProfileLogin} isLoading={isSubmitting}>
              Iniciar Sesión
            </PrimaryButton>
          </div>
        )}

        {/* Secondary actions */}
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <SecondaryButton
            onClick={() => {
              dispatch({ type: 'set-view', value: 'manual' });
              dispatch({ type: 'set-selected-user', value: null });
              dispatch({ type: 'clear-error' });
            }}
          >
            Acceder manualmente
          </SecondaryButton>
          <SecondaryButton
            onClick={() => {
              dispatch({ type: 'set-view', value: 'addUser' });
              dispatch({ type: 'clear-error' });
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
        <h1 className="mb-10 text-center text-4xl font-semibold tracking-tight text-white">
          Acceder manualmente
        </h1>
        <div className="mx-auto max-w-md space-y-5">
          <FieldInput
            label="Usuario"
            value={username}
            onChange={(value) => dispatch({ type: 'set-username', value })}
            placeholder="Introduce tu usuario"
          />
          <FieldInput
            label="Contraseña"
            type="password"
            value={password}
            onChange={(value) => dispatch({ type: 'set-password', value })}
            onEnter={handleManualLogin}
            placeholder="Introduce tu contraseña"
          />
          {error && <ErrorText>{error}</ErrorText>}
          <PrimaryButton
            onClick={handleManualLogin}
            isLoading={isSubmitting}
            disabled={!username.trim()}
          >
            Acceder
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              dispatch({ type: 'set-view', value: 'addUser' });
              dispatch({ type: 'clear-error' });
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
      <h1 className="mb-10 text-center text-4xl font-semibold tracking-tight text-white">
        Añadir usuario
      </h1>
      <div className="mx-auto max-w-md space-y-5">
        <FieldInput
          label="Usuario"
          value={newUsername}
          onChange={(value) => dispatch({ type: 'set-new-username', value })}
          placeholder="Nombre de usuario"
        />
        <FieldInput
          label="Contraseña"
          type="password"
          value={newPassword}
          onChange={(value) => dispatch({ type: 'set-new-password', value })}
          placeholder="Contraseña"
        />
        <div>
          <label htmlFor="userType" className="mb-2 block text-sm font-medium text-white/70">
            Tipo de usuario
          </label>
          <select
            id="userType"
            value={newUserType}
            onChange={(e) => dispatch({ type: 'set-new-user-type', value: e.target.value })}
            disabled={isSubmitting}
            className="w-full rounded-md bg-stone-900 p-4 text-white focus:outline-none disabled:opacity-50"
          >
            <option value="normal">Usuario Regular</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <PrimaryButton
          onClick={handleAddUser}
          isLoading={isSubmitting}
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
        <div className="size-6 animate-spin rounded-full border-4 border-black/20 border-t-black" />
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
        className="w-full rounded-md bg-stone-900 px-5 py-7"
      />
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="animate-pulse text-sm font-medium text-red-400">{children}</p>;
}

export default UserSelector;
