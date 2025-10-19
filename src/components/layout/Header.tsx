'use client';

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeSelector from '@/components/ThemeSelector';
import Image from 'next/image';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Header() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="flex items-center">
        <Image
          src={theme === 'dark' ? '/images/LOGOWITHE.png' : '/images/LOGOBLACK.png'}
          alt="ContractorApp Logo"
          width={120}
          height={40}
          className="h-8 w-auto"
        />
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <LanguageSelector />
          <ThemeSelector />
          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
          >
            <span className="sr-only">Ver notificaciones</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-600" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Abrir menú de usuario</span>
              <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" />
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100" aria-hidden="true">
                  {user?.name || 'Usuario'}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-gray-100/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/profile"
                      className={classNames(
                        active ? 'bg-gray-50 dark:bg-gray-700' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {t('common.profile') || 'Mi perfil'}
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={classNames(
                        active ? 'bg-gray-50 dark:bg-gray-700' : '',
                        'block w-full px-3 py-1 text-left text-sm leading-6 text-gray-900 dark:text-gray-100'
                      )}
                    >
{t('common.logout') || 'Cerrar sesión'}
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}
