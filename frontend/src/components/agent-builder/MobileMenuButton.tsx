import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function MobileMenuButton({ isOpen, onToggle, className }: MobileMenuButtonProps) {
  const { t } = useTranslation('agents');
  return (
    <button
      onClick={onToggle}
      className={cn(
        'fixed top-4 left-4 z-50 p-2.5 rounded-xl',
        'bg-[var(--color-surface-elevated)] border border-[var(--color-border)]',
        'shadow-lg backdrop-blur-sm',
        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        'transition-all duration-200',
        'active:scale-95',
        className
      )}
      aria-label={isOpen ? t('mobileMenu.closeMenu') : t('mobileMenu.openMenu')}
      aria-expanded={isOpen}
    >
      {isOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  );
}
