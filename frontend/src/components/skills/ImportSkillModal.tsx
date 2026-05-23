import { useState } from 'react';
import { Upload, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Textarea, Tabs } from '@/components/design-system';
import type { Skill } from '@/services/skillService';

interface ImportSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (skill: Skill) => void;
  importFromSkillMD: (content: string) => Promise<Skill>;
  importFromGitHub: (url: string) => Promise<Skill>;
}

export const ImportSkillModal = ({
  isOpen,
  onClose,
  onImported,
  importFromSkillMD,
  importFromGitHub,
}: ImportSkillModalProps) => {
  const { t } = useTranslation('skills');
  const [activeTab, setActiveTab] = useState('paste');
  const [content, setContent] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setContent('');
    setGithubUrl('');
    setError(null);
  };

  const handleImportPaste = async () => {
    if (!content.trim()) {
      setError(t('importSkill.errorPaste'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const skill = await importFromSkillMD(content.trim());
      onImported(skill);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('importSkill.errorFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportGitHub = async () => {
    if (!githubUrl.trim()) {
      setError(t('importSkill.errorUrl'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const skill = await importFromGitHub(githubUrl.trim());
      onImported(skill);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('importSkill.errorFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={18} /> {t('importSkill.title')}
        </span>
      }
      size="lg"
    >
      <div className="import-skill-modal">
        <Tabs
          tabs={[
            { id: 'paste', label: t('importSkill.tabPaste'), icon: <Upload size={14} /> },
            { id: 'github', label: t('importSkill.tabGitHub'), icon: <Github size={14} /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {error && <div className="create-skill-error">{error}</div>}

        {activeTab === 'paste' && (
          <div className="import-skill-tab">
            <p className="import-skill-hint">{t('importSkill.pasteHint')}</p>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t('importSkill.pastePlaceholder')}
              rows={12}
            />
            <Button
              variant="primary"
              onClick={handleImportPaste}
              disabled={submitting || !content.trim()}
              style={{ alignSelf: 'flex-end' }}
            >
              {submitting ? t('importSkill.importing') : t('importSkill.importBtn')}
            </Button>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="import-skill-tab">
            <p className="import-skill-hint">{t('importSkill.githubHint')}</p>
            <Input
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              placeholder={t('importSkill.githubPlaceholder')}
            />
            <Button
              variant="primary"
              onClick={handleImportGitHub}
              disabled={submitting || !githubUrl.trim()}
              style={{ alignSelf: 'flex-end' }}
            >
              {submitting ? t('importSkill.importing') : t('importSkill.importFromGitHub')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
