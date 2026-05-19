import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  KeyRound,
  Key,
  Activity,
  Shield,
  User,
  Home,
  MessageSquare,
  Radio,
  Smartphone,
} from 'lucide-react';
import { Sidebar, type NavItem, type FooterLink } from '@/components/ui/Sidebar';
import type { SettingsTab } from './SettingsLayout';

/** Footer links for settings - Home and Chats */
const SETTINGS_FOOTER_LINKS: FooterLink[] = [
  { href: '/', label: 'Home', icon: Home, ariaLabel: 'Navigate to home' },
  { href: '/chat', label: 'Chats', icon: MessageSquare, ariaLabel: 'Navigate to chats' },
];

export interface SettingsSidebarProps {
  /** Currently active tab */
  activeTab: SettingsTab;
  /** Callback when tab changes */
  onTabChange: (tab: SettingsTab) => void;
  /** External control: is sidebar open */
  isOpen?: boolean;
  /** External control: callback when sidebar should open/close */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Settings-specific sidebar wrapper around the base Sidebar component.
 * Configures navigation items for the 6 settings tabs.
 * Home and Chats are in the sidebar footer (bottom buttons).
 */
export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onOpenChange,
}) => {
  const { t } = useTranslation('settings');

  const navItems: NavItem[] = [
    {
      id: 'ai',
      label: t('settings.nav.ai'),
      icon: Bot,
      isActive: activeTab === 'ai',
      onClick: () => onTabChange('ai'),
    },
    {
      id: 'api-keys',
      label: t('settings.nav.apiKeys'),
      icon: KeyRound,
      isActive: activeTab === 'api-keys',
      onClick: () => onTabChange('api-keys'),
    },
    {
      id: 'credentials',
      label: t('settings.nav.integrations'),
      icon: Key,
      isActive: activeTab === 'credentials',
      onClick: () => onTabChange('credentials'),
    },
    {
      id: 'channels',
      label: t('settings.nav.channels'),
      icon: Radio,
      isActive: activeTab === 'channels',
      onClick: () => onTabChange('channels'),
    },
    {
      id: 'devices',
      label: t('settings.nav.devices'),
      icon: Smartphone,
      isActive: activeTab === 'devices',
      onClick: () => onTabChange('devices'),
    },
    {
      id: 'usage',
      label: t('settings.nav.usage'),
      icon: Activity,
      isActive: activeTab === 'usage',
      onClick: () => onTabChange('usage'),
    },
    {
      id: 'privacy',
      label: t('settings.nav.privacy'),
      icon: Shield,
      isActive: activeTab === 'privacy',
      onClick: () => onTabChange('privacy'),
    },
    {
      id: 'account',
      label: t('settings.nav.account'),
      icon: User,
      isActive: activeTab === 'account',
      onClick: () => onTabChange('account'),
    },
  ];

  return (
    <Sidebar
      brandName={t('settings.title')}
      navItems={navItems}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      footerLinks={SETTINGS_FOOTER_LINKS}
    />
  );
};
