import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

export const Home = () => {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">{t('home.welcome')}</h1>
      <p className="text-lg text-gray-600">{t('home.desc')}</p>
      <div className="flex gap-4">
        <Button variant="primary">{t('home.getStarted')}</Button>
        <Button variant="outline">{t('home.learnMore')}</Button>
      </div>
    </div>
  );
};
