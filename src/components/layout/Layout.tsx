import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { QuickRequestModal } from '@/components/shared/QuickRequestModal';

export const Layout: React.FC = () => {
  const [quickRequestOpen, setQuickRequestOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar onOpenQuickRequest={() => setQuickRequestOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenQuickRequest={() => setQuickRequestOpen(true)} />

        <main className="flex-1 p-6 overflow-y-auto">
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

