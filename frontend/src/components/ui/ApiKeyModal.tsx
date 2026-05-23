import React, { useState } from 'react';
import { X, Key, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '@/components/design-system';
import styles from './ApiKeyModal.module.css';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string, rememberSession: boolean) => void;
  providerName: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  providerName,
}) => {
  const { t } = useTranslation('ui');
  const [apiKey, setApiKey] = useState('');
  const [rememberSession, setRememberSession] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim(), rememberSession);
      setApiKey('');
      setRememberSession(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <div className={styles.iconWrapper}>
              <Key size={20} />
            </div>
            <h2 className={styles.title}>{t('apiKeyModal.title')}</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          <p
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: t('apiKeyModal.description', { providerName }) }}
          />

          <div className={styles.inputGroup}>
            <Input
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={t('apiKeyModal.placeholder')}
              type="password"
              autoFocus
            />
          </div>

          <div className={styles.options}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={e => setRememberSession(e.target.checked)}
              />
              <span>{t('apiKeyModal.rememberSession')}</span>
            </label>
          </div>

          <div className={styles.securityNote}>
            <Shield size={14} />
            <span>
              {rememberSession
                ? t('apiKeyModal.securityNoteSession')
                : t('apiKeyModal.securityNoteOnce')}
            </span>
          </div>

          <div className={styles.actions}>
            <Button variant="ghost" onClick={onClose} type="button">
              {t('apiKeyModal.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={!apiKey.trim()}>
              {t('apiKeyModal.continue')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
