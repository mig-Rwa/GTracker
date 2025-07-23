import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'workouts', title: 'Workouts', href: '/workouts', icon: 'barbell' },
  { key: 'exercise-library', title: 'Exercise Library', href: '/exercise-library', icon: 'book-open' },
  { key: 'nutrition', title: 'Nutrition', href: '/nutrition', icon: 'apple-logo' },
  { key: 'progress', title: 'Progress', href: '/progress', icon: 'chart-line-up' },
  { key: 'subscriptions', title: 'Subscriptions', href: '/subscriptions', icon: 'plugs-connected' },
  { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  { key: 'bmi-calculator', title: 'BMI Calculator', href: '/bmi-calculator', icon: 'scale' },
  { key: 'body-fat-calculator', title: 'Body Fat Calculator', href: '/body-fat-calculator', icon: 'user-circle' },
] satisfies NavItemConfig[];
