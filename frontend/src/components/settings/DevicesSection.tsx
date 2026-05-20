import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, MoreVertical, Edit2, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import {
  listDevices,
  renameDevice,
  revokeDevice,
  getPlatformName,
  getPlatformEmoji,
  formatRelativeTime,
  type DeviceInfo,
} from '@/services/deviceService';
import { toast } from '@/store/useToastStore';
import styles from './DevicesSection.module.css';

export const DevicesSection = () => {
  const { t } = useTranslation('settings');
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listDevices();
      setDevices(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('devices.loadFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRename = async () => {
    if (!renaming) return;

    try {
      await renameDevice(renaming.id, renaming.name);
      toast.success(t('devices.renamedSuccess'));
      setRenaming(null);
      fetchDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('devices.renamedFailed');
      toast.error(message);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    setRevoking(deviceId);
    try {
      await revokeDevice(deviceId);
      toast.success(t('devices.revokedSuccess'));
      fetchDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('devices.revokedFailed');
      toast.error(message);
    } finally {
      setRevoking(null);
    }
  };

  const openRenameModal = (device: DeviceInfo) => {
    setRenaming({ id: device.device_id, name: device.name });
    setActiveMenu(null);
  };

  const confirmRevoke = (device: DeviceInfo) => {
    setActiveMenu(null);
      if (device.is_current) {
        if (confirm(t('devices.confirmRevokeCurrent'))) {
          handleRevoke(device.device_id);
        }
      } else {
        if (confirm(t('devices.confirmRevoke', { name: device.name }))) {
          handleRevoke(device.device_id);
        }
      }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Smartphone className={styles.titleIcon} />
            {t('devices.title')}
          </h2>
        </div>
        <div className={styles.loading}>
          <RefreshCw className={styles.spinner} />
          <span>{t('devices.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Smartphone className={styles.titleIcon} />
            {t('devices.title')}
          </h2>
        </div>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchDevices} className={styles.retryButton}>
            <RefreshCw size={16} />
            {t('devices.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <Smartphone className={styles.titleIcon} />
            {t('devices.title')}
          </h2>
          <p className={styles.description}>
            {t('devices.description')}
          </p>
        </div>
        <button onClick={fetchDevices} className={styles.refreshButton} title={t('devices.refresh')}>
          <RefreshCw size={16} />
        </button>
      </div>

      {devices.length === 0 ? (
        <div className={styles.empty}>
          <Smartphone className={styles.emptyIcon} />
          <h3>{t('devices.noDevices')}</h3>
          <p>{t('devices.noDevicesDesc')}</p>
          <a
            href="https://docs.claraverse.ai/cli"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docsLink}
          >
            <ExternalLink size={14} />
            {t('devices.viewDocs')}
          </a>
        </div>
      ) : (
        <div className={styles.deviceList}>
          {devices.map(device => (
            <div
              key={device.device_id}
              className={`${styles.deviceCard} ${device.is_current ? styles.current : ''} ${!device.is_active ? styles.inactive : ''}`}
            >
              <div className={styles.deviceMain}>
                <span className={styles.platformEmoji}>{getPlatformEmoji(device.platform)}</span>
                <div className={styles.deviceInfo}>
                  <div className={styles.deviceName}>
                    {device.name}
                    {device.is_current && <span className={styles.currentBadge}>{t('devices.thisDevice')}</span>}
                    {!device.is_active && <span className={styles.inactiveBadge}>{t('devices.revoked')}</span>}
                  </div>
                  <div className={styles.deviceMeta}>
                    <span>{getPlatformName(device.platform)}</span>
                    <span className={styles.separator}>&bull;</span>
                    <span>v{device.client_version}</span>
                  </div>
                  <div className={styles.deviceActivity}>
                    <span>{t('devices.lastActive', { time: formatRelativeTime(device.last_active_at) })}</span>
                    {device.last_location && (
                      <>
                        <span className={styles.separator}>&bull;</span>
                        <span>{device.last_location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.deviceActions}>
                <button
                  className={styles.menuButton}
                  onClick={() =>
                    setActiveMenu(activeMenu === device.device_id ? null : device.device_id)
                  }
                  aria-label={t('devices.options')}
                >
                  <MoreVertical size={18} />
                </button>

                {activeMenu === device.device_id && (
                  <div className={styles.dropdown}>
                    <button className={styles.dropdownItem} onClick={() => openRenameModal(device)}>
                      <Edit2 size={14} />
                      {t('devices.rename')}
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${styles.danger}`}
                      onClick={() => confirmRevoke(device)}
                      disabled={revoking === device.device_id}
                    >
                      <Trash2 size={14} />
                      {revoking === device.device_id ? t('devices.revoking') : t('devices.revoke')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {renaming && (
        <div className={styles.modalBackdrop} onClick={() => setRenaming(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{t('devices.renameTitle')}</h3>
            <input
              type="text"
              value={renaming.name}
              onChange={e => setRenaming({ ...renaming, name: e.target.value })}
              maxLength={50}
              autoFocus
              className={styles.renameInput}
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setRenaming(null)}>
                {t('devices.cancel')}
              </button>
              <button
                className={styles.saveButton}
                onClick={handleRename}
                disabled={!renaming.name.trim()}
              >
                {t('devices.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.footerNote}>
          {t('devices.footerNote')}
        </p>
      </div>
    </div>
  );
};
