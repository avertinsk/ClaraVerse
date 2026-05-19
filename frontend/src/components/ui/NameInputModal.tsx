import { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NameInputModal.module.css';

interface NameInputModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
}

export const NameInputModal: React.FC<NameInputModalProps> = ({ isOpen, onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation('onboarding');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setName('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t('nameModal.validation.required'));
      return;
    }

    if (trimmedName.length < 2) {
      setError(t('nameModal.validation.minLength'));
      return;
    }

    if (trimmedName.length > 50) {
      setError(t('nameModal.validation.maxLength'));
      return;
    }

    onSubmit(trimmedName);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h1 className={styles.title}>{t('nameModal.title')}</h1>

        <p className={styles.description}>{t('nameModal.description')}</p>

        <div className={styles.inputContainer}>
          <input
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('nameModal.placeholder')}
            className={styles.input}
            autoFocus
            maxLength={50}
          />
          {error && <span className={styles.error}>{error}</span>}
        </div>

        <button onClick={handleSubmit} className={styles.button}>
          {t('nameModal.submit')}
        </button>

        <p className={styles.note}>{t('nameModal.note')}</p>
      </div>
    </div>
  );
};
