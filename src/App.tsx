import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardThemeProvider } from '@/context/DashboardThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';

// Pages
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Projects } from '@/pages/Projects';
import { ProjectDetails } from '@/pages/ProjectDetails';
import { Tasks } from '@/pages/Tasks';
import { Workflow } from '@/pages/Workflow';
import { Team } from '@/pages/Team';
import { EmployeeDetails } from '@/pages/EmployeeDetails';
import { NotificationsPage } from '@/pages/Notifications';
import { Attendance } from '@/pages/Attendance';
import { LeaveManagement } from '@/pages/LeaveManagement';
import { Revisions } from '@/pages/Revisions';
import { CalendarPage } from '@/pages/Calendar';
import { Reports } from '@/pages/Reports';
import { ReportHistory } from '@/pages/ReportHistory';
import { Archive } from '@/pages/Archive';
import { Settings } from '@/pages/Settings';
import { BackupRestore } from '@/pages/BackupRestore';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <DashboardThemeProvider>
                  <NotificationProvider>
                    <Layout />
                  </NotificationProvider>
                </DashboardThemeProvider>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/workflow" element={<Navigate to="/dashboard" replace />} />
              <Route path="/team" element={<Team />} />
              <Route path="/team/:id" element={<EmployeeDetails />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leave" element={<LeaveManagement />} />
              <Route path="/revisions" element={<Revisions />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/report-history" element={<ReportHistory />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/backup-restore" element={<BackupRestore />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
