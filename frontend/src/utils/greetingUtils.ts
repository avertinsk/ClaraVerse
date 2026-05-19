/**
 * Utility functions for generating dynamic greetings based on time of day
 */
import i18n from '@/i18n';

// Store/retrieve user name from localStorage
const USER_NAME_KEY = 'claraverse_user_name';

// Helper function to get user-specific storage key
function getUserSpecificKey(): string {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      if (state?.user?.id) {
        return `${USER_NAME_KEY}-${state.user.id}`;
      }
    }
  } catch (error) {
    console.warn('Failed to get user ID for user name key:', error);
  }
  return USER_NAME_KEY;
}

export function getUserName(): string | null {
  const key = getUserSpecificKey();
  return localStorage.getItem(key);
}

export function setUserName(name: string): void {
  const key = getUserSpecificKey();
  localStorage.setItem(key, name.trim());
}

export function hasUserName(): boolean {
  return !!getUserName();
}

// Get current time period
type TimePeriod =
  | 'early_morning'
  | 'morning'
  | 'late_morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'late_night';

function getTimePeriod(): TimePeriod {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 5) return 'late_night';
  if (hour >= 5 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'late_morning';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Get day of week
function getDayOfWeek(): string {
  const dayIndex = new Date().getDay();
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return i18n.t(`onboarding:days.${dayKeys[dayIndex]}`);
}

function getTimePeriodKey(period: TimePeriod): string {
  const map: Record<TimePeriod, string> = {
    early_morning: 'earlyMorning',
    morning: 'morning',
    late_morning: 'lateMorning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
    late_night: 'lateNight',
  };
  return map[period];
}

function getRandomTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

function buildGreeting(keyPrefix: string, name: string | null, day: string): string {
  const templates = i18n.t(`${keyPrefix}`, { returnObjects: true }) as string[];
  if (!Array.isArray(templates) || templates.length === 0) {
    return name ? `Hello, ${name}!` : 'Hello!';
  }
  const template = getRandomTemplate(templates);
  return template.replace('{name}', name || 'there').replace('{day}', day);
}

/**
 * Generate a dynamic greeting based on current time and user name
 */
export function generateGreeting(): string {
  const name = getUserName();
  const timePeriod = getTimePeriod();
  const day = getDayOfWeek();
  const keyPrefix = `onboarding:greeting.${getTimePeriodKey(timePeriod)}`;
  return buildGreeting(keyPrefix, name, day);
}

/**
 * Generate greeting without name (for first-time users before they set name)
 */
export function generateAnonymousGreeting(): string {
  const timePeriod = getTimePeriod();
  const day = getDayOfWeek();
  const keyPrefix = `onboarding:greeting.anonymous.${getTimePeriodKey(timePeriod)}`;
  return buildGreeting(keyPrefix, null, day);
}
