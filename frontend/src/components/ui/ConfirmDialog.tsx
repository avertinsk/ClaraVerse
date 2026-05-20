import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/design-system/feedback/Modal/Modal';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'info',
}) => {
  const { t } = useTranslation('common');

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const confirmLabel = confirmText || t('actions.confirm');
  const cancelLabel = cancelText || t('actions.cancel');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={true}
      closeOnEscape={true}
      showClose={false}
    >
      <div className={styles.confirmDialog}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            {cancelLabel}
          </button>
          <button onClick={handleConfirm} className={`${styles.confirmButton} ${styles[variant]}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
