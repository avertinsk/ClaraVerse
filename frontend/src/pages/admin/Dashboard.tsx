import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminStore } from '@/store/useAdminStore';
import { Users, MessageSquare, Activity, Zap, Server, Box } from 'lucide-react';

export const Dashboard = () => {
  const { t } = useTranslation('admin');
  const { overviewStats, isLoadingStats, fetchOverviewStats } = useAdminStore();

  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);

  if (isLoadingStats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          {t('dashboard.title')}
        </h1>
        <p className="text-[var(--color-text-secondary)]">{t('dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          {t('dashboard.title')}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title={t('dashboard.totalUsers')}
          value={overviewStats?.total_users ?? 0}
          icon={<Users size={24} />}
          iconColor="text-[var(--color-accent)]"
        />
        <StatsCard
          title={t('dashboard.activeChats')}
          value={overviewStats?.active_chats ?? 0}
          icon={<MessageSquare size={24} />}
          iconColor="text-[var(--color-success)]"
        />
        <StatsCard
          title={t('dashboard.totalMessages')}
          value={overviewStats?.total_messages ?? 0}
          icon={<Activity size={24} />}
          iconColor="text-[var(--color-info)]"
        />
        <StatsCard
          title={t('dashboard.apiCallsToday')}
          value={overviewStats?.api_calls_today ?? 0}
          icon={<Zap size={24} />}
          iconColor="text-[var(--color-warning)]"
        />
        <StatsCard
          title={t('dashboard.activeProviders')}
          value={overviewStats?.active_providers ?? 0}
          icon={<Server size={24} />}
          iconColor="text-[var(--color-accent)]"
        />
        <StatsCard
          title={t('dashboard.totalModels')}
          value={overviewStats?.total_models ?? 0}
          icon={<Box size={24} />}
          iconColor="text-[var(--color-info)]"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            {t('dashboard.quickActions')}
          </h2>
          <div className="space-y-3">
            <a
              href="/admin/providers"
              className="block p-3 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-light)] transition-colors"
            >
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {t('dashboard.manageProviders')}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {t('dashboard.manageProvidersDesc')}
              </p>
            </a>
            <a
              href="/admin/analytics"
              className="block p-3 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-light)] transition-colors"
            >
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {t('dashboard.viewAnalytics')}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {t('dashboard.viewAnalyticsDesc')}
              </p>
            </a>
            <a
              href="/admin/models"
              className="block p-3 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-light)] transition-colors"
            >
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {t('dashboard.modelManagement')}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {t('dashboard.modelManagementDesc')}
              </p>
            </a>
          </div>
        </div>

        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            {t('dashboard.systemStatus')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('dashboard.providersActive')}
              </span>
              <span className="text-sm font-bold text-[var(--color-success)]">
                {overviewStats?.active_providers ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('dashboard.modelsAvailable')}
              </span>
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {overviewStats?.total_models ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('dashboard.usersRegistered')}
              </span>
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {overviewStats?.total_users ?? 0}
              </span>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid var(--color-surface-hover)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {t('dashboard.allOperational')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
}

const StatsCard = ({ title, value, icon, iconColor }: StatsCardProps) => {
  return (
    <div
      className="bg-[var(--color-surface)] rounded-lg p-6"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-tertiary)]">{title}</p>
          <p className="text-3xl font-bold mt-2 text-[var(--color-text-primary)]">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={iconColor}>{icon}</div>
      </div>
    </div>
  );
};
