import { useTranslation } from 'react-i18next';

export const About = () => {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">{t('about.title')}</h1>
      <div className="prose prose-lg">
        <p className="text-gray-600">{t('about.desc')}</p>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>{t('about.react')}</li>
          <li>{t('about.vite')}</li>
          <li>{t('about.tailwind')}</li>
          <li>{t('about.router')}</li>
          <li>{t('about.zustand')}</li>
          <li>{t('about.lint')}</li>
        </ul>
      </div>
    </div>
  );
};
