import { MessageSquare, Workflow, Settings, Shield, BrainCircuit, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppCard } from '@/components/dashboard';
import { UserMenu, Snowfall } from '@/components/ui';
import { useIsMobile } from '@/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import faviconIcon from '@/assets/favicon-32x32.png';

export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  const isMobile = useIsMobile();
  const { isAdmin } = useAuthStore();

  const apps = [
    {
      id: 'chat',
      icon: MessageSquare,
      title: t('dashboard.chat.title'),
      description: t('dashboard.chat.desc'),
      href: '/chat',
    },
    {
      id: 'agents',
      icon: Workflow,
      title: t('dashboard.workflows.title'),
      description: t('dashboard.workflows.desc'),
      href: '/agents',
    },
    {
      id: 'nexus',
      icon: Brain,
      title: t('dashboard.nexus.title'),
      description: t('dashboard.nexus.desc'),
      href: '/nexus',
    },
    {
      id: 'skills',
      icon: BrainCircuit,
      title: t('dashboard.skills.title'),
      description: t('dashboard.skills.desc'),
      href: '/skills',
    },
    {
      id: 'settings',
      icon: Settings,
      title: t('dashboard.settings.title'),
      description: t('dashboard.settings.desc'),
      href: '/settings',
    },
  ];

  const adminApp = {
    id: 'admin',
    icon: Shield,
    title: t('dashboard.admin.title'),
    description: t('dashboard.admin.desc'),
    href: '/admin/dashboard',
  };

  // =============================================================================
  // MOBILE LAYOUT - Phone-style app grid
  // =============================================================================
  if (isMobile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-background)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          position: 'relative',
        }}
      >
        <Snowfall />
        {/* Mobile Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
          }}
        >
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={faviconIcon}
              alt="Clara logo"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
              }}
            />
          </a>
          <UserMenu />
        </div>

        {/* Mobile Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px 40px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: '8px',
                background: 'var(--gradient-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('dashboard.title')}
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Phone-style App Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px 4px',
              width: '100%',
              maxWidth: '320px',
            }}
          >
            {apps.map(app => (
              <AppCard
                key={app.id}
                icon={app.icon}
                title={app.title}
                description={app.description}
                href={app.href}
                compact
              />
            ))}
            {isAdmin && (
              <AppCard
                key={adminApp.id}
                icon={adminApp.icon}
                title={adminApp.title}
                description={adminApp.description}
                href={adminApp.href}
                compact
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // DESKTOP LAYOUT - Original unchanged
  // =============================================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-6)',
        position: 'relative',
      }}
    >
      <Snowfall />

      {/* Logo - Top Left */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-6)',
          left: 'var(--space-6)',
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src={faviconIcon}
            alt="Clara logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
            }}
          />
        </a>
      </div>

      {/* User Menu - Top Right */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-6)',
          right: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <UserMenu />
      </div>

      <div style={{ width: '100%', maxWidth: '1100px' }}>
        {/* Header */}
        <div
          className="dashboard-header"
          style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}
        >
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-3)',
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('dashboard.title')}
          </h1>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Apps Grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px',
            maxWidth: '680px',
            margin: '0 auto',
          }}
          className="dashboard-grid"
        >
          {apps.map(app => (
            <div
              key={app.id}
              data-tour={`${app.id}-card`}
              style={{ width: 'calc((100% - 40px) / 3)', minWidth: '180px' }}
            >
              <AppCard
                icon={app.icon}
                title={app.title}
                description={app.description}
                href={app.href}
              />
            </div>
          ))}
          {isAdmin && (
            <div key={adminApp.id} style={{ width: 'calc((100% - 40px) / 3)', minWidth: '180px' }}>
              <AppCard
                icon={adminApp.icon}
                title={adminApp.title}
                description={adminApp.description}
                href={adminApp.href}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
