import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import {
  getAppSettings,
  updateAppSettings,
  getHolidays,
  addHoliday,
  deleteHoliday,
} from '@/services/supabase/settings';
import { AppSettings, Holiday } from '@/types';
import { formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import { useNotifications } from '@/context/NotificationContext';
import { Settings as SettingsIcon, Plus, Trash2, Save, Calendar, Bell, ShieldAlert } from 'lucide-react';

export const Settings: React.FC = () => {
  const toast = useToast();
  const { preferences, updatePreferences } = useNotifications();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleTogglePref = (key: keyof typeof preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    updatePreferences(updated);
    toast.success('Notification Preference Updated');
  };

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [leadName, setLeadName] = useState('');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [breakMin, setBreakMin] = useState(60);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [reportFooter, setReportFooter] = useState('');

  // Holiday Modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [s, h] = await Promise.all([getAppSettings(), getHolidays()]);
      setSettings(s);
      setHolidays(h);

      setCompanyName(s.company_name);
      setDeptName(s.department_name);
      setLeadName(s.design_lead_name);
      setWorkStart(s.working_hours_start);
      setWorkEnd(s.working_hours_end);
      setBreakMin(s.break_duration_minutes);
      setTimezone(s.timezone || 'Asia/Kolkata');
      setReportFooter(s.report_footer_text || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateAppSettings({
        company_name: companyName,
        department_name: deptName,
        design_lead_name: leadName,
        working_hours_start: workStart,
        working_hours_end: workEnd,
        break_duration_minutes: breakMin,
        timezone,
        report_footer_text: reportFooter,
      });

      toast.success('Settings Saved', 'System preferences updated');
    } catch (err: any) {
      toast.error('Failed to save settings', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName || !holidayDate) return;

    try {
      await addHoliday({ name: holidayName, date: holidayDate });
      toast.success('Holiday Added');
      setIsHolidayModalOpen(false);
      setHolidayName('');
      setHolidayDate('');
      const updated = await getHolidays();
      setHolidays(updated);
    } catch (err: any) {
      toast.error('Failed to add holiday', err.message);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id);
      toast.success('Holiday Removed');
      const updated = await getHolidays();
      setHolidays(updated);
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">System Settings</h2>
          <p className="text-xs text-secondary mt-0.5">
            Configure department parameters, working schedule, holiday calendar and report branding
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Department & Identity */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-border pb-2.5">
            Organization & Design Department Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Company / Organization Name
              </label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Department Name
              </label>
              <input
                required
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Design Lead Name (Sign-off)
              </label>
              <input
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </Card>

        {/* Work Hours & Schedule */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-border pb-2.5">
            Working Schedule & Timezone
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Standard Arrival
              </label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Standard Departure
              </label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Default Break (Minutes)
              </label>
              <input
                type="number"
                value={breakMin}
                onChange={(e) => setBreakMin(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-1">
                Timezone
              </label>
              <input
                disabled
                value={timezone}
                className="w-full px-3 py-2 text-sm bg-gray-100 border border-border rounded-lg text-secondary cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Report Footer */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-primary border-b border-border pb-2.5">
            Report Statement Footer & Disclaimers
          </h3>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Confidentiality / Compliance Notice
            </label>
            <input
              value={reportFooter}
              onChange={(e) => setReportFooter(e.target.value)}
              placeholder="e.g. Confidential design team internal document • Not for external distribution"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </Card>

        {/* Notification & Operational Alert Preferences */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">Notification Centre & Operational Alerts</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Configure which operational categories appear in your top header bell and notifications page
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F2D76B]/20 border border-[#F2D76B]/50 rounded-xl flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-[#A87E14] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary">Operational Safety Principle</p>
              <p className="text-secondary mt-0.5">
                Critical operational alerts (overdue projects, missed delivery deadlines, failed backups, blocked tasks) cannot be silenced to ensure the Design Lead never misses emergency blockers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-gray-50/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preferences.taskUpdates}
                onChange={() => handleTogglePref('taskUpdates')}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <div>
                <span className="text-xs font-bold text-primary block">Task Updates & Reviews</span>
                <span className="text-[11px] text-secondary">New tasks, assignment updates, and tasks ready for Lead review</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-gray-50/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preferences.projectUpdates}
                onChange={() => handleTogglePref('projectUpdates')}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <div>
                <span className="text-xs font-bold text-primary block">Project Milestones</span>
                <span className="text-[11px] text-secondary">New projects, delivery events, and client revision requests</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-gray-50/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preferences.attendanceAndHr}
                onChange={() => handleTogglePref('attendanceAndHr')}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <div>
                <span className="text-xs font-bold text-primary block">Attendance & HR Approvals</span>
                <span className="text-[11px] text-secondary">Pending leave requests, half-day permissions, early log-off, and weekend work</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-gray-50/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preferences.excelImports}
                onChange={() => handleTogglePref('excelImports')}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <div>
                <span className="text-xs font-bold text-primary block">Excel Imports & Data Syncs</span>
                <span className="text-[11px] text-secondary">Team spreadsheet uploads, batch task processing, and duplicate warnings</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-gray-50/50 cursor-pointer transition-colors sm:col-span-2">
              <input
                type="checkbox"
                checked={preferences.reportsAndBackups}
                onChange={() => handleTogglePref('reportsAndBackups')}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <div>
                <span className="text-xs font-bold text-primary block">Reports & Cloud Backups</span>
                <span className="text-[11px] text-secondary">Generated PDF statements, cloud storage backups, and recovery operations</span>
              </div>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Save All Preferences
          </Button>
        </div>
      </form>

      {/* Holiday Calendar Management */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div>
            <h3 className="text-sm font-semibold text-primary">Official Holiday Calendar</h3>
            <p className="text-xs text-secondary mt-0.5">
              Dates marked as holidays are automatically excluded from absence calculations
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsHolidayModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Holiday
          </Button>
        </div>

        <div className="divide-y divide-border text-xs">
          {holidays.map((h) => (
            <div key={h.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-primary">{h.name}</span>
                <span className="text-secondary">({formatDate(h.date)})</span>
              </div>

              <button
                onClick={() => handleDeleteHoliday(h.id)}
                className="text-gray-400 hover:text-danger p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {holidays.length === 0 && (
            <p className="text-xs text-secondary py-4 text-center">No holidays configured yet.</p>
          )}
        </div>
      </Card>

      {/* ADD HOLIDAY MODAL */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="Add Official Holiday"
        size="sm"
      >
        <form onSubmit={handleAddHoliday} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Holiday Name *
            </label>
            <input
              required
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              placeholder="e.g. Independence Day / Pongal"
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary uppercase mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsHolidayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

