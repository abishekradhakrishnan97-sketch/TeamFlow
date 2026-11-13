import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { QuickRequestModal } from '@/components/shared/QuickRequestModal';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { clsx } from 'clsx';

export const Layout: React.FC = () => {
  const { isDark } = useDashboardTheme();
  const [quickRequestOpen, setQuickRequestOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className={clsx(
        'h-screen w-screen flex selection:bg-[#F2D76B]/50 selection:text-[#222222] overflow-hidden transition-colors duration-200',
        isDark ? 'bg-[#141414] text-[#F5F3EE]' : 'bg-background text-primary'
      )}
    >
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        onOpenQuickRequest={() => setQuickRequestOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={clsx(
          'flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-colors duration-200',
          isDark ? 'bg-[#141414]' : 'bg-background'
        )}
      >
        <Topbar
          onOpenQuickRequest={() => setQuickRequestOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main
          className={clsx(
            'flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto relative z-0 scrollbar-thin transition-colors duration-200',
            isDark ? 'bg-[#141414] text-[#F5F3EE]' : 'bg-background text-primary'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Quick Request Dispatcher Modal */}
      <QuickRequestModal
        isOpen={quickRequestOpen}
        onClose={() => setQuickRequestOpen(false)}
        onSuccess={() => {
          // Trigger a query invalidation if needed
        }}
      />

      {/* Global Toast notifications */}
      <ToastContainer />
    </div>
  );
};
