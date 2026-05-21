import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertCircle, Brain, Info, X } from 'lucide-react';
import { Button, Spinner, Alert } from '@/components/design-system';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import memoryService from '@/services/memoryService';
import type { MemoryStats } from '@/services/memoryService';
import { useSettingsStore } from '@/store/useSettingsStore';
import './UsageSection.css';

// Helper function to format reset time with more detail
function formatResetTime(resetAt: string): string {
  const date = new Date(resetAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Resetting...';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour: show hours and minutes
  if (diffMinutes < 60) {
    return `Resets in ${diffMinutes} min`;
  }

  // Less than 24 hours: show hours and remaining minutes
  if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes > 0) {
      return `Resets in ${diffHours} hr ${remainingMinutes} min`;
    }
    return `Resets in ${diffHours} hr`;
  }

  // 1-6 days: show days
  if (diffDays < 7) {
    return `Resets in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  // 7+ days: show day of week and time
  return `Resets ${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

// Helper to format relative time
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffSeconds < 60) {
    return 'less than a minute ago';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Usage item interface
interface UsageItemData {
  label: string;
  current: number;
  max: number;
  resetAt?: string;
  showCount?: boolean; // If true, show raw count instead of percentage or "Unlimited"
}

// Usage Item Component
interface UsageItemProps {
  item: UsageItemData;
}

const UsageItem: React.FC<UsageItemProps> = ({ item }) => {
  const { label, current, max, resetAt, showCount } = item;
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);

  const getProgressStatus = (): 'safe' | 'warning' | 'critical' => {
    if (isUnlimited) return 'safe';
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };

  const progressStatus = getProgressStatus();

  // Determine display value
  const displayValue = showCount
    ? current.toLocaleString() // Show raw count with comma formatting
    : isUnlimited
      ? 'Unlimited'
      : `${Math.round(percentage)}% used`;

  return (
    <div className="usage-item">
      <div className="usage-item-header">
        <div className="usage-item-left">
          <span className="usage-item-label">{label}</span>
          {resetAt && <span className="usage-item-reset">{formatResetTime(resetAt)}</span>}
        </div>
        <span className={`usage-item-value ${isUnlimited && !showCount ? 'unlimited' : ''}`}>
          {displayValue}
        </span>
      </div>
      {!isUnlimited && !showCount && (
        <div className="usage-progress-container">
          <div className="usage-progress-bar">
            <div
              className={`usage-progress-fill progress-${progressStatus}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Usage Group Component
interface UsageGroupProps {
  title: string;
  items: UsageItemData[];
}

const UsageGroup: React.FC<UsageGroupProps> = ({ title, items }) => {
  if (items.length === 0) return null;

  return (
    <section className="usage-group">
      <h3 className="usage-group-title">{title}</h3>
      <div className="usage-group-items">
        {items.map((item, index) => (
          <UsageItem key={`${item.label}-${index}`} item={item} />
        ))}
      </div>
    </section>
  );
};

export const UsageSection: React.FC = () => {
  const { t } = useTranslation('settings');
  const { usageStats, isLoadingUsage, usageError, fetchUsageStats } = useSubscriptionStore();
  const { memoryEnabled } = useSettingsStore();

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [memoryStatsError, setMemoryStatsError] = useState<string | null>(null);
  const [showMemoryInfoModal, setShowMemoryInfoModal] = useState(false);

  // Fetch memory stats
  const fetchMemoryStats = useCallback(async () => {
    if (!memoryEnabled) {
      setMemoryStats(null);
      return;
    }

    try {
      setMemoryStatsError(null);
      const stats = await memoryService.getMemoryStats();
      setMemoryStats(stats);
    } catch (err) {
      console.error('Failed to fetch memory stats:', err);
      setMemoryStatsError(t('memory.statsFailed'));
    }
  }, [memoryEnabled]);

  // Fetch usage stats on mount
  useEffect(() => {
    fetchUsageStats();
    fetchMemoryStats();
    setLastUpdated(new Date());
  }, [fetchUsageStats, fetchMemoryStats]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUsageStats(), fetchMemoryStats()]);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [fetchUsageStats, fetchMemoryStats]);

  // Group usage data by period
  const sessionItems: UsageItemData[] = [];
  // Session data would go here if backend provides it

  const dailyItems: UsageItemData[] = usageStats
    ? [
        {
          label: 'Executions',
          current: usageStats.executions_today?.current ?? 0,
          max: usageStats.executions_today?.max ?? -1,
        },
        {
          label: 'File uploads',
          current: usageStats.file_uploads?.current ?? 0,
          max: usageStats.file_uploads?.max ?? -1,
          resetAt: usageStats.file_uploads?.reset_at,
        },
        {
          label: 'Image generations',
          current: usageStats.image_generations?.current ?? 0,
          max: usageStats.image_generations?.max ?? -1,
          resetAt: usageStats.image_generations?.reset_at,
        },
        {
          label: 'Memory extractions',
          current: usageStats.memory_extractions?.current ?? 0,
          max: usageStats.memory_extractions?.max ?? -1,
          resetAt: usageStats.memory_extractions?.reset_at,
        },
      ]
    : [];

  const monthlyItems: UsageItemData[] = usageStats
    ? [
        {
          label: 'Messages',
          current: usageStats.messages?.current ?? 0,
          max: usageStats.messages?.max ?? -1,
          resetAt: usageStats.messages?.reset_at,
        },
      ]
    : [];

  const resourceItems: UsageItemData[] = usageStats
    ? [
        {
          label: 'Schedules',
          current: usageStats.schedules?.current ?? 0,
          max: usageStats.schedules?.max ?? -1,
        },
        {
          label: 'API keys',
          current: usageStats.api_keys?.current ?? 0,
          max: usageStats.api_keys?.max ?? -1,
        },
        {
          label: 'Requests per minute',
          current: usageStats.requests_per_min?.current ?? 0,
          max: usageStats.requests_per_min?.max ?? -1,
        },
      ]
    : [];

  const memoryItems: UsageItemData[] =
    memoryEnabled && memoryStats
      ? [
          {
            label: 'Total memories',
            current: memoryStats.total_memories,
            max: -1,
            showCount: true,
          },
          {
            label: 'Active memories',
            current: memoryStats.active_memories,
            max: -1,
            showCount: true,
          },
          {
            label: 'Archived memories',
            current: memoryStats.archived_memories,
            max: -1,
            showCount: true,
          },
        ]
      : [];

  if (isLoadingUsage && !usageStats) {
    return (
      <div className="usage-loading">
        <Spinner size="lg" />
        <p>{t('usage.loading')}</p>
      </div>
    );
  }

  if (usageError && !usageStats) {
    return (
      <div className="usage-error">
        <Alert variant="error">
          <AlertCircle size={16} />
          <span>{usageError}</span>
        </Alert>
        <Button onClick={handleRefresh}>
          <RefreshCw size={16} />
          {t('usage.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="usage-section">
      {/* Header */}
      <header className="usage-header">
        <div className="usage-title-section">
          <h1 className="usage-main-title">{t('usage.title')}</h1>
          <p className="usage-subtitle">{t('usage.subtitle')}</p>
        </div>
      </header>

      {/* Session Usage */}
      {sessionItems.length > 0 && (
        <>
          <UsageGroup title={t('usage.currentSession')} items={sessionItems} />
          <div className="usage-divider" />
        </>
      )}

      {/* Daily Limits */}
      {dailyItems.length > 0 && (
        <>
          <UsageGroup title={t('usage.dailyLimits')} items={dailyItems} />
          <div className="usage-divider" />
        </>
      )}

      {/* Monthly Limits */}
      {monthlyItems.length > 0 && (
        <>
          <UsageGroup title={t('usage.monthlyLimits')} items={monthlyItems} />
          <div className="usage-divider" />
        </>
      )}

      {/* Resource Limits */}
      {resourceItems.length > 0 && (
        <>
          <UsageGroup title={t('usage.resourceLimits')} items={resourceItems} />
          {memoryItems.length > 0 && <div className="usage-divider" />}
        </>
      )}

      {/* Memory System */}
      {memoryItems.length > 0 && (
        <section className="usage-group">
          <h3
            className="usage-group-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Brain size={18} />
            {t('usage.memorySystem')}
            <button
              onClick={() => setShowMemoryInfoModal(true)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title={t('usage.memoryInfo')}
            >
              <Info size={16} />
            </button>
          </h3>
          {memoryStatsError && (
            <Alert variant="error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>{memoryStatsError}</span>
            </Alert>
          )}
          <div className="usage-group-items">
            {memoryItems.map((item, index) => (
              <UsageItem key={`${item.label}-${index}`} item={item} />
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>
            {t('usage.memoryDesc', {
              score: memoryStats ? memoryStats.avg_score.toFixed(2) : 'N/A',
            })}
          </p>
        </section>
      )}

      {memoryEnabled && !memoryStats && !memoryStatsError && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
          <Brain size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: '14px' }}>{t('usage.noMemories')}</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>{t('usage.memoriesExtracted')}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="usage-footer">
        <span>{t('usage.lastUpdated', { time: formatTimeAgo(lastUpdated) })}</span>
        <button
          className={`usage-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label={t('usage.refreshData')}
        >
          <RefreshCw size={16} />
        </button>
      </footer>

      {/* Memory System Info Modal */}
      {showMemoryInfoModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/80"
          onClick={() => setShowMemoryInfoModal(false)}
        >
          <div
            style={{ backgroundColor: '#0d0d0d' }}
            className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{ backgroundColor: '#0d0d0d' }}
              className="sticky top-0 p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div style={{ backgroundColor: '#0d0d0d' }} className="p-2 rounded-lg">
                  <Brain className="w-4 h-4 text-gray-300" />
                </div>
                <h2 className="text-base font-semibold text-gray-100">{t('usage.memorySystem')}</h2>
              </div>
              <button
                onClick={() => setShowMemoryInfoModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all"
                aria-label={t('usage.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm overflow-y-auto max-h-[calc(85vh-80px)]">
              {/* How it works */}
              <section>
                <h3 className="text-sm font-semibold mb-2 text-gray-300">
                  {t('usage.howItWorks')}
                </h3>
                <p className="text-gray-400 leading-relaxed text-xs">{t('usage.howItWorksDesc')}</p>
              </section>

              {/* Extraction */}
              <section>
                <h3 className="text-sm font-semibold mb-2 text-gray-300">
                  {t('usage.extraction')}
                </h3>
                <div className="space-y-2 text-gray-400">
                  <p className="text-xs">{t('usage.extractionDesc')}</p>
                  <p className="text-xs text-gray-500">{t('usage.categories')}</p>
                </div>
              </section>

              {/* Selection */}
              <section>
                <h3 className="text-sm font-semibold mb-2 text-gray-300">{t('usage.selection')}</h3>
                <div className="space-y-2 text-gray-400">
                  <p className="text-xs">{t('usage.selectionDesc')}</p>
                  <p className="text-xs text-gray-500">{t('usage.defaultTop5')}</p>
                </div>
              </section>

              {/* Decay */}
              <section>
                <h3 className="text-sm font-semibold mb-2 text-gray-300">{t('usage.decay')}</h3>
                <div className="space-y-3 text-gray-400">
                  <p className="text-xs">{t('usage.decayDesc')}</p>
                  <div
                    style={{ backgroundColor: '#0d0d0d' }}
                    className="rounded-lg p-3 font-mono text-xs"
                  >
                    <p className="text-gray-300">{t('usage.scoreFormula')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div style={{ backgroundColor: '#0d0d0d' }} className="rounded-lg p-2.5">
                      <p className="text-gray-200 font-medium mb-1.5 text-xs">
                        {t('usage.recency')}
                      </p>
                      <p className="text-gray-500 text-xs">{t('usage.recent')}</p>
                      <p className="text-gray-500 text-xs">{t('usage.oneWeek')}</p>
                      <p className="text-gray-500 text-xs">{t('usage.oneMonth')}</p>
                    </div>
                    <div style={{ backgroundColor: '#0d0d0d' }} className="rounded-lg p-2.5">
                      <p className="text-gray-200 font-medium mb-1.5 text-xs">
                        {t('usage.frequency')}
                      </p>
                      <p className="text-gray-500 text-xs">{t('usage.zeroUses')}</p>
                      <p className="text-gray-500 text-xs">{t('usage.tenUses')}</p>
                      <p className="text-gray-500 text-xs">{t('usage.twentyPlusUses')}</p>
                    </div>
                    <div style={{ backgroundColor: '#0d0d0d' }} className="rounded-lg p-2.5">
                      <p className="text-gray-200 font-medium mb-1.5 text-xs">
                        {t('usage.engagement')}
                      </p>
                      <p className="text-gray-500 text-xs">{t('usage.high')}</p>
                      <p className="text-gray-500 text-xs">{t('usage.med')}</p>
                      <p className="text-gray-500 text-xs">{t('usage.low')}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{t('usage.archivedNote')}</p>
                </div>
              </section>

              {/* Privacy */}
              <section>
                <h3 className="text-sm font-semibold mb-2 text-gray-300">
                  {t('usage.privacySecurity')}
                </h3>
                <div className="space-y-2 text-gray-400">
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-xs">
                      <span className="text-gray-300/50 mt-0.5">•</span>
                      <span>{t('usage.encrypted')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <span className="text-gray-300/50 mt-0.5">•</span>
                      <span>{t('usage.noAdminAccess')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <span className="text-gray-300/50 mt-0.5">•</span>
                      <span>{t('usage.deduplication')}</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Credit Info */}
              <section style={{ backgroundColor: '#0d0d0d' }} className="rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  <span className="text-gray-300 font-medium">{t('usage.creditUsage')}:</span>{' '}
                  {t('usage.creditUsageDesc')}
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageSection;
