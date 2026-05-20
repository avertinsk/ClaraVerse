import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Key,
  KeyRound,
  Plus,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Terminal,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Modal, Button } from '@/components/design-system';
import {
  listAPIKeys,
  createAPIKey,
  revokeAPIKey,
  AVAILABLE_SCOPES,
  maskKeyPrefix,
  copyToClipboard,
  type APIKey,
  type CreateAPIKeyRequest,
  type CreateAPIKeyResponse,
} from '@/services/apiKeyService';
import { useIsMobile } from '@/hooks';

interface APIKeysSectionProps {
  className?: string;
}

export function APIKeysSection({ className }: APIKeysSectionProps) {
  const { t } = useTranslation('settings');
  const isMobile = useIsMobile();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<CreateAPIKeyResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['execute:*']);
  const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);

  // Load keys on mount
  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const data = await listAPIKeys();
      setKeys(data);
    } catch (err) {
      console.error('Failed to load API keys:', err);
      setError(t('apiKeys.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      setError(t('apiKeys.keyNameRequired'));
      return;
    }
    if (selectedScopes.length === 0) {
      setError(t('apiKeys.selectScope'));
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const data: CreateAPIKeyRequest = {
        name: newKeyName.trim(),
        description: newKeyDescription.trim(),
        scopes: selectedScopes,
        expiresIn: expiresIn,
      };

      const result = await createAPIKey(data);
      setNewKeyResult(result);

      // Reset form
      setNewKeyName('');
      setNewKeyDescription('');
      setSelectedScopes(['execute:*']);
      setExpiresIn(undefined);
      setShowCreateForm(false);

      // Reload keys list
      await loadKeys();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('apiKeys.createFailed');
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm(t('apiKeys.confirmRevoke'))) {
      return;
    }

    setRevokingId(keyId);
    try {
      await revokeAPIKey(keyId);
      await loadKeys();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('apiKeys.revokeFailed');
      setError(errorMessage);
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyKey = async (keyText: string, keyId?: string) => {
    const success = await copyToClipboard(keyText);
    if (success) {
      if (keyId) {
        setCopiedKeyId(keyId);
        setTimeout(() => setCopiedKeyId(null), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    }
  };

  const handleCopyKeyPrefix = async (keyId: string, keyPrefix: string) => {
    // For the masked version, we copy the masked prefix
    await handleCopyKey(keyPrefix, keyId);
  };

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const closeNewKeyModal = () => {
    setNewKeyResult(null);
    setCopiedKey(false);
  };

  const getKeyIcon = (keyName: string) => {
    const name = keyName.toLowerCase();
    if (name.includes('production') || name.includes('prod')) {
      return { icon: Key, color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
    } else if (name.includes('staging') || name.includes('stage') || name.includes('test')) {
      return { icon: Key, color: 'text-purple-400', bgColor: 'bg-purple-500/10' };
    } else if (name.includes('cli') || name.includes('terminal') || name.includes('command')) {
      return { icon: Terminal, color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
    }
    return { icon: Key, color: 'text-gray-400', bgColor: 'bg-gray-500/10' };
  };

  const formatLastUsedStatus = (lastUsedAt: string | null) => {
    if (!lastUsedAt) {
      return {
        text: t('apiKeys.never'),
        className:
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700',
      };
    }

    const lastUsed = new Date(lastUsedAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return {
        text: t('apiKeys.hoursAgo', { count: diffInHours }),
        className:
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20',
        hasDot: true,
      };
    } else if (diffInHours < 48) {
      return {
        text: t('apiKeys.yesterday'),
        className:
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700',
      };
    } else {
      return {
        text: lastUsed.toLocaleDateString(),
        className:
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700',
      };
    }
  };

  const activeKeys = keys.filter(k => !k.isRevoked);
  const revokedKeys = keys.filter(k => k.isRevoked);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white">
            {t('apiKeys.title')}
          </h1>
          <p className="text-[0.9375rem] font-normal text-[#a1a1aa] leading-relaxed">
            {t('apiKeys.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center gap-2 bg-[#e91e63] hover:bg-[#d81b60] text-white font-medium text-sm px-5 py-2.5 rounded-[0.5rem] transition-colors shadow-lg shadow-[#e91e63]/20"
          >
            <Plus size={20} />
            <span>{t('apiKeys.createKey')}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-[0.5rem] bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-[#161616] rounded-[0.5rem] border border-[#27272a] shadow-sm mb-8 overflow-hidden min-h-[350px] flex flex-col">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex justify-between items-center bg-[#161616]">
          <h3 className="text-base font-semibold text-white">{t('apiKeys.activeKeys')}</h3>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
              {activeKeys.length} {t('apiKeys.active', { count: activeKeys.length })}
            </span>
          </div>
        </div>

        {/* Table Body - flex-1 to take remaining space */}
        <div className="flex-1">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#a1a1aa]" />
            </div>
          ) : (
            <>
              {activeKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center">
                  <div className="bg-[#e91e63]/20 w-16 h-16 rounded-[0.5rem] flex items-center justify-center text-[#e91e63] mb-4">
                    <Key size={32} />
                  </div>
                  <p className="text-[#a1a1aa] text-base">{t('apiKeys.noKeys')}</p>
                  <p className="text-[#a1a1aa] text-sm mt-1">{t('apiKeys.getStarted')}</p>
                </div>
              ) : isMobile ? (
                /* Mobile Card Layout */
                <div className="api-keys-mobile-list p-4 space-y-3">
                  {activeKeys.map(key => {
                    const { icon: Icon, color, bgColor } = getKeyIcon(key.name);
                    const lastUsedStatus = formatLastUsedStatus(key.lastUsedAt || null);

                    return (
                      <div key={key.id} className="api-keys-mobile-card">
                        <div className="api-keys-mobile-card-header">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${bgColor} rounded-[0.5rem] ${color}`}>
                              <Icon size={18} />
                            </div>
                            <span className="api-keys-mobile-card-name">{key.name}</span>
                          </div>
                          {lastUsedStatus.hasDot ? (
                            <span className={lastUsedStatus.className}>
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]"></span>
                              {lastUsedStatus.text}
                            </span>
                          ) : (
                            <span className={lastUsedStatus.className}>{lastUsedStatus.text}</span>
                          )}
                        </div>
                        <div className="api-keys-mobile-card-key">
                          {maskKeyPrefix(key.keyPrefix)}
                        </div>
                        <div className="api-keys-mobile-card-meta">
                          <span>
                            {t('apiKeys.created')}:{' '}
                            {new Date(key.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="api-keys-mobile-card-actions">
                          <button
                            onClick={() => handleRevoke(key.id)}
                            disabled={revokingId === key.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                          >
                            {revokingId === key.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : null}
                            {t('apiKeys.revoke')} Key
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Desktop Table Layout */
                <div className="overflow-x-auto api-keys-table">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#27272a] bg-[#252525]/30">
                        <th className="px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                          {t('apiKeys.name')}
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                          {t('apiKeys.secretKey')}
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                          {t('apiKeys.created')}
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                          {t('apiKeys.lastUsed')}
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider text-right">
                          {t('apiKeys.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeKeys.map(key => {
                        const { icon: Icon, color, bgColor } = getKeyIcon(key.name);
                        const lastUsedStatus = formatLastUsedStatus(key.lastUsedAt || null);
                        const isCopied = copiedKeyId === key.id;

                        return (
                          <tr
                            key={key.id}
                            className="hover:bg-[#252525] transition-colors group border-b border-[#27272a]"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 ${bgColor} rounded-[0.5rem] ${color}`}>
                                  <Icon size={20} />
                                </div>
                                <span className="text-sm font-medium text-white">{key.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                              <span className="text-[#a1a1aa]">{maskKeyPrefix(key.keyPrefix)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a1aa]">
                              {new Date(key.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {lastUsedStatus.hasDot && (
                                <span className={lastUsedStatus.className}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]"></span>
                                  {lastUsedStatus.text}
                                </span>
                              )}
                              {!lastUsedStatus.hasDot && (
                                <span className={lastUsedStatus.className}>
                                  {lastUsedStatus.text}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleRevoke(key.id)}
                                disabled={revokingId === key.id}
                                className="text-[#a1a1aa] hover:text-red-400 font-medium text-sm transition-colors flex items-center justify-end gap-1 ml-auto"
                              >
                                {revokingId === key.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : null}
                                Revoke
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Table Footer - now will always be at bottom */}
        <div className="px-6 py-3 border-t border-[#27272a] flex items-center justify-between bg-[#161616]">
          <span className="text-xs text-[#a1a1aa]">
            {t('apiKeys.showing', { current: activeKeys.length, total: activeKeys.length })}
          </span>
        </div>
      </div>

      {/* Revoked Keys (collapsed section) */}
      {revokedKeys.length > 0 && (
        <details className="mt-6">
          <summary className="text-sm text-[#a1a1aa] cursor-pointer hover:text-[#ededed]">
            {revokedKeys.length} {t('apiKeys.revokedKeys', { count: revokedKeys.length })}
          </summary>
          <div className="mt-3 space-y-2 opacity-60">
            {revokedKeys.map(key => (
              <div
                key={key.id}
                className="p-3 rounded-[0.5rem] bg-[#161616] border border-[#27272a]"
              >
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-[#a1a1aa]" />
                  <span className="text-sm text-[#a1a1aa] line-through">{key.name}</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400">
                      {t('apiKeys.revoked')}
                    </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* How to use section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white px-1">{t('apiKeys.howToUse')}</h2>
        <div className="bg-[#161616] rounded-[0.5rem] border border-[#27272a] shadow-sm p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#e91e63]/10 w-12 h-12 rounded-[0.5rem] flex items-center justify-center text-[#e91e63] shrink-0 border border-[#e91e63]/20">
                  <Terminal size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] bg-[#252525] px-2 py-1 rounded border border-[#27272a]">
                  {t('apiKeys.step1')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{t('apiKeys.createAgent')}</h3>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">
                  {t('apiKeys.createAgentDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 w-12 h-12 rounded-[0.5rem] flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                  <Zap size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] bg-[#252525] px-2 py-1 rounded border border-[#27272a]">
                  {t('apiKeys.step2')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{t('apiKeys.deployAgent')}</h3>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">
                  {t('apiKeys.deployAgentDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-orange-500/10 w-12 h-12 rounded-[0.5rem] flex items-center justify-center text-orange-400 shrink-0 border border-orange-500/20">
                  <Key size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] bg-[#252525] px-2 py-1 rounded border border-[#27272a]">
                  {t('apiKeys.step3')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{t('apiKeys.accessDocs')}</h3>
                <p className="text-[#a1a1aa] text-sm leading-relaxed">
                  {t('apiKeys.accessDocsDesc')}
                  <code className="bg-[#252525] border border-[#27272a] px-1.5 py-0.5 rounded text-xs font-mono text-white">
                    curl
                  </code>{' '}
                  code to utilize your API key.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#27272a] flex justify-end">
            <a
              href="/agents"
              className="text-[#e91e63] hover:text-[#d81b60] text-sm font-medium flex items-center gap-2 transition-colors group"
            >
              <span>{t('apiKeys.goToAgents')}</span>
              <ChevronRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title={
          <span className="flex items-center gap-2">
            <KeyRound size={20} className="text-[#e91e63]" />
            {t('apiKeys.createModalTitle')}
          </span>
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
              {t('apiKeys.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={isCreating || !newKeyName.trim() || selectedScopes.length === 0}
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('apiKeys.creating')}
                </>
              ) : (
                <>
                  <Key size={16} />
                  {t('apiKeys.createBtn')}
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Name */}
          <div className="credential-form-field">
            <label className="field-label">
              {t('apiKeys.keyName')} <span className="required-mark">*</span>
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder={t('apiKeys.keyNamePlaceholder')}
              className="field-input"
            />
          </div>

          {/* Description */}
          <div className="credential-form-field">
            <label className="field-label">{t('apiKeys.description')}</label>
            <textarea
              value={newKeyDescription}
              onChange={e => setNewKeyDescription(e.target.value)}
              placeholder={t('apiKeys.descriptionPlaceholder')}
              rows={3}
              className="field-textarea"
            />
          </div>

          {/* Permissions */}
          <div className="credential-form-field">
            <label className="field-label">{t('apiKeys.permissions')}</label>
            <p className="field-hint">{t('apiKeys.permissionsHint')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {AVAILABLE_SCOPES.map(scope => (
                <label
                  key={scope.value}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope.value)}
                    onChange={() => handleScopeToggle(scope.value)}
                    className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-primary)] accent-[var(--color-accent)]"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {scope.label}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {scope.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div className="credential-form-field">
            <label className="field-label">{t('apiKeys.expiration')}</label>
            <div className="relative">
              <select
                value={expiresIn || ''}
                onChange={e => setExpiresIn(e.target.value ? parseInt(e.target.value) : undefined)}
                className="field-select"
              >
                <option value="">{t('apiKeys.neverExpires')}</option>
                <option value="30">{t('apiKeys.days30')}</option>
                <option value="60">{t('apiKeys.days60')}</option>
                <option value="90">{t('apiKeys.days90')}</option>
                <option value="180">{t('apiKeys.months6')}</option>
                <option value="365">{t('apiKeys.year1')}</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* New Key Result Modal - IMPORTANT: Show full key only once */}
      <Modal
        isOpen={!!newKeyResult}
        onClose={closeNewKeyModal}
        title={
          <span className="flex items-center gap-2">
            <Check size={20} className="text-green-500" />
            {t('apiKeys.keyCreated')}
          </span>
        }
        size="md"
        footer={
          <div className="flex items-center justify-end">
            <Button variant="primary" onClick={closeNewKeyModal}>
              {t('apiKeys.savedKey')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Warning Notice */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text-primary)]">{t('apiKeys.important')}:</strong> {t('apiKeys.copyWarning')}
              </div>
            </div>
          </div>

          {/* API Key Display */}
          <div className="credential-form-field">
            <label className="field-label">{t('apiKeys.apiKeyLabel')}</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text-primary)] break-all">
                {newKeyResult?.key}
              </code>
              <button
                onClick={() => newKeyResult && handleCopyKey(newKeyResult.key)}
                className="p-2.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] transition-colors"
                title={copiedKey ? t('apiKeys.copied') : t('apiKeys.copyToClipboard')}
              >
                {copiedKey ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
