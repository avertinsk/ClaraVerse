/**
 * BadgeInfoModal Component
 *
 * A small modal that appears when clicking on model badges (shield, image, tier dots)
 * to explain what each badge means.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, Image, Sparkles, Zap, Star, FlaskConical } from 'lucide-react';
import styles from './BadgeInfoModal.module.css';

export type BadgeType = 'secure' | 'vision' | 'top' | 'medium' | 'fastest' | 'new';

interface BadgeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeType: BadgeType;
  anchorRect?: DOMRect | null;
}

const badgeInfo: Record<
  BadgeType,
  { icon: React.ReactNode; titleKey: string; descKey: string; color: string }
> = {
  secure: {
    icon: <Shield size={20} />,
    titleKey: 'badgeInfo.secure.title',
    descKey: 'badgeInfo.secure.desc',
    color: 'var(--color-success, #22c55e)',
  },
  vision: {
    icon: <Image size={20} />,
    titleKey: 'badgeInfo.vision.title',
    descKey: 'badgeInfo.vision.desc',
    color: 'var(--color-accent)',
  },
  top: {
    icon: <Star size={20} />,
    titleKey: 'badgeInfo.top.title',
    descKey: 'badgeInfo.top.desc',
    color: '#f59e0b',
  },
  medium: {
    icon: <Sparkles size={20} />,
    titleKey: 'badgeInfo.medium.title',
    descKey: 'badgeInfo.medium.desc',
    color: '#8b5cf6',
  },
  fastest: {
    icon: <Zap size={20} />,
    titleKey: 'badgeInfo.fastest.title',
    descKey: 'badgeInfo.fastest.desc',
    color: '#06b6d4',
  },
  new: {
    icon: <FlaskConical size={20} />,
    titleKey: 'badgeInfo.new.title',
    descKey: 'badgeInfo.new.desc',
    color: '#10b981',
  },
};

export function BadgeInfoModal({ isOpen, onClose, badgeType, anchorRect }: BadgeInfoModalProps) {
  const { t } = useTranslation('ui');
  const modalRef = useRef<HTMLDivElement>(null);
  const info = badgeInfo[badgeType];

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      // Delay to prevent immediate close from the same click that opened it
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate position based on anchor element
  let modalStyle: React.CSSProperties = {};
  if (anchorRect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = 280;
    const modalHeight = 180;

    let top = anchorRect.bottom + 8;
    let left = anchorRect.left + anchorRect.width / 2 - modalWidth / 2;

    // Adjust if going off right edge
    if (left + modalWidth > viewportWidth - 16) {
      left = viewportWidth - modalWidth - 16;
    }
    // Adjust if going off left edge
    if (left < 16) {
      left = 16;
    }
    // Show above if going off bottom
    if (top + modalHeight > viewportHeight - 16) {
      top = anchorRect.top - modalHeight - 8;
    }

    modalStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        style={modalStyle}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className={styles.closeButton} aria-label="Close">
          <X size={14} />
        </button>
        <div className={styles.content}>
          <div className={styles.iconWrapper} style={{ color: info.color }}>
            {info.icon}
          </div>
          <h3 className={styles.title}>{t(info.titleKey)}</h3>
          <p className={styles.description}>{t(info.descKey)}</p>
        </div>
      </div>
    </div>
  );
}
