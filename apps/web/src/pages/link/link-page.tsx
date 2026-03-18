import { publicApiClient } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CENTRAL_SERVER } from '@/shared/lib/constants';
import Image from '@/shared/ui/image';

export default function TVLinkPage() {
  const user = useServerStore((state) => state.currentUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAutoLink = useCallback(
    async (autoCode: string) => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await publicApiClient.post<{ error?: string }>(
          `https://${CENTRAL_SERVER}/users/link`,
          {
            user_code: autoCode.toUpperCase(),
          },
        );
        const data = response.data;

        if (data && !data.error) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/home');
          }, 2000);
        } else {
          setError(data?.error || 'Failed to link device');
        }
      } catch (err) {
        console.error('Auto-link error:', err);
        setError('Network error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, user],
  );

  // Obtener código de los parámetros URL si existe
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      // Limpiar el código y establecerlo
      const cleanCode = urlCode.slice(0, 4);
      setCode(cleanCode.toUpperCase());

      // Si el código tiene 4 dígitos, intentar vincularlo automáticamente
      if (cleanCode.length === 4 && user) {
        handleAutoLink(cleanCode);
      }
    }
  }, [searchParams, user, handleAutoLink]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 4);
    setCode(value.toUpperCase());
    setError(null);
  };

  const handleLink = async () => {
    if (code.length !== 4) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await publicApiClient.post<{ error?: string }>(
        `https://${CENTRAL_SERVER}/users/link`,
        {
          user_code: code,
        },
      );
      const data = response.data;

      if (data && !data.error) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } else {
        setError(data?.error || 'Failed to link device');
      }
    } catch (err) {
      console.error('Link error:', err);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate('/login?from=link');
    return null;
  }

  if (success) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
        <div className="bg-primary-foreground w-full max-w-2xl rounded-lg p-8 px-15 text-center shadow-2xl">
          <div className="mb-6 text-6xl">✅</div>
          <h2 className="mb-4 text-3xl font-black text-white">{t('successfulLink')}</h2>
          <p className="mb-6 text-gray-400">{t('successfulLinkMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      {/* App Logo */}
      <div className="mb-10 flex h-30 flex-row justify-center">
        <Image src="/img/banner.svg" alt="Logo" aspectRatio={21 / 9} />
      </div>

      {/* Card */}
      <div className="bg-primary-foreground w-full max-w-2xl rounded-lg p-8 px-15 shadow-2xl">
        <h2 className="mb-6 text-center text-4xl font-black text-white">{t('linkAccount')}</h2>

        <p className="mb-8 text-center leading-relaxed text-gray-400">{t('linkAccountMessage')}</p>

        {/* Loading state */}
        {isLoading && !error && (
          <div className="mb-6 rounded-lg border border-blue-500/50 bg-blue-500/20 p-4 text-center text-blue-400">
            <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            {t('linkingDevice')}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-center text-red-400">
            {error}
          </div>
        )}

        {/* TV Code Input */}
        <div className="mb-6">
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            style={{ fontSize: '3rem' }}
            className="bg-background focus:ring-app-color/50 w-full rounded-sm px-4 py-3 text-center font-mono text-lg tracking-widest text-white focus:ring-2 focus:outline-none"
            maxLength={4}
            disabled={isLoading}
          />
        </div>

        {/* Link Button */}
        <button
          type="button"
          onClick={handleLink}
          disabled={code.length !== 4 || isLoading}
          style={{ fontWeight: 'bold' }}
          className={`w-full rounded-sm py-4 text-lg font-semibold transition-all duration-200 ${
            code.length === 4 && !isLoading
              ? 'bg-app-color/90 hover:bg-app-color text-white shadow-lg hover:shadow-xl'
              : 'cursor-not-allowed bg-gray-600 text-gray-400'
          }`}
        >
          {isLoading ? t('linking') : t('link')}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="mb-2 text-sm text-gray-500">
          {t('signedAsMessage')} {user.username}
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm text-orange-500 underline transition-colors duration-200 hover:text-orange-400"
        >
          {t('signAsAnotherUser')}
        </button>
      </div>
    </div>
  );
}
