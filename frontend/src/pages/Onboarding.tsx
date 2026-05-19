import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthForm } from '@/components/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import './Onboarding.css';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isAdmin, sessionExpiredReason, clearSessionExpiredReason } =
    useAuthStore();
  const { t } = useTranslation('auth');

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    // If session expired, show toast and clear the reason
    if (sessionExpiredReason) {
      toast.error(sessionExpiredReason, t('sessionExpired'));
      clearSessionExpiredReason();
    }
  }, [sessionExpiredReason, clearSessionExpiredReason, t]);

  useEffect(() => {
    // If user is already authenticated, redirect based on admin status
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectUrl);
      }
    }
  }, [isAuthenticated, isAdmin, navigate, redirectUrl]);

  return (
    <div className="onboarding-container">
      {/* Left side: Single image (60%) */}
      <div className="onboarding-left">
        <div className="onboarding-image-container">
          <img src="/image-1.webp" alt="ClaraVerse" className="onboarding-image" />
        </div>
      </div>

      {/* Right side: Auth Form (40%) */}
      <div className="onboarding-auth">
        <AuthForm defaultMode="signin" redirectUrl={redirectUrl} />
      </div>
    </div>
  );
};
