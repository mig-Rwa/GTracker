import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';
import { BarbellIcon } from '@phosphor-icons/react/dist/ssr/Barbell';
import { BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo';
import { ChartLineUpIcon } from '@phosphor-icons/react/dist/ssr/ChartLineUp';

export const navIcons = {
  'chart-pie': ChartPieIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': PlugsConnectedIcon,
  'x-square': XSquare,
  user: UserIcon,
  users: UsersIcon,
  barbell: BarbellIcon,
  'book-open': BookOpenIcon,
  'apple-logo': AppleLogoIcon,
  'chart-line-up': ChartLineUpIcon,
} as Record<string, Icon>;

