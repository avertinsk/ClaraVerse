import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, AlertTriangle, Calendar, Zap, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Spinner } from '@/components/design-system';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import {
  formatMonthlyPrice,
  formatPrice,
  getTierDisplayName,
  isUpgrade,
  SubscriptionTier,
  type Plan,
  type Subscription,
  type PlanChangePreview,
  type SubscriptionTierType,
} from '@/types/subscription';
import { toast } from '@/store/useToastStore';
import './PlanChangeModal.css';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: Plan | null;
  targetPlan: Plan | null;
  subscription: Subscription | null;
}

export const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  targetPlan,
  subscription,
}) => {
  const { t } = useTranslation('settings');
  const { createCheckout, changePlan, previewPlanChange, isChangingPlan } = useSubscriptionStore();
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch preview when modal opens
  useEffect(() => {
    if (isOpen && targetPlan) {
      setIsLoadingPreview(true);
      previewPlanChange(targetPlan.id)
        .then(p => setPreview(p))
        .finally(() => setIsLoadingPreview(false));
    } else {
      setPreview(null);
    }
  }, [isOpen, targetPlan, previewPlanChange]);

  if (!currentPlan || !targetPlan) return null;

  const isUpgradeAction = isUpgrade(
    currentPlan.tier as SubscriptionTierType,
    targetPlan.tier as SubscriptionTierType
  );

  const handleConfirm = async () => {
    // Check if user has an active paid subscription (not free tier)
    const hasPaidSubscription =
      subscription?.dodo_subscription_id && subscription?.tier !== SubscriptionTier.FREE;

    if (isUpgradeAction) {
      if (hasPaidSubscription) {
        // For upgrades from paid tier (e.g., Pro → Pro+), use changePlan for proration
        const success = await changePlan(targetPlan.id);
        if (success) {
          toast.success(`Your plan has been upgraded to ${getTierDisplayName(targetPlan.tier)}!`);
          onClose();
        } else {
          toast.error('Failed to upgrade plan');
        }
      } else {
        // For upgrades from free tier, create new checkout session
        const checkoutUrl = await createCheckout(targetPlan.id);
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          toast.error('Failed to create checkout session');
        }
      }
    } else {
      // For downgrades, schedule the change (effective at period end)
      const success = await changePlan(targetPlan.id);
      if (success) {
        toast.success(
          `Your plan will change to ${getTierDisplayName(targetPlan.tier)} at the end of your billing period.`
        );
        onClose();
      } else {
        toast.error('Failed to schedule plan change');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {isUpgradeAction ? (
            <Zap size={20} className="text-[#e91e63]" />
          ) : (
            <CreditCard size={20} className="text-[#e91e63]" />
          )}
          {isUpgradeAction ? t('planChange.upgrade') : t('planChange.change')}
        </span>
      }
      size="md"
      footer={
        <div className="plan-modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={isChangingPlan}>
            Cancel
          </Button>
          <Button
            variant={isUpgradeAction ? 'primary' : 'secondary'}
            onClick={handleConfirm}
            disabled={isChangingPlan || isLoadingPreview}
          >
            {isChangingPlan ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('planChange.processing')}
              </>
            ) : isUpgradeAction ? (
              <>
                <Zap size={16} />
                {t('planChange.upgradeNow')}
              </>
            ) : (
              t('planChange.confirmDowngrade')
            )}
          </Button>
        </div>
      }
    >
      <div className="plan-change-modal">
        {isLoadingPreview ? (
          <div className="plan-modal-loading">
            <Spinner size="md" />
            <p>{t('planChange.loading')}</p>
          </div>
        ) : (
          <>
            {/* Plan Comparison */}
            <div className="plan-comparison">
              <div className="plan-compare-item plan-compare-from">
                <span className="compare-label">{t('planChange.currentPlan')}</span>
                <h4 className="compare-plan-name">{currentPlan.name}</h4>
                <span className="compare-price">
                  {formatMonthlyPrice(currentPlan.price_monthly)}
                </span>
              </div>

              <div className="plan-compare-arrow">
                <ArrowRight size={24} />
              </div>

              <div className="plan-compare-item plan-compare-to">
                <span className="compare-label">{t('planChange.newPlan')}</span>
                <h4 className="compare-plan-name">{targetPlan.name}</h4>
                <span className="compare-price">
                  {formatMonthlyPrice(targetPlan.price_monthly)}
                </span>
              </div>
            </div>

            {/* Change Details */}
            <div className="plan-change-details">
              {isUpgradeAction ? (
                <div className="change-info upgrade-info">
                  <div className="change-info-icon">
                    <Zap size={20} />
                  </div>
                  <div className="change-info-content">
                    <h5>{t('planChange.immediateUpgrade')}</h5>
                    <p>{t('planChange.immediateUpgradeDesc')}</p>
                    {preview?.prorated_amount !== undefined && preview.prorated_amount > 0 && (
                      <div className="proration-amount">
                        <span>{t('planChange.proratedCharge')}:</span>
                        <strong>{formatPrice(preview.prorated_amount)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="change-info downgrade-info">
                  <div className="change-info-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="change-info-content">
                    <h5>{t('planChange.scheduledDowngrade')}</h5>
                    <p>{t('planChange.scheduledDowngradeDesc', { planName: currentPlan.name })}</p>
                    {preview?.effective_at && (
                      <div className="effective-date">
                        <span>{t('planChange.effectiveDate')}:</span>
                        <strong>{new Date(preview.effective_at).toLocaleDateString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning for downgrades */}
              {!isUpgradeAction && (
                <div className="downgrade-warning">
                  <AlertTriangle size={16} />
                  <span>{t('planChange.downgradeWarning')}</span>
                </div>
              )}
            </div>

            {/* Feature Comparison */}
            <div className="feature-comparison">
              <h5>{t('planChange.whatChanges')}</h5>
              <div className="feature-diff">
                <div className="feature-diff-item">
                  <span className="diff-label">{t('planChange.schedules')}</span>
                  <span className="diff-change">
                    {currentPlan.limits.maxSchedules === -1
                      ? t('planChange.unlimited')
                      : currentPlan.limits.maxSchedules}
                    {' → '}
                    {targetPlan.limits.maxSchedules === -1
                      ? t('planChange.unlimited')
                      : targetPlan.limits.maxSchedules}
                  </span>
                </div>
                <div className="feature-diff-item">
                  <span className="diff-label">{t('planChange.apiKeys')}</span>
                  <span className="diff-change">
                    {currentPlan.limits.maxApiKeys === -1
                      ? t('planChange.unlimited')
                      : currentPlan.limits.maxApiKeys}
                    {' → '}
                    {targetPlan.limits.maxApiKeys === -1
                      ? t('planChange.unlimited')
                      : targetPlan.limits.maxApiKeys}
                  </span>
                </div>
                <div className="feature-diff-item">
                  <span className="diff-label">{t('planChange.executionsPerDay')}</span>
                  <span className="diff-change">
                    {currentPlan.limits.maxExecutionsPerDay === -1
                      ? t('planChange.unlimited')
                      : currentPlan.limits.maxExecutionsPerDay}
                    {' → '}
                    {targetPlan.limits.maxExecutionsPerDay === -1
                      ? t('planChange.unlimited')
                      : targetPlan.limits.maxExecutionsPerDay}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PlanChangeModal;
