import { memo, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Brain, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNexusStore } from '@/store/useNexusStore';
import type { MissedUpdate } from '@/types/nexus';
import styles from './Nexus.module.css';

interface MissedUpdatesBarProps {
  onExplainTask: (taskId: string) => void;
}

function iconForEvent(eventType: string) {
  if (eventType.includes('completed') || eventType === 'cortex_response')
    return <CheckCircle2 size={14} />;
  if (eventType.includes('failed') || eventType === 'error') return <AlertCircle size={14} />;
  return <Brain size={14} />;
}

function labelForEvent(eventType: string, t: (key: string) => string) {
  switch (eventType) {
    case 'task_completed':
      return t('missedUpdates.completed');
    case 'task_failed':
      return t('missedUpdates.failed');
    case 'daemon_completed':
      return t('missedUpdates.daemonDone');
    case 'daemon_failed':
      return t('missedUpdates.daemonFailed');
    case 'cortex_response':
      return t('missedUpdates.response');
    default:
      return eventType.replace(/_/g, ' ');
  }
}

export const MissedUpdatesBar = memo(function MissedUpdatesBar({
  onExplainTask,
}: MissedUpdatesBarProps) {
  const { t } = useTranslation('nexus');
  const missedUpdates = useNexusStore(s => s.missedUpdates);
  const clearMissedUpdates = useNexusStore(s => s.clearMissedUpdates);

  const handleCardClick = useCallback(
    (update: MissedUpdate) => {
      if (update.task_id) {
        onExplainTask(update.task_id);
      }
      clearMissedUpdates();
    },
    [onExplainTask, clearMissedUpdates]
  );

  if (missedUpdates.length === 0) return null;

  return (
    <div className={styles.missedBar}>
      <div className={styles.missedHeader}>
        <span className={styles.missedTitle}>{t('missedUpdates.whileAway')}</span>
        <button className={styles.missedDismiss} onClick={clearMissedUpdates}>
          <X size={14} />
        </button>
      </div>
      <div className={styles.missedCards}>
        {missedUpdates.map(update => {
          const isFail = update.event_type.includes('failed') || update.event_type === 'error';
          return (
            <button
              key={update.id}
              className={`${styles.missedCard} ${isFail ? styles.missedCardFail : styles.missedCardSuccess}`}
              onClick={() => handleCardClick(update)}
            >
              <div className={styles.missedCardIcon}>{iconForEvent(update.event_type)}</div>
              <div className={styles.missedCardBody}>
                <span className={styles.missedCardLabel}>
                  {labelForEvent(update.event_type, t)}
                </span>
                <span className={styles.missedCardSummary}>{update.goal || update.summary}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
