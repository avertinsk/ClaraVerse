import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/design-system/feedback/Modal/Modal';
import { Eye, EyeOff } from 'lucide-react';
import type { ProviderConfig, CreateProviderRequest } from '@/types/admin';

export interface ProviderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProviderRequest) => Promise<void>;
  provider?: ProviderConfig | null;
  mode?: 'create' | 'edit';
}

export const ProviderForm: React.FC<ProviderFormProps> = ({
  isOpen,
  onClose,
  onSave,
  provider = null,
  mode = 'create',
}) => {
  const { t } = useTranslation('admin');
  const [formData, setFormData] = useState<CreateProviderRequest>({
    name: '',
    base_url: '',
    api_key: '',
    enabled: true,
    audio_only: false,
    image_only: false,
    image_edit_only: false,
    secure: false,
    default_model: '',
    system_prompt: '',
    favicon: '',
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (provider) {
        setFormData({
          name: provider.name,
          base_url: provider.base_url,
          api_key: provider.api_key,
          enabled: provider.enabled,
          audio_only: provider.audio_only || false,
          image_only: provider.image_only || false,
          image_edit_only: provider.image_edit_only || false,
          secure: provider.secure || false,
          default_model: provider.default_model || '',
          system_prompt: provider.system_prompt || '',
          favicon: provider.favicon || '',
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          base_url: '',
          api_key: '',
          enabled: true,
          audio_only: false,
          image_only: false,
          image_edit_only: false,
          secure: false,
          default_model: '',
          system_prompt: '',
          favicon: '',
        });
      }
      setErrors({});
      setShowApiKey(false);
    }
  }, [isOpen, provider]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('providerForm.nameRequired');
    } else if (formData.name.length > 255) {
      newErrors.name = t('providerForm.nameTooLong');
    }

    if (!formData.base_url.trim()) {
      newErrors.base_url = t('providerForm.baseUrlRequired');
    } else {
      try {
        new URL(formData.base_url);
      } catch {
        newErrors.base_url = t('providerForm.validUrl');
      }
    }

    if (!formData.api_key.trim()) {
      newErrors.api_key = t('providerForm.apiKeyRequired');
    }

    // Validate that only one special type is selected
    const specialTypes = [formData.audio_only, formData.image_only, formData.image_edit_only];
    const selectedCount = specialTypes.filter(Boolean).length;
    if (selectedCount > 1) {
      newErrors.special_type = t('providerForm.oneSpecialType');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save provider:', error);
      setErrors({ submit: t('providerForm.saveFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpecialTypeChange = (
    type: 'audio_only' | 'image_only' | 'image_edit_only',
    checked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      audio_only: type === 'audio_only' ? checked : false,
      image_only: type === 'image_only' ? checked : false,
      image_edit_only: type === 'image_edit_only' ? checked : false,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('providerForm.addProvider')
          : t('providerForm.editProvider', { name: provider?.name })
      }
      size="lg"
      closeOnBackdrop={false}
      closeOnEscape={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            {t('providerForm.basicInfo')}
          </h4>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
            >
              {t('providerForm.providerName')} *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 bg-[var(--color-surface)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                errors.name ? 'border border-[var(--color-error)]' : ''
              }`}
              placeholder={t('providerForm.namePlaceholder')}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-xs text-[var(--color-error)] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label
              htmlFor="base_url"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
            >
              {t('providerForm.apiBaseUrl')} *
            </label>
            <input
              type="text"
              id="base_url"
              value={formData.base_url}
              onChange={e => setFormData({ ...formData, base_url: e.target.value })}
              className={`w-full px-3 py-2 bg-[var(--color-surface)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                errors.base_url ? 'border border-[var(--color-error)]' : ''
              }`}
              placeholder={t('providerForm.baseUrlPlaceholder')}
              disabled={isSubmitting}
            />
            {errors.base_url && (
              <p className="text-xs text-[var(--color-error)] mt-1">{errors.base_url}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="api_key"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
            >
              {t('providerForm.apiKey')} *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                id="api_key"
                value={formData.api_key}
                onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                className={`w-full px-3 py-2 pr-10 bg-[var(--color-surface)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                  errors.api_key ? 'border border-[var(--color-error)]' : ''
                }`}
                placeholder={t('providerForm.apiKeyPlaceholder')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                tabIndex={-1}
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.api_key && (
              <p className="text-xs text-[var(--color-error)] mt-1">{errors.api_key}</p>
            )}
          </div>
        </div>

        {/* Special Provider Types */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            {t('providerForm.specialType')}
          </h4>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {t('providerForm.specialTypeDesc')}
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.audio_only || false}
                onChange={e => handleSpecialTypeChange('audio_only', e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
                disabled={isSubmitting}
              />
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('providerForm.audioOnly')}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  {t('providerForm.audioOnlyDesc')}
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.image_only || false}
                onChange={e => handleSpecialTypeChange('image_only', e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
                disabled={isSubmitting}
              />
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('providerForm.imageGeneration')}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  {t('providerForm.imageGenerationDesc')}
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.image_edit_only || false}
                onChange={e => handleSpecialTypeChange('image_edit_only', e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
                disabled={isSubmitting}
              />
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('providerForm.imageEditing')}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  {t('providerForm.imageEditingDesc')}
                </div>
              </div>
            </label>
          </div>
          {errors.special_type && (
            <p className="text-xs text-[var(--color-error)] mt-1">{errors.special_type}</p>
          )}
        </div>

        {/* Security & Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            {t('providerForm.securitySettings')}
          </h4>

          <label className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={formData.secure || false}
              onChange={e => setFormData({ ...formData, secure: e.target.checked })}
              className="w-4 h-4 accent-[var(--color-accent)]"
              disabled={isSubmitting}
            />
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {t('providerForm.privateSecure')}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">
                {t('providerForm.privateSecureDesc')}
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 accent-[var(--color-accent)]"
              disabled={isSubmitting}
            />
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {t('providerForm.enabled')}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">
                {t('providerForm.enabledDesc')}
              </div>
            </div>
          </label>
        </div>

        {/* Optional Metadata */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
            {t('providerForm.optionalMetadata')}
          </h4>

          <div>
            <label
              htmlFor="default_model"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
            >
              {t('providerForm.defaultModel')}
            </label>
            <input
              type="text"
              id="default_model"
              value={formData.default_model || ''}
              onChange={e => setFormData({ ...formData, default_model: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder={t('providerForm.defaultModelPlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="favicon"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
            >
              {t('providerForm.faviconUrl')}
            </label>
            <input
              type="text"
              id="favicon"
              value={formData.favicon || ''}
              onChange={e => setFormData({ ...formData, favicon: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder={t('providerForm.faviconPlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="system_prompt"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
            >
              {t('providerForm.systemPrompt')}
            </label>
            <textarea
              id="system_prompt"
              value={formData.system_prompt || ''}
              onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
              placeholder={t('providerForm.systemPromptPlaceholder')}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Form Actions */}
        {errors.submit && (
          <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-3 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-surface-hover)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors disabled:opacity-50"
          >
            {t('common.actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? t('providerForm.saving')
              : mode === 'create'
                ? t('providerForm.createProvider')
                : t('providerForm.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
