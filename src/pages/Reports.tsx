import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { getEmployees } from '@/services/supabase/employees';
import { getProjects } from '@/services/supabase/projects';
import { getTasks } from '@/services/supabase/tasks';
import { getAttendanceRange, getAttendanceByEmployee } from '@/services/supabase/attendance';
import {
  getAttendancePermissions,
  getEarlyLogoffs,
  getExtendedAvailability,
  getExtraWorkRecords,
} from '@/services/supabase/attendanceExtensions';
import { getLeaveRecords } from '@/services/supabase/leave';
import { getRevisions } from '@/services/supabase/revisions';
import { saveReportDocument } from '@/services/supabase/reports';
import { getAppSettings } from '@/services/supabase/settings';
import { getEmployeeProjects } from '@/utils/employeeProjects';
import {
  Employee,
  Project,
  Task,
  ReportType,
  ReportScope,
  ReportPeriod,
  AppSettings,
} from '@/types';
import {
  generateAttendancePDF,
  generateEmployeeWorkPDF,
  generateTeamMonthlyPDF,
  generateProjectActivityPDF,
  generateCombinedHRPDF,
  generateHalfDayPermissionPDF,
  generateEarlyLogoffPDF,
  generateExtendedAvailabilityPDF,
  generateExtraWorkPDF,
} from '@/utils/pdf';
import { todayIST, formatDate } from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import {
  FileText,
  FileCheck2,
  Calendar,
  Users,
  FolderKanban,
  Download,
  Eye,
  Loader2,
  CheckCircle2,
  CloudUpload,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | undefined>();
  const [loading, setLoading] = useState(true);

  // Form State
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(todayIST());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Generation & Preview
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [currentReportName, setCurrentReportName] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [e, p, s] = await Promise.all([
        getEmployees(),
        getProjects({ includeArchived: true }),
        getAppSettings(),
      ]);
      setEmployees(e);
      setProjects(p);
      setAppSettings(s);
      if (p.length > 0) setSelectedProjectId(p[0].id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reporting data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let blob: Blob;
      let generatedName = '';

      const emp = employees.find((e) => e.id === selectedEmployeeId);
      const proj = projects.find((p) => p.id === selectedProjectId);

      const periodLabel = `${new Date(startDate).toLocaleString('default', {
        month: 'short',
      })}_${new Date(startDate).getFullYear()}`;

      if (reportType === 'attendance') {
        if (!emp) throw new Error('Please select an employee');
        const attRecords = await getAttendanceByEmployee(emp.id, startDate, endDate);
        blob = generateAttendancePDF({
          employee: emp,
          records: attRecords,
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Attendance_${emp.name.replace(/\s+/g, '_')}_${periodLabel}.pdf`;
      } else if (reportType === 'employee_work') {
        if (!emp) throw new Error('Please select an employee');
        const [empTasks, allRevs] = await Promise.all([
          getTasks({ employeeId: emp.id }),
          getRevisions(),
        ]);
        const empProjects = getEmployeeProjects(emp.id, projects, empTasks);
        blob = generateEmployeeWorkPDF({
          employee: emp,
          projects: empProjects,
          tasks: empTasks,
          revisions: allRevs,
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Employee_${emp.name.replace(/\s+/g, '_')}_${periodLabel}.pdf`;
      } else if (reportType === 'team_monthly') {
        const [att, tasks] = await Promise.all([
          getAttendanceRange(startDate, endDate),
          getTasks(),
        ]);
        blob = generateTeamMonthlyPDF({
          employees,
          attendanceRecords: att,
          tasks,
          monthName: new Date(startDate).toLocaleString('default', { month: 'long' }),
          year: new Date(startDate).getFullYear(),
          settings: appSettings,
        });
        generatedName = `TeamFlow_Team_Monthly_${periodLabel}.pdf`;
      } else if (reportType === 'project_activity') {
        if (!proj) throw new Error('Please select a project');
        const [projTasks, projRevs] = await Promise.all([
          getTasks({ projectId: proj.id }),
          getRevisions(proj.id),
        ]);
        blob = generateProjectActivityPDF({
          project: proj,
          tasks: projTasks,
          revisions: projRevs,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Project_${proj.name.replace(/[^a-zA-Z0-9]/g, '_')}_Activity.pdf`;
      } else if (reportType === 'half_day_permission') {
        const perms = await getAttendancePermissions({
          employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
          startDate,
          endDate,
        });
        blob = generateHalfDayPermissionPDF({
          employee: emp,
          permissions: perms,
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_HalfDay_Permissions_${emp ? emp.name.replace(/\s+/g, '_') : 'Team'}_${periodLabel}.pdf`;
      } else if (reportType === 'early_logoff') {
        const logoffs = await getEarlyLogoffs({
          employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
          startDate,
          endDate,
        });
        blob = generateEarlyLogoffPDF({
          employee: emp,
          logoffs,
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Early_Logoffs_${emp ? emp.name.replace(/\s+/g, '_') : 'Team'}_${periodLabel}.pdf`;
      } else if (reportType === 'extended_availability') {
        const extended = await getExtendedAvailability({
          employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
          startDate,
          endDate,
        });
        blob = generateExtendedAvailabilityPDF({
          employee: emp,
          records: extended,
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Extended_Availability_${emp ? emp.name.replace(/\s+/g, '_') : 'Team'}_${periodLabel}.pdf`;
      } else if (reportType === 'saturday_extra_work') {
        const extra = await getExtraWorkRecords({
          employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
          workDayType: 'saturday',
          startDate,
          endDate,
        });
        blob = generateExtraWorkPDF({
          employee: emp,
          records: extra,
          dayType: 'saturday',
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Saturday_ExtraWork_${emp ? emp.name.replace(/\s+/g, '_') : 'Team'}_${periodLabel}.pdf`;
      } else if (reportType === 'sunday_extra_work') {
        const extra = await getExtraWorkRecords({
          employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
          workDayType: 'sunday',
          startDate,
          endDate,
        });
        blob = generateExtraWorkPDF({
          employee: emp,
          records: extra,
          dayType: 'sunday',
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Sunday_ExtraWork_${emp ? emp.name.replace(/\s+/g, '_') : 'Team'}_${periodLabel}.pdf`;
      } else if (reportType === 'combined_extra_work') {
        const extra = await getExtraWorkRecords({
          employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
          startDate,
          endDate,
        });
        blob = generateExtraWorkPDF({
          employee: emp,
          records: extra,
          dayType: 'all',
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Weekend_ExtraWork_${emp ? emp.name.replace(/\s+/g, '_') : 'Team'}_${periodLabel}.pdf`;
      } else {
        // Complete Employee HR Statement (All Inclusive)
        if (!emp) throw new Error('Please select an employee');
        const [att, leaves, tasks, perms, logoffs, extended, extra] = await Promise.all([
          getAttendanceByEmployee(emp.id, startDate, endDate),
          getLeaveRecords({ employeeId: emp.id, startDate, endDate }),
          getTasks({ employeeId: emp.id }),
          getAttendancePermissions({ employeeId: emp.id, startDate, endDate }),
          getEarlyLogoffs({ employeeId: emp.id, startDate, endDate }),
          getExtendedAvailability({ employeeId: emp.id, startDate, endDate }),
          getExtraWorkRecords({ employeeId: emp.id, startDate, endDate }),
        ]);
        const empProjects = getEmployeeProjects(emp.id, projects, tasks);
        blob = generateCombinedHRPDF({
          employee: emp,
          attendanceRecords: att,
          leaveRecords: leaves,
          projects: empProjects,
          tasks,
          permissions: perms,
          logoffs,
          extended,
          extraWork: extra,
          startDate,
          endDate,
          settings: appSettings,
        });
        generatedName = `TeamFlow_Complete_HR_${emp.name.replace(/\s+/g, '_')}_${periodLabel}.pdf`;
      }

      setCurrentBlob(blob);
      setCurrentReportName(generatedName);

      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      toast.error('Generation Error', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!currentBlob || !currentReportName) return;

    try {
      setIsGenerating(true);
      await saveReportDocument({
        report_name: currentReportName,
        report_type: reportType,
        scope:
          selectedEmployeeId === 'all'
            ? 'team'
            : reportType === 'project_activity'
            ? 'project'
            : 'individual',
        period,
        period_start: startDate,
        period_end: endDate,
        employee_id: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
        project_id: selectedProjectId || undefined,
        pdfBlob: currentBlob,
        generated_by: appSettings?.design_lead_name || 'Design Lead',
      });

      toast.success(
        'Uploaded to Cloud',
        `Saved to Supabase Storage bucket (teamflow-reports) and added to Report History`
      );
      setIsPreviewModalOpen(false);
      navigate('/report-history');
    } catch (err: any) {
      toast.error('Cloud Upload Failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadLocally = () => {
    if (!currentBlob || !currentReportName) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(currentBlob);
    link.download = currentReportName;
    link.click();
  };

  const reportOptions: { id: ReportType; title: string; desc: string }[] = [
    {
      id: 'attendance',
      title: 'REPORT A — Attendance Statement',
      desc: 'Daily arrival & departure times, hours, working days, present/leave breakdown.',
    },
    {
      id: 'employee_work',
      title: 'REPORT B — Employee Work Statement',
      desc: 'Projects, workstreams, completed deliverables, blocked and active tasks.',
    },
    {
      id: 'team_monthly',
      title: 'REPORT C — Team Monthly Statement',
      desc: 'Full team operational statement, total office hours, tasks done & active.',
    },
    {
      id: 'project_activity',
      title: 'REPORT D — Project Activity Statement',
      desc: 'Deliverables, workflow stages, revision rounds and delivery history.',
    },
    {
      id: 'combined_hr',
      title: 'REPORT E — Complete Employee HR Statement',
      desc: 'Comprehensive statement linking attendance, leaves, permissions, early log-offs, extended hours and extra work.',
    },
    {
      id: 'half_day_permission',
      title: 'Half-Day Permission Report',
      desc: 'First/second half permissions, time windows, durations, reasons and approvals.',
    },
    {
      id: 'early_logoff',
      title: 'Early Log-Off Report',
      desc: 'Early departures against scheduled 18:00 closing, minutes left early, reasons.',
    },
    {
      id: 'extended_availability',
      title: 'Extended Availability & Late Hours Report',
      desc: 'Active working vs standby hours, meeting & client support tracking past regular hours.',
    },
    {
      id: 'saturday_extra_work',
      title: 'Saturday Extra Work Report',
      desc: 'Saturday working sessions, projects, task descriptions, and durations.',
    },
    {
      id: 'sunday_extra_work',
      title: 'Sunday Extra Work Report',
      desc: 'Sunday working sessions, projects, task descriptions, and durations.',
    },
    {
      id: 'combined_extra_work',
      title: 'Combined Weekend Extra Work Statement',
      desc: 'Consolidated Saturday and Sunday additional work statements with project breakdowns.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">HR Reporting & Formal Statements</h2>
          <p className="text-xs text-secondary mt-0.5">
            Generate audit-ready A4 PDF statements with cloud backup in Supabase Storage
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/report-history')}
          icon={<FileCheck2 className="w-4 h-4 text-accent" />}
        >
          View Report History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Report Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase mb-2">
                1. Select Report Statement Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                {reportOptions.map((rep) => (
                  <label
                    key={rep.id}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                      reportType === rep.id
                        ? 'border-accent bg-indigo-50/50 shadow-xs'
                        : 'border-border hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        value={rep.id}
                        checked={reportType === rep.id}
                        onChange={(e) => setReportType(e.target.value as ReportType)}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="font-bold text-primary">{rep.title}</span>
                    </div>
                    <p className="text-[11px] text-secondary leading-snug pl-5">{rep.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Scope / Target */}
            <div className="pt-4 border-t border-border">
              <label className="block text-xs font-semibold text-primary uppercase mb-2">
                2. Target Scope
              </label>

              {reportType === 'project_activity' ? (
                <div>
                  <label className="block text-xs text-secondary mb-1">Select Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.client_name ? `(${p.client_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : reportType === 'team_monthly' ? (
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-secondary border border-border">
                  Entire team will be included ({employees.length} active employees).
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-secondary mb-1">Select Employee / Team</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">Entire Team (Consolidated)</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} — {e.designation}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Reporting Period */}
            <div className="pt-4 border-t border-border">
              <label className="block text-xs font-semibold text-primary uppercase mb-2">
                3. Reporting Period Range
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-secondary mb-1">Period Presets</label>
                  <select
                    value={period}
                    onChange={(e) => {
                      const p = e.target.value as ReportPeriod;
                      setPeriod(p);
                      const now = new Date();
                      if (p === 'weekly') {
                        const start = new Date(now);
                        start.setDate(now.getDate() - 7);
                        setStartDate(start.toISOString().split('T')[0]);
                        setEndDate(now.toISOString().split('T')[0]);
                      } else if (p === 'monthly') {
                        const start = new Date(now.getFullYear(), now.getMonth(), 1);
                        setStartDate(start.toISOString().split('T')[0]);
                        setEndDate(now.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-secondary mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-secondary mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                loading={isGenerating}
                icon={<Eye className="w-4 h-4" />}
              >
                Generate & Preview PDF
              </Button>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Guidelines & Security Notice */}
        <div className="space-y-4">
          <Card className="p-5 text-xs space-y-3">
            <h4 className="font-bold text-primary text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              HR & Extra-Work Standards
            </h4>
            <p className="text-secondary leading-relaxed">
              All generated PDF reports comply with standard corporate HR and operational audit
              formats.
            </p>
            <ul className="list-disc list-inside text-secondary space-y-1.5 pt-1">
              <li>Asia/Kolkata (IST) dates and duration formatting</li>
              <li>Official Prepared-by & Sign-off fields</li>
              <li>Separate active working hours from standby availability</li>
              <li>Distinguishable Saturday vs Sunday extra work</li>
              <li>Direct cloud storage in private Supabase buckets</li>
              <li>Encrypted download access via short-lived signed URLs</li>
            </ul>
          </Card>

          <Card className="p-5 text-xs space-y-2.5 bg-gray-50 border-dashed">
            <h4 className="font-bold text-primary flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-accent" />
              Permanent Cloud Storage
            </h4>
            <p className="text-secondary leading-relaxed">
              Once approved, reports are uploaded to <span className="font-mono font-semibold">teamflow-reports</span> and
              remain accessible even when logging in from different computers.
            </p>
          </Card>
        </div>
      </div>

      {/* PDF PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Report Statement Preview"
        subtitle={currentReportName}
        size="2xl"
      >
        <div className="space-y-4">
          {previewBlobUrl && (
            <div className="h-[550px] w-full border border-border rounded-xl overflow-hidden bg-gray-100">
              <iframe
                src={previewBlobUrl}
                title="Report Preview"
                className="w-full h-full"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadLocally}
              icon={<Download className="w-4 h-4" />}
            >
              Download PDF Directly
            </Button>

            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveToCloud}
                loading={isGenerating}
                icon={<CloudUpload className="w-4 h-4" />}
              >
                Confirm & Upload to Cloud
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
