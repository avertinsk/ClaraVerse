import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './locales/en/common.json';
import commonRu from './locales/ru/common.json';
import authEn from './locales/en/auth.json';
import authRu from './locales/ru/auth.json';
import chatEn from './locales/en/chat.json';
import chatRu from './locales/ru/chat.json';
import onboardingEn from './locales/en/onboarding.json';
import onboardingRu from './locales/ru/onboarding.json';
import dashboardEn from './locales/en/dashboard.json';
import dashboardRu from './locales/ru/dashboard.json';
import settingsEn from './locales/en/settings.json';
import settingsRu from './locales/ru/settings.json';
import subscriptionEn from './locales/en/subscription.json';
import subscriptionRu from './locales/ru/subscription.json';
import agentsEn from './locales/en/agents.json';
import agentsRu from './locales/ru/agents.json';
import nexusEn from './locales/en/nexus.json';
import nexusRu from './locales/ru/nexus.json';
import skillsEn from './locales/en/skills.json';
import skillsRu from './locales/ru/skills.json';
import adminEn from './locales/en/admin.json';
import adminRu from './locales/ru/admin.json';
import errorsEn from './locales/en/errors.json';
import errorsRu from './locales/ru/errors.json';
import privacyEn from './locales/en/privacy.json';
import privacyRu from './locales/ru/privacy.json';

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    chat: chatEn,
    onboarding: onboardingEn,
    dashboard: dashboardEn,
    settings: settingsEn,
    subscription: subscriptionEn,
    agents: agentsEn,
    nexus: nexusEn,
    skills: skillsEn,
    admin: adminEn,
    errors: errorsEn,
    privacy: privacyEn,
  },
  ru: {
    common: commonRu,
    auth: authRu,
    chat: chatRu,
    onboarding: onboardingRu,
    dashboard: dashboardRu,
    settings: settingsRu,
    subscription: subscriptionRu,
    agents: agentsRu,
    nexus: nexusRu,
    skills: skillsRu,
    admin: adminRu,
    errors: errorsRu,
    privacy: privacyRu,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru'],
    interpolation: {
      escapeValue: false,
    },
    ns: [
      'common',
      'auth',
      'chat',
      'onboarding',
      'dashboard',
      'settings',
      'subscription',
      'agents',
      'nexus',
      'skills',
      'admin',
      'errors',
      'privacy',
    ],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
