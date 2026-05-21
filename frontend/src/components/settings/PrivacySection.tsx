import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HardDrive, Cloud, Lock, Shield, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export interface PrivacySectionProps {
  /** Callback when settings change */
  onSave?: () => void;
}

/**
 * Privacy settings section component.
 * Allows users to choose between local and cloud storage for their chats.
 */
export const PrivacySection: React.FC<PrivacySectionProps> = ({ onSave }) => {
  const { t } = useTranslation('settings');
  const { chatPrivacyMode, setChatPrivacyMode } = useSettingsStore();

  const handlePrivacyModeChange = (mode: 'local' | 'cloud') => {
    setChatPrivacyMode(mode);
    onSave?.();
  };

  return (
    <section className="settings-section privacy-section">
      <header className="privacy-header">
        <div className="privacy-title-section">
          <h1 className="privacy-main-title">{t('privacy.title')}</h1>
          <p className="privacy-subtitle">{t('privacy.subtitle')}</p>
        </div>
      </header>

      {/* Chat Storage Section */}
      <h2 className="privacy-subsection-title">{t('privacy.whereSaved')}</h2>
      <p className="privacy-subsection-description">{t('privacy.chooseStorage')}</p>

      <div className="privacy-options-container">
        <button
          className={`privacy-option-card ${chatPrivacyMode === 'local' ? 'selected' : ''}`}
          onClick={() => handlePrivacyModeChange('local')}
          type="button"
        >
          <div className="privacy-option-icon-wrapper">
            <HardDrive size={24} />
          </div>
          <div className="privacy-option-content">
            <h3 className="privacy-option-title">{t('privacy.thisDevice')}</h3>
            <p className="privacy-option-description">{t('privacy.thisDeviceDesc')}</p>
            {chatPrivacyMode === 'local' && (
              <p className="privacy-option-warning">
                <AlertTriangle size={12} />
                <span>{t('privacy.deviceWarning')}</span>
              </p>
            )}
          </div>
          {chatPrivacyMode === 'local' && (
            <div className="privacy-checkmark">
              <Check size={14} />
            </div>
          )}
        </button>

        <button
          className={`privacy-option-card ${chatPrivacyMode === 'cloud' ? 'selected' : ''}`}
          onClick={() => handlePrivacyModeChange('cloud')}
          type="button"
        >
          <div className="privacy-option-icon-wrapper">
            <Cloud size={24} />
          </div>
          <div className="privacy-option-content">
            <h3 className="privacy-option-title">{t('privacy.syncDevices')}</h3>
            <p className="privacy-option-description">{t('privacy.syncDevicesDesc')}</p>
          </div>
          {chatPrivacyMode === 'cloud' && (
            <div className="privacy-checkmark">
              <Check size={14} />
            </div>
          )}
        </button>
      </div>

      <p className="privacy-note">
        <Lock size={14} />
        {t('privacy.encrypted')}
      </p>

      <div className="mobile-privacy-policy-link">
        <Link to="/privacy" className="account-link-btn">
          <Shield size={16} />
          {t('privacy.viewPolicy')}
          <ExternalLink size={14} />
        </Link>
      </div>
    </section>
  );
};
