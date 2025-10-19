'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import {
  HomeIcon,
  FolderIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const getNavigation = (t: (key: string) => string) => [
  { name: t('navigation.dashboard'), href: '/dashboard', icon: HomeIcon },
  { name: t('navigation.projects'), href: '/projects', icon: FolderIcon },
  { name: t('navigation.clients'), href: '/clients', icon: UsersIcon },
  { name: t('navigation.estimates'), href: '/estimates', icon: CalculatorIcon },
  { name: t('navigation.invoices'), href: '/invoices', icon: DocumentTextIcon },
  { name: t('navigation.purchases'), href: '/purchases', icon: ShoppingCartIcon },
  { name: t('navigation.changeOrders'), href: '/change-orders', icon: ClipboardDocumentListIcon },
  { name: t('navigation.reports'), href: '/reports', icon: ChartBarIcon },
  { name: t('navigation.settings'), href: '/settings', icon: CogIcon },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const navigation = getNavigation(t);

  return (
    <div className={cn('flex h-full w-64 flex-col bg-gray-900 dark:bg-gray-800', className)}>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <Image
          src="/images/LOGOWITHE.png"
          alt="ContractorApp Logo"
          width={120}
          height={40}
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-6 w-6 shrink-0',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white dark:text-gray-400 dark:group-hover:text-white'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
