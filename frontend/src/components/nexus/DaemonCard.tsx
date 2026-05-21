import { memo } from 'react';
import {
  Search,
  PenLine,
  Code2,
  BarChart3,
  Palette,
  CalendarCheck,
  Bot,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/design-system';
import type { Daemon, DaemonStatus } from '@/types/nexus';
import styles from './Nexus.module.css';

interface DaemonCardProps {
  daemon: Partial<Daemon>;
  onCancel?: (id: string) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  compact?: boolean;
}

const roleIcons: Record<string, React.ReactNode> = {
  researcher: <Search size={16} />,
  writer: <PenLine size={16} />,
  coder: <Code2 size={16} />,
  analyst: <BarChart3 size={16} />,
  creator: <Palette size={16} />,
  organizer: <CalendarCheck size={16} />,
};

const statusConfig: Record<
  DaemonStatus,
  {
    variant: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info';
    labelKey: string;
    icon: React.ReactNode;
  }
> = {
  idle: { variant: 'default', labelKey: 'daemonStatus.idle', icon: <Bot size={12} /> },
  executing: {
    variant: 'accent',
    labelKey: 'daemonStatus.running',
    icon: <Loader2 size={12} className={styles.spin} />,
  },
  waiting_input: {
    variant: 'warning',
    labelKey: 'daemonStatus.waiting',
    icon: <HelpCircle size={12} />,
  },
  completed: {
    variant: 'success',
    labelKey: 'daemonStatus.done',
    icon: <CheckCircle2 size={12} />,
  },
  failed: { variant: 'error', labelKey: 'daemonStatus.failed', icon: <AlertCircle size={12} /> },
  cancelled: { variant: 'default', labelKey: 'daemonStatus.cancelled', icon: <X size={12} /> },
};

export const DaemonCard = memo(function DaemonCard({
  daemon,
  onCancel,
  onSelect,
  selected,
  compact,
}: DaemonCardProps) {
  const { t } = useTranslation('nexus');
  const status = (daemon.status ?? 'idle') as DaemonStatus;
  const cfg = statusConfig[status] ?? statusConfig.idle;
  const progress = daemon.progress ?? 0;
  const role = daemon.role ?? 'custom';
  const icon = roleIcons[role] ?? <Bot size={compact ? 14 : 16} />;
  const isActive = status === 'executing';

  // Use task_summary for persistent description, fall back to role_label
  const displayLabel = daemon.task_summary || daemon.role_label || t('daemonCard.daemon');
  const roleTag = daemon.role_label || daemon.role || t('daemonCard.daemon');

  return (
    <div
      className={[
        styles.daemonCard,
        compact && styles.daemonCardCompact,
        isActive && styles.daemonCardActive,
        selected && styles.daemonCardSelected,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => daemon.id && onSelect?.(daemon.id)}
    >
      <div className={styles.daemonCardHeader}>
        <div className={styles.daemonCardRole}>
          <span className={styles.daemonCardIcon}>{icon}</span>
          {compact ? (
            <span className={styles.daemonCardLabel}>{roleTag}</span>
          ) : (
            <span className={styles.daemonCardLabel}>{roleTag}</span>
          )}
        </div>
        <div className={styles.daemonCardActions}>
          <Badge variant={cfg.variant} icon={cfg.icon}>
            {t(cfg.labelKey)}
          </Badge>
          {isActive && onCancel && daemon.id && !compact && (
            <button
              className={styles.daemonCancelBtn}
              onClick={e => {
                e.stopPropagation();
                onCancel(daemon.id!);
              }}
              title={t('daemonCard.cancelDaemon')}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Show task description on compact cards */}
      {compact && daemon.task_summary && (
        <div className={styles.daemonCardSummary}>{displayLabel}</div>
      )}

      {/* Show current action for both compact and full */}
      {daemon.current_action && isActive && daemon.current_action !== daemon.task_summary && (
        <div className={styles.daemonCardAction}>{daemon.current_action}</div>
      )}

      {!compact && isActive && (
        <div className={styles.daemonProgress}>
          <div
            className={styles.daemonProgressFill}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      {status === 'failed' && (
        <div className={styles.daemonCardError}>{t('daemonCard.executionFailed')}</div>
      )}
    </div>
  );
});
