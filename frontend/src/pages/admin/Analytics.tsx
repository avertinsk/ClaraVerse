import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminStore } from '@/store/useAdminStore';
import { adminService } from '@/services/adminService';
import {
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
  TrendingDown,
  Server,
  Zap,
  Clock,
  BarChart3,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type DateRange = '7' | '14' | '30' | '90';

export const Analytics = () => {
  const { t } = useTranslation('admin');
  const {
    overviewStats,
    providerAnalytics,
    chatAnalytics,
    agentAnalytics,
    isLoadingStats,
    statsError,
    fetchOverviewStats,
    fetchProviderAnalytics,
    fetchChatAnalytics,
    fetchAgentAnalytics,
    refreshAllAnalytics,
  } = useAdminStore();

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAnalytics = async () => {
    await Promise.all([
      fetchOverviewStats(),
      fetchProviderAnalytics(),
      fetchChatAnalytics(),
      fetchAgentAnalytics(),
    ]);
    setLastRefresh(new Date());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllAnalytics();
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const handleMigrateTimestamps = async () => {
    if (!confirm('This will update existing chat sessions with proper timestamps. Continue?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await adminService.migrateChatSessionTimestamps();
      setMigrationResult(`✅ ${result.message}`);

      // Refresh analytics after migration
      await loadAnalytics();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Migration failed';
      setMigrationResult(`❌ ${errorMsg}`);
    } finally {
      setIsMigrating(false);

      // Clear message after 5 seconds
      setTimeout(() => setMigrationResult(null), 5000);
    }
  };

  if (isLoadingStats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          {t('analytics.title')}
        </h1>
        <p className="text-[var(--color-text-secondary)]">{t('analytics.loading')}</p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          {t('analytics.title')}
        </h1>
        <div
          className="bg-[var(--color-error-light)] rounded-lg p-4"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <p className="text-[var(--color-error)]">{statsError}</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors"
        >
          {t('analytics.retry')}
        </button>
      </div>
    );
  }

  // Calculate engagement metrics
  const avgMessagesPerChat = chatAnalytics?.avg_messages_per_chat || 0;
  const activeChats = chatAnalytics?.active_chats || 0;
  const totalChats = chatAnalytics?.total_chats || 0;
  const engagementRate = totalChats > 0 ? ((activeChats / totalChats) * 100).toFixed(1) : '0';

  // Top providers by usage
  const topProviders = [...(providerAnalytics || [])]
    .sort((a, b) => (b.total_requests || 0) - (a.total_requests || 0))
    .slice(0, 5);

  // Prepare chart data
  let timeSeriesData = chatAnalytics?.time_series || [];

  // Check if time series data is all zeros
  const hasData = timeSeriesData.some(
    d => d.chat_count > 0 || d.message_count > 0 || d.user_count > 0
  );

  // Fallback: If time_series is empty or all zeros but we have actual data, generate data points
  // This handles the case where chat data exists but doesn't have proper timestamps
  if ((!hasData || timeSeriesData.length === 0) && (activeChats > 0 || totalChats > 0)) {
    const now = new Date();
    const daysToGenerate = parseInt(dateRange);

    // Generate empty data points for the past days, with today having the actual data
    timeSeriesData = Array.from({ length: daysToGenerate }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (daysToGenerate - 1 - i));
      const dateStr = date.toISOString().split('T')[0];

      // Put actual data on today, zeros on other days
      const isToday = i === daysToGenerate - 1;
      return {
        date: dateStr,
        chat_count: isToday ? totalChats : 0,
        message_count: isToday ? chatAnalytics?.total_messages || 0 : 0,
        user_count: isToday ? overviewStats?.total_users || 0 : 0,
        agent_count: isToday ? overviewStats?.agent_executions || 0 : 0,
      };
    });
  }

  const days = parseInt(dateRange);
  const filteredData = timeSeriesData.slice(-days);

  const chartData = {
    labels: filteredData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: t('analytics.chart.chats'),
        data: filteredData.map(d => d.chat_count),
        borderColor: 'rgb(233, 30, 99)',
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: t('analytics.chart.messages'),
        data: filteredData.map(d => d.message_count),
        borderColor: 'rgb(63, 127, 191)',
        backgroundColor: 'rgba(63, 127, 191, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: t('analytics.chart.activeUsers'),
        data: filteredData.map(d => d.user_count),
        borderColor: 'rgb(76, 175, 80)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: t('analytics.chart.agentExecutions'),
        data: filteredData.map(d => d.agent_count),
        borderColor: 'rgb(255, 152, 0)',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          padding: 16,
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgba(75, 85, 99, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.1)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            {t('analytics.title')}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {t('analytics.lastUpdated')}: {lastRefresh.toLocaleTimeString()}
          </span>

          {/* Migration Result Message */}
          {migrationResult && (
            <span className="text-xs font-medium px-3 py-1.5 bg-[var(--color-surface)] rounded-lg">
              {migrationResult}
            </span>
          )}

          {/* Migration Button */}
          {!hasData && timeSeriesData.length > 0 && (
            <button
              onClick={handleMigrateTimestamps}
              disabled={isMigrating}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-warning)] hover:bg-[var(--color-warning-hover)] text-white rounded-lg transition-colors"
              title="Fix timestamp data for historical analytics"
            >
              <Clock size={16} className={isMigrating ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">
                {isMigrating ? t('analytics.migrating') : t('analytics.fixTimestamps')}
              </span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {t('analytics.refresh')}
            </span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Users */}
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-tertiary)]">{t('analytics.totalUsers')}</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {overviewStats?.total_users || 0}
            </p>
          </div>
        </div>

        {/* Active Chats */}
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <MessageSquare size={24} className="text-[var(--color-success)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t('analytics.activeChats')}
            </p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {overviewStats?.active_chats || 0}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              {engagementRate}% {t('analytics.engagementRate')}
            </p>
          </div>
        </div>

        {/* Total Messages */}
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <Activity size={24} className="text-[var(--color-info)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t('analytics.totalMessages')}
            </p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {(overviewStats?.total_messages || 0).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              {avgMessagesPerChat.toFixed(1)} {t('analytics.avgPerChat')}
            </p>
          </div>
        </div>

        {/* API Calls Today */}
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <Zap size={24} className="text-[var(--color-warning)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t('analytics.apiCallsToday')}
            </p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {overviewStats?.api_calls_today || 0}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              {chatAnalytics?.chats_created_today || 0} {t('analytics.chatsCreated')}
            </p>
          </div>
        </div>

        {/* Agent Executions */}
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <Server
              size={24}
              className="text-[var(--color-info)]"
              style={{ color: 'rgb(255, 152, 0)' }}
            />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t('analytics.agentExecutions')}
            </p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {overviewStats?.agent_executions || 0}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              {overviewStats?.agents_run_today || 0} {t('analytics.runToday')}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Trends Chart */}
      <div
        className="bg-[var(--color-surface)] rounded-lg p-6"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t('analytics.activityTrends')}
            </h2>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--color-text-tertiary)]" />
            <div className="flex gap-1 bg-[var(--color-background)] rounded-lg p-1">
              {(['7', '14', '30', '90'] as DateRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                    dateRange === range
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {range}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Legend Info */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6"
          style={{ borderTop: '1px solid var(--color-surface-hover)' }}
        >
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
              {t('analytics.totalChats')}
            </p>
            <p className="text-lg font-bold text-[var(--color-accent)]">
              {filteredData.reduce((sum, d) => sum + d.chat_count, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
              {t('analytics.totalMessages')}
            </p>
            <p className="text-lg font-bold text-[var(--color-info)]">
              {filteredData.reduce((sum, d) => sum + d.message_count, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
              {t('analytics.uniqueUsers')}
            </p>
            <p className="text-lg font-bold text-[var(--color-success)]">
              {Math.max(...filteredData.map(d => d.user_count), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
              {t('analytics.agentRuns')}
            </p>
            <p className="text-lg font-bold" style={{ color: 'rgb(255, 152, 0)' }}>
              {filteredData.reduce((sum, d) => sum + d.agent_count, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Agent Activity Chart */}
      {agentAnalytics && (
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Server
                size={20}
                className="text-[var(--color-accent)]"
                style={{ color: 'rgb(255, 152, 0)' }}
              />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t('analytics.agentActivity')}
              </h2>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--color-text-tertiary)]" />
              <div className="flex gap-1 bg-[var(--color-background)] rounded-lg p-1">
                {(['7', '14', '30', '90'] as DateRange[]).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                      dateRange === range
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {range}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-80">
            <Line
              data={{
                labels: agentAnalytics.time_series.slice(-parseInt(dateRange)).map(d => {
                  const date = new Date(d.date);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                datasets: [
                  {
                    label: t('analytics.chart.agentsCreated'),
                    data: agentAnalytics.time_series
                      .slice(-parseInt(dateRange))
                      .map(d => d.agents_created),
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: t('analytics.chart.agentsDeployed'),
                    data: agentAnalytics.time_series
                      .slice(-parseInt(dateRange))
                      .map(d => d.agents_deployed),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: t('analytics.chart.agentRuns'),
                    data: agentAnalytics.time_series
                      .slice(-parseInt(dateRange))
                      .map(d => d.agent_runs),
                    borderColor: 'rgb(255, 152, 0)',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: t('analytics.chart.schedulesCreated'),
                    data: agentAnalytics.time_series
                      .slice(-parseInt(dateRange))
                      .map(d => d.schedules_created),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>

          {/* Agent Stats Summary */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6"
            style={{ borderTop: '1px solid var(--color-surface-hover)' }}
          >
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                {t('analytics.totalCreated')}
              </p>
              <p className="text-lg font-bold" style={{ color: 'rgb(139, 92, 246)' }}>
                {agentAnalytics.time_series
                  .slice(-parseInt(dateRange))
                  .reduce((sum, d) => sum + d.agents_created, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                {t('analytics.totalDeployed')}
              </p>
              <p className="text-lg font-bold" style={{ color: 'rgb(34, 197, 94)' }}>
                {agentAnalytics.time_series
                  .slice(-parseInt(dateRange))
                  .reduce((sum, d) => sum + d.agents_deployed, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                {t('analytics.totalRuns')}
              </p>
              <p className="text-lg font-bold" style={{ color: 'rgb(255, 152, 0)' }}>
                {agentAnalytics.time_series
                  .slice(-parseInt(dateRange))
                  .reduce((sum, d) => sum + d.agent_runs, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                {t('analytics.schedulesCreated')}
              </p>
              <p className="text-lg font-bold" style={{ color: 'rgb(59, 130, 246)' }}>
                {agentAnalytics.time_series
                  .slice(-parseInt(dateRange))
                  .reduce((sum, d) => sum + d.schedules_created, 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Activity */}
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t('analytics.chatActivity')}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('analytics.totalChats')}
              </span>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                {totalChats}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('analytics.activeChats')}
              </span>
              <span className="text-lg font-bold text-[var(--color-success)]">{activeChats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('analytics.avgMessagesChat')}
              </span>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                {avgMessagesPerChat.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('analytics.chatsCreatedToday')}
              </span>
              <span className="text-lg font-bold text-[var(--color-accent)]">
                {chatAnalytics?.chats_created_today || 0}
              </span>
            </div>
          </div>

          {/* Engagement Rate Indicator */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-surface-hover)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {t('analytics.engagementRate')}
              </span>
              <span className="text-sm font-bold text-[var(--color-accent)]">
                {engagementRate}%
              </span>
            </div>
            <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-2">
              <div
                className="bg-[var(--color-accent)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(parseFloat(engagementRate), 100)}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              {parseFloat(engagementRate) > 50
                ? t('analytics.insights.excellentRetention')
                : parseFloat(engagementRate) > 30
                  ? t('analytics.insights.goodEngagement')
                  : t('analytics.insights.focusReengagement')}
            </p>
          </div>
        </div>

        {/* Provider Performance */}
        <div
          className="bg-[var(--color-surface)] rounded-lg p-6"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Server size={20} className="text-[var(--color-info)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t('analytics.providerPerformance')}
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('analytics.activeProviders')}
              </span>
              <span className="text-lg font-bold text-[var(--color-success)]">
                {overviewStats?.active_providers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t('analytics.totalModels')}
              </span>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                {overviewStats?.total_models || 0}
              </span>
            </div>
          </div>

          {/* Top Providers */}
          {topProviders.length > 0 && (
            <div
              className="mt-6 pt-6"
              style={{ borderTop: '1px solid var(--color-surface-hover)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                {t('analytics.mostUsedProviders')}
              </h3>
              <div className="space-y-2">
                {topProviders.map((provider, index) => {
                  const total = topProviders.reduce((sum, p) => sum + (p.total_requests || 0), 0);
                  const percentage = total > 0 ? ((provider.total_requests || 0) / total) * 100 : 0;

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {provider.provider_name}
                        </span>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {provider.total_requests || 0} {t('analytics.requests')}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-1.5">
                        <div
                          className="bg-[var(--color-info)] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Health */}
      <div
        className="bg-[var(--color-surface)] rounded-lg p-6"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-[var(--color-accent)]" />
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t('analytics.systemHealth')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Growth */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[var(--color-success)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {t('analytics.userGrowth')}
              </h3>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              {overviewStats?.total_users || 0}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {t('analytics.totalRegisteredUsers')}
            </p>
          </div>

          {/* Message Velocity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-[var(--color-info)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {t('analytics.messageVelocity')}
              </h3>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              {chatAnalytics?.messages_sent_today || 0}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {t('analytics.messagesSentToday')}
            </p>
          </div>

          {/* Response Time */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[var(--color-warning)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {t('analytics.providerHealth')}
              </h3>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              {overviewStats?.active_providers || 0}/{overviewStats?.total_models || 0}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {t('analytics.activeProvidersModels')}
            </p>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-surface-hover)' }}>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            {t('analytics.actionableInsights')}
          </h3>
          <div className="space-y-2">
            {parseFloat(engagementRate) < 30 && (
              <div className="flex items-start gap-3 p-3 bg-[var(--color-warning-light)] rounded-lg">
                <TrendingDown size={16} className="text-[var(--color-warning)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-warning)]">
                    {t('analytics.insights.lowEngagement')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {t('analytics.insights.lowEngagementDesc')}
                  </p>
                </div>
              </div>
            )}
            {avgMessagesPerChat < 5 && (
              <div className="flex items-start gap-3 p-3 bg-[var(--color-info-light)] rounded-lg">
                <Activity size={16} className="text-[var(--color-info)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-info)]">
                    {t('analytics.insights.shortConversations')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {t('analytics.insights.shortConversationsDesc')}
                  </p>
                </div>
              </div>
            )}
            {(overviewStats?.active_providers || 0) > 0 && (
              <div className="flex items-start gap-3 p-3 bg-[var(--color-success-light)] rounded-lg">
                <TrendingUp size={16} className="text-[var(--color-success)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-success)]">
                    {t('analytics.insights.healthyDiversity')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {overviewStats?.active_providers} {t('analytics.insights.healthyDiversityDesc')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
