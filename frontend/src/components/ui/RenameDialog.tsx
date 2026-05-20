import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/design-system/feedback/Modal/Modal';
import styles from './RenameDialog.module.css';

export interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newTitle: string) => void;
  currentTitle: string;
  title?: string;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  onClose,
  onRename,
  currentTitle,
  title,
}) => {
  const { t } = useTranslation('common');
  const [inputValue, setInputValue] = useState(currentTitle);

  const dialogTitle = title || t('rename.title');

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue && trimmedValue !== currentTitle) {
      onRename(trimmedValue);
      onClose();
    } else if (!trimmedValue) {
      // If empty, don't submit
      return;
    } else {
      // If same as current, just close
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      size="sm"
      closeOnBackdrop={true}
      closeOnEscape={true}
      showClose={false}
    >
      <form onSubmit={handleSubmit} className={styles.renameDialog}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className={styles.input}
          placeholder={t('rename.placeholder')}
          autoFocus
          maxLength={100}
        />
        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            {t('rename.cancel')}
          </button>
          <button type="submit" className={styles.submitButton}>
            {t('rename.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
