import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AttendanceRecord,
  Employee,
  Project,
  Task,
  Revision,
  LeaveRecord,
  AppSettings,
  AttendancePermission,
  EarlyLogoff,
  ExtendedAvailability,
  ExtraWorkRecord,
} from '@/types';
import { formatDate, formatTime, formatHours } from './dates';
import { summariseAttendance, formatMinutes } from './calculations';

// Professional styling colors
const PRIMARY_COLOR: [number, number, number] = [23, 25, 31]; // #17191F
const ACCENT_COLOR: [number, number, number] = [98, 88, 232]; // #6258E8
const SECONDARY_COLOR: [number, number, number] = [115, 121, 133]; // #737985
const LIGHT_BG: [number, number, number] = [247, 248, 250]; // #F7F8FA

function addHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  settings?: AppSettings
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent stripe
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company and Department title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(settings?.company_name || 'TEAMFLOW', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 205, 215);
  doc.text(
    `${settings?.department_name || 'Design Department'} • Control Centre`,
    14,
    21
  );

  // Date on right
  const dateStr = `Generated: ${new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
  doc.text(dateStr, pageWidth - 14, 18, { align: 'right' });

  // Document Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(title, 14, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text(subtitle, 14, 49);
}

function addFooter(doc: jsPDF, settings?: AppSettings) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(232, 234, 240);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);

    const preparedBy = `Prepared by: ${settings?.design_lead_name || 'Design Lead'}`;
    doc.text(preparedBy, 14, pageHeight - 11);

    doc.text('CONFIDENTIAL • FOR INTERNAL HR USE ONLY', pageWidth / 2, pageHeight - 11, {
      align: 'center',
    });

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 11, {
      align: 'right',
    });
  }
}

// ----------------------------------------------------------------------
// REPORT A: ATTENDANCE STATEMENT
// ----------------------------------------------------------------------
export function generateAttendancePDF(params: {
  employee: Employee;
  records: AttendanceRecord[];
  startDate: string;
  endDate: string;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const summary = summariseAttendance(params.records);

  addHeader(
    doc,
    'ATTENDANCE STATEMENT',
    `Employee: ${params.employee.name} (${params.employee.designation}) • Period: ${formatDate(params.startDate)} to ${formatDate(params.endDate)}`,
    params.settings
  );

  const startY = 56;
  const cardWidth = 32;
  const cardHeight = 16;
  const metrics = [
    { label: 'Working Days', value: String(summary.workingDays) },
    { label: 'Present Days', value: String(summary.present) },
    { label: 'Absent Days', value: String(summary.absent) },
    { label: 'Leave Days', value: String(summary.leave) },
    { label: 'WFH Days', value: String(summary.wfh) },
    { label: 'Total Hours', value: formatHours(summary.totalHours) },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 2);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x + cardWidth / 2, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x + cardWidth / 2, startY + 12.5, { align: 'center' });
  });

  const tableRows = params.records.map((r) => [
    formatDate(r.date),
    r.status.toUpperCase().replace('_', ' '),
    formatTime(r.arrival_time),
    formatTime(r.departure_time),
    r.break_duration_minutes ? `${r.break_duration_minutes}m` : '0m',
    formatHours(r.total_hours),
    r.remarks || '—',
  ]);

  autoTable(doc, {
    startY: startY + 22,
    head: [['Date', 'Status', 'Arrival', 'Departure', 'Break', 'Total Hours', 'Remarks']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT B: EMPLOYEE WORK STATEMENT
// ----------------------------------------------------------------------
export function generateEmployeeWorkPDF(params: {
  employee: Employee;
  projects: Project[];
  tasks: Task[];
  revisions: Revision[];
  startDate: string;
  endDate: string;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addHeader(
    doc,
    'EMPLOYEE WORK STATEMENT',
    `Employee: ${params.employee.name} (${params.employee.designation}) • Period: ${formatDate(params.startDate)} to ${formatDate(params.endDate)}`,
    params.settings
  );

  const completedTasks = params.tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = params.tasks.filter((t) => t.status === 'working');
  const pendingTasks = params.tasks.filter(
    (t) => t.status === 'not_started' || t.status === 'on_hold'
  );
  const blockedTasks = params.tasks.filter((t) => t.status === 'blocked');

  const startY = 56;
  const metrics = [
    { label: 'Projects Handled', value: String(params.projects.length) },
    { label: 'Completed Tasks', value: String(completedTasks.length) },
    { label: 'In Progress', value: String(inProgressTasks.length) },
    { label: 'Pending / Hold', value: String(pendingTasks.length) },
    { label: 'Blocked Tasks', value: String(blockedTasks.length) },
    { label: 'Revisions Handled', value: String(params.revisions.length) },
  ];

  const cardWidth = 32;
  const cardHeight = 16;
  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 2);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x + cardWidth / 2, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x + cardWidth / 2, startY + 12.5, { align: 'center' });
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Projects Handled', 14, startY + 26);

  const projectRows = params.projects.map((p) => [
    p.name,
    p.client_name || '—',
    p.project_type.replace(/_/g, ' '),
    p.status.toUpperCase().replace('_', ' '),
    formatDate(p.start_date),
    formatDate(p.target_delivery_date),
  ]);

  autoTable(doc, {
    startY: startY + 30,
    head: [['Project Name', 'Client', 'Type', 'Status', 'Start Date', 'Target Delivery']],
    body: projectRows.length > 0 ? projectRows : [['No projects assigned in period', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  const nextY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Task Deliverables & Status', 14, nextY);

  const taskRows = params.tasks.map((t) => [
    t.title,
    t.project?.name || '—',
    t.status.toUpperCase().replace('_', ' '),
    t.priority.toUpperCase(),
    formatDate(t.due_date),
    formatDate(t.completion_date),
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Task Title', 'Project', 'Status', 'Priority', 'Due Date', 'Completed']],
    body: taskRows.length > 0 ? taskRows : [['No tasks assigned in period', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT C: TEAM MONTHLY STATEMENT
// ----------------------------------------------------------------------
export function generateTeamMonthlyPDF(params: {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  tasks: Task[];
  monthName: string;
  year: number;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  addHeader(
    doc,
    'TEAM MONTHLY OPERATIONAL STATEMENT',
    `Department: ${params.settings?.department_name || 'Design Department'} • Period: ${params.monthName} ${params.year}`,
    params.settings
  );

  const rows = params.employees.map((emp) => {
    const empRecords = params.attendanceRecords.filter((r) => r.employee_id === emp.id);
    const summary = summariseAttendance(empRecords);

    const empTasks = params.tasks.filter((t) =>
      t.assignees?.some((a) => a.employee?.id === emp.id)
    );
    const completedTasks = empTasks.filter((t) => t.status === 'completed').length;
    const activeTasks = empTasks.filter((t) => t.status === 'working').length;

    return [
      emp.name,
      emp.designation,
      String(summary.workingDays),
      String(summary.present),
      String(summary.leave),
      String(summary.wfh),
      String(summary.absent),
      formatHours(summary.totalHours),
      String(completedTasks),
      String(activeTasks),
    ];
  });

  autoTable(doc, {
    startY: 56,
    head: [
      [
        'Employee Name',
        'Designation',
        'Work Days',
        'Present',
        'Leave',
        'WFH',
        'Absent',
        'Office Hours',
        'Tasks Done',
        'Tasks Active',
      ],
    ],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT D: PROJECT ACTIVITY STATEMENT
// ----------------------------------------------------------------------
export function generateProjectActivityPDF(params: {
  project: Project;
  tasks: Task[];
  revisions: Revision[];
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addHeader(
    doc,
    'PROJECT ACTIVITY STATEMENT',
    `Project: ${params.project.name} • Client: ${params.project.client_name || 'Internal'} • Type: ${params.project.project_type.replace(/_/g, ' ')}`,
    params.settings
  );

  const startY = 56;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(14, startY, 182, 22, 2, 2, 'F');
  doc.setDrawColor(232, 234, 240);
  doc.roundedRect(14, startY, 182, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`Status: ${params.project.status.toUpperCase().replace('_', ' ')}`, 18, startY + 7);
  doc.text(`Priority: ${params.project.priority.toUpperCase()}`, 70, startY + 7);
  doc.text(`Start: ${formatDate(params.project.start_date)}`, 120, startY + 7);

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Target Delivery: ${formatDate(params.project.target_delivery_date)}`,
    18,
    startY + 15
  );
  doc.text(
    `Actual Delivery: ${formatDate(params.project.actual_delivery_date)}`,
    90,
    startY + 15
  );

  const taskY = startY + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Tasks & Workflow Status', 14, taskY);

  const taskRows = params.tasks.map((t) => [
    t.title,
    t.workflow_stage?.name || '—',
    t.status.toUpperCase().replace('_', ' '),
    t.priority.toUpperCase(),
    t.assignees?.map((a) => a.employee?.name).join(', ') || 'Unassigned',
    formatDate(t.due_date),
  ]);

  autoTable(doc, {
    startY: taskY + 4,
    head: [['Task Title', 'Stage', 'Status', 'Priority', 'Assignees', 'Due Date']],
    body: taskRows.length > 0 ? taskRows : [['No tasks recorded', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  const revY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Revision History', 14, revY);

  const revRows = params.revisions.map((r) => [
    `Rev #${r.revision_number}`,
    formatDate(r.date_received),
    r.change_description,
    r.status.toUpperCase(),
    formatDate(r.deadline),
    formatDate(r.completion_date),
  ]);

  autoTable(doc, {
    startY: revY + 4,
    head: [['Revision', 'Received Date', 'Change Description', 'Status', 'Deadline', 'Completed']],
    body: revRows.length > 0 ? revRows : [['No revisions recorded', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT 2: HALF-DAY PERMISSION REPORT
// ----------------------------------------------------------------------
export function generateHalfDayPermissionPDF(params: {
  employee?: Employee;
  permissions: AttendancePermission[];
  startDate: string;
  endDate: string;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalMins = params.permissions.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);

  addHeader(
    doc,
    'HALF-DAY PERMISSION REPORT',
    `${params.employee ? `Employee: ${params.employee.name} (${params.employee.designation}) • ` : 'Team-wide Report • '}Period: ${formatDate(params.startDate)} to ${formatDate(params.endDate)}`,
    params.settings
  );

  const startY = 56;
  const metrics = [
    { label: 'Total Permissions', value: String(params.permissions.length) },
    { label: 'Total Duration', value: formatMinutes(totalMins) },
    { label: 'Approved', value: String(params.permissions.filter((p) => p.approval_status === 'approved').length) },
    { label: 'Pending / Rejected', value: String(params.permissions.filter((p) => p.approval_status !== 'approved').length) },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * 46;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x + 22, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x + 22, startY + 12.5, { align: 'center' });
  });

  const rows = params.permissions.map((p) => [
    formatDate(p.permission_date),
    p.employee?.name || '—',
    p.half_day_period.replace('_', ' ').toUpperCase(),
    `${formatTime(p.start_time)} - ${formatTime(p.end_time)}`,
    formatMinutes(p.duration_minutes),
    p.approval_status.toUpperCase(),
    p.reason || p.admin_remarks || '—',
  ]);

  autoTable(doc, {
    startY: startY + 22,
    head: [['Date', 'Employee', 'Period', 'Time Window', 'Duration', 'Approval', 'Reason / Remarks']],
    body: rows.length > 0 ? rows : [['No permissions recorded in period', '—', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT 3: EARLY LOG-OFF REPORT
// ----------------------------------------------------------------------
export function generateEarlyLogoffPDF(params: {
  employee?: Employee;
  logoffs: EarlyLogoff[];
  startDate: string;
  endDate: string;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalMins = params.logoffs.reduce((sum, l) => sum + (l.difference_minutes || 0), 0);

  addHeader(
    doc,
    'EARLY LOG-OFF REPORT',
    `${params.employee ? `Employee: ${params.employee.name} (${params.employee.designation}) • ` : 'Team-wide Report • '}Period: ${formatDate(params.startDate)} to ${formatDate(params.endDate)}`,
    params.settings
  );

  const startY = 56;
  const metrics = [
    { label: 'Total Early Log-Offs', value: String(params.logoffs.length) },
    { label: 'Total Early Time', value: formatMinutes(totalMins) },
    { label: 'Approved', value: String(params.logoffs.filter((l) => l.approval_status === 'approved').length) },
    { label: 'Pending / Rejected', value: String(params.logoffs.filter((l) => l.approval_status !== 'approved').length) },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * 46;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x + 22, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x + 22, startY + 12.5, { align: 'center' });
  });

  const rows = params.logoffs.map((l) => [
    formatDate(l.logoff_date),
    l.employee?.name || '—',
    formatTime(l.scheduled_departure_time),
    formatTime(l.actual_departure_time),
    formatMinutes(l.difference_minutes),
    l.approval_status.toUpperCase(),
    l.reason || l.admin_remarks || '—',
  ]);

  autoTable(doc, {
    startY: startY + 22,
    head: [['Date', 'Employee', 'Scheduled', 'Actual Departure', 'Left Early By', 'Approval', 'Reason / Remarks']],
    body: rows.length > 0 ? rows : [['No early log-offs recorded in period', '—', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT 4: EXTENDED AVAILABILITY REPORT
// ----------------------------------------------------------------------
export function generateExtendedAvailabilityPDF(params: {
  employee?: Employee;
  records: ExtendedAvailability[];
  startDate: string;
  endDate: string;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalActive = params.records.reduce((sum, r) => sum + (r.active_work_minutes || 0), 0);
  const totalStandby = params.records.reduce((sum, r) => sum + (r.standby_minutes || 0), 0);

  addHeader(
    doc,
    'EXTENDED AVAILABILITY & LATE HOURS REPORT',
    `${params.employee ? `Employee: ${params.employee.name} (${params.employee.designation}) • ` : 'Team-wide Report • '}Period: ${formatDate(params.startDate)} to ${formatDate(params.endDate)}`,
    params.settings
  );

  const startY = 56;
  const metrics = [
    { label: 'Active Work Hours', value: formatMinutes(totalActive) },
    { label: 'Standby Hours', value: formatMinutes(totalStandby) },
    { label: 'Total Extended Time', value: formatMinutes(totalActive + totalStandby) },
    { label: 'Sessions Count', value: String(params.records.length) },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * 46;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x + 22, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x + 22, startY + 12.5, { align: 'center' });
  });

  const rows = params.records.map((r) => [
    formatDate(r.availability_date),
    r.employee?.name || '—',
    r.activity_type.replace('_', ' ').toUpperCase(),
    `${formatTime(r.regular_closing_time)} - ${formatTime(r.actual_end_time)}`,
    formatMinutes(r.active_work_minutes),
    formatMinutes(r.standby_minutes),
    r.project?.name || 'General Support',
    r.approval_status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: startY + 22,
    head: [['Date', 'Employee', 'Activity Type', 'Time Range', 'Active Work', 'Standby', 'Project', 'Approval']],
    body: rows.length > 0 ? rows : [['No extended availability recorded in period', '—', '—', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT 5, 6, 7: EXTRA WORK REPORT (SATURDAY / SUNDAY / COMBINED)
// ----------------------------------------------------------------------
export function generateExtraWorkPDF(params: {
  employee?: Employee;
  records: ExtraWorkRecord[];
  dayType?: 'saturday' | 'sunday' | 'all';
  startDate: string;
  endDate: string;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const satMins = params.records
    .filter((r) => r.work_day_type === 'saturday')
    .reduce((sum, r) => sum + (r.total_minutes || 0), 0);
  const sunMins = params.records
    .filter((r) => r.work_day_type === 'sunday')
    .reduce((sum, r) => sum + (r.total_minutes || 0), 0);

  const title =
    params.dayType === 'saturday'
      ? 'SATURDAY EXTRA WORK STATEMENT'
      : params.dayType === 'sunday'
      ? 'SUNDAY EXTRA WORK STATEMENT'
      : 'WEEKEND EXTRA WORK STATEMENT';

  addHeader(
    doc,
    title,
    `${params.employee ? `Employee: ${params.employee.name} (${params.employee.designation}) • ` : 'Team-wide Report • '}Period: ${formatDate(params.startDate)} to ${formatDate(params.endDate)}`,
    params.settings
  );

  const startY = 56;
  const metrics = [
    { label: 'Saturday Hours', value: formatMinutes(satMins) },
    { label: 'Sunday Hours', value: formatMinutes(sunMins) },
    { label: 'Total Extra Hours', value: formatMinutes(satMins + sunMins) },
    { label: 'Sessions Recorded', value: String(params.records.length) },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * 46;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(x, startY, 44, 16, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x + 22, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x + 22, startY + 12.5, { align: 'center' });
  });

  const rows = params.records.map((r) => [
    formatDate(r.work_date),
    r.work_day_type.toUpperCase(),
    r.employee?.name || '—',
    r.project?.name || 'Standalone Work',
    `${formatTime(r.start_time)} - ${formatTime(r.end_time)}`,
    formatMinutes(r.total_minutes),
    r.work_description,
    r.approval_status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: startY + 22,
    head: [['Date', 'Day', 'Employee', 'Project', 'Time Range', 'Duration', 'Description', 'Approval']],
    body: rows.length > 0 ? rows : [['No weekend extra work recorded in period', '—', '—', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  addFooter(doc, params.settings);
  return doc.output('blob');
}

// ----------------------------------------------------------------------
// REPORT 8: COMPLETE EMPLOYEE HR STATEMENT (ALL INCLUSIVE)
// ----------------------------------------------------------------------
export function generateCombinedHRPDF(params: {
  employee: Employee;
  attendanceRecords: AttendanceRecord[];
  leaveRecords: LeaveRecord[];
  projects: Project[];
  tasks: Task[];
  permissions?: AttendancePermission[];
  logoffs?: EarlyLogoff[];
  extended?: ExtendedAvailability[];
  extraWork?: ExtraWorkRecord[];
  startDate: string;
  endDate: string;
  settings?: AppSettings;
}): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const summary = summariseAttendance(params.attendanceRecords);

  const satMins = (params.extraWork || [])
    .filter((w) => w.work_day_type === 'saturday')
    .reduce((sum, w) => sum + (w.total_minutes || 0), 0);
  const sunMins = (params.extraWork || [])
    .filter((w) => w.work_day_type === 'sunday')
    .reduce((sum, w) => sum + (w.total_minutes || 0), 0);
  const extActiveMins = (params.extended || []).reduce((sum, e) => sum + (e.active_work_minutes || 0), 0);
  const extStandbyMins = (params.extended || []).reduce((sum, e) => sum + (e.standby_minutes || 0), 0);

  addHeader(
    doc,
    'COMPLETE EMPLOYEE HR STATEMENT',
    `Employee: ${params.employee.name} • ${params.employee.designation} • Period: ${formatDate(params.startDate)} to ${formatDate(params.endDate)}`,
    params.settings
  );

  const startY = 56;
  const metrics = [
    { label: 'Present Days', value: String(summary.present) },
    { label: 'Leave Days', value: String(summary.leave) },
    { label: 'Regular Hours', value: formatHours(summary.totalHours) },
    { label: 'Ext. Active Hours', value: formatMinutes(extActiveMins) },
    { label: 'Ext. Standby Hours', value: formatMinutes(extStandbyMins) },
    { label: 'Weekend Extra Hours', value: formatMinutes(satMins + sunMins) },
  ];

  const cardWidth = 32;
  const cardHeight = 16;
  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 2);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(m.label, x + cardWidth / 2, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(m.value, x + cardWidth / 2, startY + 12.5, { align: 'center' });
  });

  // Section 1: Permissions & Exceptions
  const excY = startY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Attendance Exceptions: Half-Day Permissions & Early Log-Offs', 14, excY);

  const permRows = (params.permissions || []).map((p) => [
    formatDate(p.permission_date),
    `Permission: ${p.half_day_period.replace('_', ' ')}`,
    `${formatTime(p.start_time)} - ${formatTime(p.end_time)}`,
    formatMinutes(p.duration_minutes),
    p.approval_status.toUpperCase(),
    p.reason || '—',
  ]);

  const logRows = (params.logoffs || []).map((l) => [
    formatDate(l.logoff_date),
    `Early Log-off (Left ${formatMinutes(l.difference_minutes)} early)`,
    `Actual: ${formatTime(l.actual_departure_time)}`,
    formatMinutes(l.difference_minutes),
    l.approval_status.toUpperCase(),
    l.reason || '—',
  ]);

  const combinedExceptions = [...permRows, ...logRows];

  autoTable(doc, {
    startY: excY + 4,
    head: [['Date', 'Category', 'Time Window', 'Duration', 'Approval', 'Reason']],
    body: combinedExceptions.length > 0 ? combinedExceptions : [['No permissions or early log-offs recorded', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  // Section 2: Weekend Extra Work & Extended Hours
  const extraY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Extended Availability & Weekend Extra Work', 14, extraY);

  const extraRows = [
    ...(params.extended || []).map((e) => [
      formatDate(e.availability_date),
      `Extended: ${e.activity_type.replace('_', ' ')}`,
      e.project?.name || 'General Support',
      `Active: ${formatMinutes(e.active_work_minutes)} | Standby: ${formatMinutes(e.standby_minutes)}`,
      e.approval_status.toUpperCase(),
      e.reason || '—',
    ]),
    ...(params.extraWork || []).map((w) => [
      formatDate(w.work_date),
      `Extra Work: ${w.work_day_type.toUpperCase()}`,
      w.project?.name || 'Standalone',
      formatMinutes(w.total_minutes),
      w.approval_status.toUpperCase(),
      w.work_description,
    ]),
  ];

  autoTable(doc, {
    startY: extraY + 4,
    head: [['Date', 'Type', 'Project', 'Duration', 'Approval', 'Description']],
    body: extraRows.length > 0 ? extraRows : [['No extended or weekend work recorded', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  // Signature Section
  const sigY = (doc as any).lastAutoTable.finalY + 16;
  if (sigY < 250) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...SECONDARY_COLOR);

    doc.line(14, sigY + 14, 74, sigY + 14);
    doc.text('Design Lead Signature', 14, sigY + 19);

    doc.line(134, sigY + 14, 194, sigY + 14);
    doc.text('HR Department Sign-off', 134, sigY + 19);
  }

  addFooter(doc, params.settings);
  return doc.output('blob');
}
