import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/design-system';
import { Input } from '@/components/design-system';
import { authService } from '@/services/authService';
import './Onboarding.css';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError(t('validation.passwordsMismatch'));
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError(t('validation.passwordMinLength'));
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await authService.updatePassword(newPassword);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Success
      setIsSuccess(true);
      setError(null);

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch {
      setError(t('error.unexpectedError'));
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      {/* Left side: Single image (60%) */}
      <div className="onboarding-left">
        <div className="onboarding-image-container">
          <img src="/image-1.webp" alt="ClaraVerse" className="onboarding-image" />
        </div>
      </div>

      {/* Right side: Reset Password Form (40%) */}
      <div className="onboarding-auth">
        <div className="auth-form-container">
          <div className="auth-form-content">
            <div className="auth-form-header">
              <h2>{isSuccess ? t('passwordUpdated') : t('setNewPassword')}</h2>
              <p>{isSuccess ? t('passwordUpdatedRedirect') : t('enterNewPassword')}</p>
            </div>

            {error && <div className="auth-form-error">{error}</div>}
            {isSuccess && <div className="auth-form-success">{t('passwordSuccessRedirect')}</div>}

            {!isSuccess && (
              <form onSubmit={handleSubmit} className="auth-form-fields">
                <Input
                  type="password"
                  placeholder={t('newPassword')}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />

                <Input
                  type="password"
                  placeholder={t('confirmNewPassword')}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="auth-submit-button"
                >
                  {isLoading ? t('updatingPassword') : t('updatePassword')}
                </Button>
              </form>
            )}

            <div className="auth-form-footer">
              <p>
                {t('rememberPassword')}{' '}
                <button
                  type="button"
                  className="auth-toggle-button"
                  onClick={() => navigate('/signin')}
                  disabled={isLoading || isSuccess}
                >
                  {t('signIn')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
