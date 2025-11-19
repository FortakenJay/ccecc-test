// src/app/[locale]/(dashboard)/panel/layout.tsx
"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faBookOpen,
  faCalendarDays,
  faAward,
  faUsers,
  faEnvelopeOpen,
  faChartLine,
  faSignOutAlt,
  faBars,
  faXmark,
  faUserCircle,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('dashboard.nav');
  const tc = useTranslations('dashboard.common');
  const { user, profile, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#C8102E] border-t-transparent"></div>
          <p className="mt-4 text-gray-600">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const navigation = [
    { name: t('dashboard'), href: '/panel', icon: faHome, roles: ['owner', 'admin', 'officer'] },
    { name: t('classes'), href: '/panel/clases', icon: faBookOpen, roles: ['owner', 'admin', 'officer'] },
    { name: t('events'), href: '/panel/eventos', icon: faCalendarDays, roles: ['owner', 'admin', 'officer'] },
    { name: t('hskExam'), href: '/panel/hsk/sessiones', icon: faAward, roles: ['owner', 'admin', 'officer'] },
    { name: t('hskRegistrations'), href: '/panel/hsk/registraciones', icon: faUserCircle, roles: ['owner', 'admin', 'officer'] },
    { name: t('consultations'), href: '/panel/consultas', icon: faEnvelopeOpen, roles: ['owner', 'admin', 'officer'] },
    { name: t('team'), href: '/panel/equipo', icon: faUsers, roles: ['owner', 'admin'] },
    { name: t('users'), href: '/panel/usuarios', icon: faUserShield, roles: ['owner', 'admin'] },
    { name: t('auditLogs'), href: '/panel/registros', icon: faChartLine, roles: ['owner', 'admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(profile.role)
  );

  const isActive = (href: string) => {
    if (href === '/panel') {
      return pathname === '/panel';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/panel" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-linear-to-br from-[#C8102E] to-[#FFD700] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">中</span>
              </div>
              <div>
                <div className="text-[#C8102E] font-bold">CCECC</div>
                <div className="text-xs text-gray-500">{t('adminPanel')}</div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-[#C8102E] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-linear-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUserCircle} className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                signOut();
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
              <span className="font-medium">{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-700 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
            </button>
            <Link href="/" className="text-[#C8102E] font-bold text-xl">
              CCECC
            </Link>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}