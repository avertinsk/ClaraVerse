import { memo, useState, useCallback } from 'react';
import {
  Pencil,
  Play,
  Trash2,
  Loader2,
  Send,
  HardDrive,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/design-system';
import { fetchRoutineRuns, type Routine, type RoutineRun } from '@/services/clawService';
import styles from './Nexus.module.css';

interface RoutineCardProps {
  routine: Routine;
  triggering?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTrigger: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

function cronToHuman(
  cron: string,
  t: (key: string, opts?: Record<string, string>) => string
): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  const [min, hour, , , dow] = parts;
  if (hour !== '*' && min !== '*') {
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    if (dow === '*') return t('routineCard.dailyAt', { time });
    if (dow === '1-5') return t('routineCard.weekdaysAt', { time });
    return `${time} (${cron})`;
  }
  if (hour.startsWith('*/')) return t('routineCard.everyHours', { count: hour.slice(2) });
  if (min.startsWith('*/')) return t('routineCard.everyMinutes', { count: min.slice(2) });
  return cron;
}

function timeAgo(dateStr: string | undefined, t: (key: string) => string): string {
  if (!dateStr) return t('routineCard.never');
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('routineCard.justNow');
  if (mins < 60) return t('routineCard.minutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('routineCard.hoursAgo', { count: hrs });
  return t('routineCard.daysAgo', { count: Math.floor(hrs / 24) });
}

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={11} style={{ color: 'var(--color-success, #22c55e)' }} />,
  failed: <XCircle size={11} style={{ color: 'var(--color-error, #ef4444)' }} />,
  executing: <Loader2 size={11} className={styles.spin} />,
  pending: <Clock size={11} style={{ opacity: 0.5 }} />,
};

export const RoutineCard = memo(function RoutineCard({
  routine,
  triggering,
  onEdit,
  onDelete,
  onTrigger,
  onToggle,
}: RoutineCardProps) {
  const { t } = useTranslation('nexus');
  const [expanded, setExpanded] = useState(false);
  const [runs, setRuns] = useState<RoutineRun[] | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const toggleHistory = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (runs === null) {
      setLoadingRuns(true);
      try {
        const data = await fetchRoutineRuns(routine.id, 10);
        setRuns(data);
      } catch {
        setRuns([]);
      } finally {
        setLoadingRuns(false);
      }
    }
  }, [expanded, runs, routine.id]);

  return (
    <div className={`${styles.routineCard} ${!routine.enabled ? styles.routineCardDisabled : ''}`}>
      <div className={styles.routineCardHeader}>
        <div className={styles.routineCardTitle}>
          <span className={styles.routineCardName}>{routine.name}</span>
          <Badge variant={routine.enabled ? 'success' : 'default'}>
            {routine.enabled ? t('routineCard.active') : t('routineCard.paused')}
          </Badge>
        </div>
        <div className={styles.routineCardActions}>
          <button
            className={styles.routineActionBtn}
            onClick={() => onTrigger(routine.id)}
            title={t('routineCard.runNow')}
            disabled={triggering}
          >
            {triggering ? <Loader2 size={13} className={styles.spin} /> : <Play size={13} />}
          </button>
          <button
            className={styles.routineActionBtn}
            onClick={() => onEdit(routine.id)}
            title={t('routineCard.edit')}
          >
            <Pencil size={13} />
          </button>
          <button
            className={`${styles.routineActionBtn} ${styles.routineActionBtnDanger}`}
            onClick={() => onDelete(routine.id)}
            title={t('routineCard.delete')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className={styles.routineCardMeta}>
        <span>{cronToHuman(routine.cronExpression, t)}</span>
        <span className={styles.routineCardDot} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {routine.deliveryMethod === 'telegram' ? <Send size={10} /> : <HardDrive size={10} />}
          {routine.deliveryMethod === 'telegram'
            ? t('routineCard.telegram')
            : t('routineCard.inApp')}
        </span>
        {routine.enabledTools?.length > 0 && (
          <>
            <span className={styles.routineCardDot} />
            <span>{routine.enabledTools.length} tools</span>
          </>
        )}
      </div>

      {routine.totalRuns > 0 && (
        <div className={styles.routineCardStats}>
          <span>
            {routine.totalRuns} {t('routineCard.runs')}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              color: 'var(--color-success, #22c55e)',
            }}
          >
            <CheckCircle2 size={10} /> {routine.successfulRuns}
          </span>
          {routine.failedRuns > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                color: 'var(--color-error, #ef4444)',
              }}
            >
              <XCircle size={10} /> {routine.failedRuns}
            </span>
          )}
          <span className={styles.routineCardDot} />
          <span>
            {t('routineCard.last')}: {timeAgo(routine.lastRunAt, t)}
          </span>
        </div>
      )}

      {/* Run history toggle */}
      {routine.totalRuns > 0 && (
        <button className={styles.routineHistoryToggle} onClick={toggleHistory}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? t('routineCard.hideHistory') : t('routineCard.viewHistory')}
        </button>
      )}

      {/* Expandable run history */}
      {expanded && (
        <div className={styles.routineRunHistory}>
          {loadingRuns && (
            <div className={styles.routineRunLoading}>
              <Loader2 size={14} className={styles.spin} /> {t('routineCard.loading')}
            </div>
          )}
          {!loadingRuns && runs && runs.length === 0 && (
            <div className={styles.routineRunEmpty}>{t('routineCard.noRuns')}</div>
          )}
          {!loadingRuns &&
            runs &&
            runs.map(run => (
              <div key={run.id} className={styles.routineRunItem}>
                <div className={styles.routineRunItemHeader}>
                  {statusIcon[run.status] ?? statusIcon.pending}
                  <span className={styles.routineRunItemTime}>{timeAgo(run.created_at, t)}</span>
                  <Badge
                    variant={
                      run.status === 'completed'
                        ? 'success'
                        : run.status === 'failed'
                          ? 'error'
                          : 'default'
                    }
                  >
                    {run.status}
                  </Badge>
                </div>
                {run.summary && (
                  <div className={styles.routineRunSummary}>
                    {run.summary.length > 200 ? run.summary.slice(0, 200) + '...' : run.summary}
                  </div>
                )}
                {run.error && <div className={styles.routineRunError}>{run.error}</div>}
              </div>
            ))}
        </div>
      )}

      <div className={styles.routineCardToggle}>
        <label className={styles.routineToggleLabel}>
          <input
            type="checkbox"
            checked={routine.enabled}
            onChange={() => onToggle(routine.id, !routine.enabled)}
            className={styles.routineToggleInput}
          />
          <span className={styles.routineToggleSwitch} />
        </label>
      </div>
    </div>
  );
});
