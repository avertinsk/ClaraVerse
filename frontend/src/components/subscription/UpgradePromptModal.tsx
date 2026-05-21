import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/design-system/feedback/Modal/Modal';
import { Button } from '@/components/design-system/Button/Button';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { formatMonthlyPrice } from '@/types/subscription';

export function UpgradePromptModal() {
  const { t } = useTranslation('subscription');
  const { limitExceeded, clearLimitExceeded, plans, createCheckout, subscription } =
    useSubscriptionStore();

  if (!limitExceeded) return null;

  const currentTier = subscription?.tier || 'free';
  const currentPlan = plans?.find(p => p.tier === currentTier);
  const suggestedPlan = plans?.find(p => p.tier === limitExceeded.suggestedTier);

  const limitTypeDisplayMap: Record<string, { label: string; icon: string; unit: string }> = {
    messages: { label: t('upgrade.messagesLabel'), icon: '💬', unit: t('upgrade.perMonth') },
    file_uploads: { label: t('upgrade.fileUploadsLabel'), icon: '📎', unit: t('upgrade.perDay') },
    image_generations: {
      label: t('upgrade.imageGensLabel'),
      icon: '🎨',
      unit: t('upgrade.perDay'),
    },
  };
  const limitTypeDisplay = limitTypeDisplayMap[limitExceeded.type];

  // Unknown limit type (e.g. anonymous) — don't render the upgrade modal
  if (!limitTypeDisplay) return null;

  // Calculate multiplier
  const currentLimit = limitExceeded.limit;
  const suggestedLimit =
    suggestedPlan?.limits?.[
      limitExceeded.type === 'messages'
        ? 'MaxMessagesPerMonth'
        : limitExceeded.type === 'file_uploads'
          ? 'MaxFileUploadsPerDay'
          : 'MaxImageGensPerDay'
    ];

  let multiplier: string;
  if (suggestedLimit === -1) {
    multiplier = '∞';
  } else if (currentLimit > 0 && suggestedLimit) {
    const ratio = Math.floor(suggestedLimit / currentLimit);
    multiplier = `${ratio}x`;
  } else {
    multiplier = '10x'; // Fallback
  }

  const handleUpgrade = async () => {
    if (!suggestedPlan) return;

    const checkoutUrl = await createCheckout(suggestedPlan.id);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={clearLimitExceeded}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <span className="text-2xl">{limitTypeDisplay.icon}</span>
          <span>{t('upgrade.limitReached', { type: limitTypeDisplay.label })}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Current Usage Display */}
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            {t('upgrade.usedAll', {
              limit: limitExceeded.limit,
              type: limitTypeDisplay.label.toLowerCase(),
              plan: currentPlan?.name || 'current',
            })}
          </p>
          <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-2.5 mb-2">
            <div
              className="bg-red-600 dark:bg-red-500 h-2.5 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">
            {t('upgrade.resetsAt', { date: new Date(limitExceeded.resetAt).toLocaleString() })}
          </p>
        </div>

        {/* Upgrade Comparison */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t('upgrade.upgradeTo', {
              plan: suggestedPlan?.name,
              multiplier,
              type: limitTypeDisplay.label,
            })}
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                {t('upgrade.currentPlan', { plan: currentPlan?.name || 'Current' })}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {limitExceeded.limit}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {limitTypeDisplay.unit}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-2">
                {suggestedPlan?.name} Plan
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {suggestedLimit === -1 ? (
                  <span>{t('upgrade.unlimited')}</span>
                ) : (
                  <>
                    {suggestedLimit}
                    <span className="text-sm text-blue-500 dark:text-blue-300">
                      {limitTypeDisplay.unit}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          {suggestedPlan?.features && suggestedPlan.features.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                {t('upgrade.plusGet')}
              </p>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                {suggestedPlan.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-500">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={handleUpgrade}>
            {t('upgrade.upgradeTo', {
              plan: suggestedPlan?.name,
              multiplier: formatMonthlyPrice(suggestedPlan?.price_monthly || 0),
              type: limitTypeDisplay.label,
            })}
          </Button>
          <Button variant="ghost" size="lg" onClick={clearLimitExceeded}>
            {t('upgrade.maybeLater')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
