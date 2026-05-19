import { LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GuestLimitBannerProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const GuestLimitBanner: React.FC<GuestLimitBannerProps> = ({ onSignIn, onSignUp }) => {
  const { t } = useTranslation('chat');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '1rem 0',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          {t('guest.limitReached')}
        </h3>
        <p
          style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {t('guest.signInToContinue')}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onSignIn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <LogIn size={16} />
            {t('auth:signIn', { ns: ['chat', 'auth'] })}
          </button>
          <button
            onClick={onSignUp}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#6366f1',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <UserPlus size={16} />
            {t('auth:createAccount', { ns: ['chat', 'auth'] })}
          </button>
        </div>
      </div>
    </div>
  );
};
