import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { QuickRequestModal } from '@/components/shared/QuickRequestModal';

export const Layout: React.FC = () => {
  const [quickRequestOpen, setQuickRequestOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex bg-background text-primary selection:bg-[#F2D76B]/50 selection:text-[#222222] overflow-hidden">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        onOpenQuickRequest={() => setQuickRequestOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar
          onOpenQuickRequest={() => setQuickRequestOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto relative z-0">
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
