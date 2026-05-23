import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, AlertCircle } from 'lucide-react';
import { fetchModels } from '@/services/modelService';
import {
  fetchSystemModelAssignments,
  updateSystemModelAssignments,
  type SystemModelAssignments,
} from '@/services/systemModelsService';
import { toast } from '@/store/useToastStore';
import type { Model } from '@/types/websocket';

export const SystemModels = () => {
  const { t } = useTranslation('admin');
  const [models, setModels] = useState<Model[]>([]);
  const [assignments, setAssignments] = useState<SystemModelAssignments>({
    tool_selector: '',
    memory_extractor: '',
    title_generator: '',
    workflow_validator: '',
    agent_default: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [modelsData, assignmentsData] = await Promise.all([
        fetchModels(true),
        fetchSystemModelAssignments(),
      ]);
      setModels(modelsData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Failed to load system models:', error);
      toast.error(t('systemModels.errorLoad'), 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSystemModelAssignments(assignments);
      toast.success(t('systemModels.saveSuccess'), 'Success');
    } catch (error) {
      console.error('Failed to save system models:', error);
      toast.error(t('systemModels.saveError'), 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof SystemModelAssignments, value: string) => {
    setAssignments(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          {t('nav.systemModels')}
        </h1>
        <p className="text-[var(--color-text-secondary)]">{t('dashboard.loading')}</p>
      </div>
    );
  }

  const assignmentFields: Array<{
    key: keyof SystemModelAssignments;
    label: string;
    description: string;
  }> = [
    {
      key: 'tool_selector',
      label: t('systemModels.toolSelector'),
      description: t('systemModels.toolSelectorDesc'),
    },
    {
      key: 'memory_extractor',
      label: t('systemModels.memoryExtractor'),
      description: t('systemModels.memoryExtractorDesc'),
    },
    {
      key: 'title_generator',
      label: t('systemModels.titleGenerator'),
      description: t('systemModels.titleGeneratorDesc'),
    },
    {
      key: 'workflow_validator',
      label: t('systemModels.workflowValidator'),
      description: t('systemModels.workflowValidatorDesc'),
    },
    {
      key: 'agent_default',
      label: t('systemModels.agentDefault'),
      description: t('systemModels.agentDefaultDesc'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          {t('systemModels.title')}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2">{t('systemModels.subtitle')}</p>
      </div>

      {/* Info Banner */}
      <div
        className="bg-[var(--color-info-bg)] border border-[var(--color-info)] rounded-lg p-4 flex items-start gap-3"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <AlertCircle size={20} className="text-[var(--color-info)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[var(--color-text-primary)] font-medium">
            {t('systemModels.adminOverride')}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t('systemModels.overrideDesc')}
          </p>
        </div>
      </div>

      {/* Assignment Form */}
      <div
        className="bg-[var(--color-surface)] rounded-lg p-6 space-y-6"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {assignmentFields.map(field => (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              {field.label}
            </label>
            <p className="text-xs text-[var(--color-text-tertiary)]">{field.description}</p>
            <select
              value={assignments[field.key]}
              onChange={e => handleChange(field.key, e.target.value)}
              className="w-full px-4 py-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            >
              <option value="">{t('systemModels.useDefaultPool')}</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.providerName})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={loadData}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] rounded-lg hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('systemModels.reset')}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save size={16} />
          {isSaving ? t('e2b.saving') : t('e2b.save')}
        </button>
      </div>
    </div>
  );
};
