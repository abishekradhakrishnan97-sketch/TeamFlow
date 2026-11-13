import React from 'react';
import { clsx } from 'clsx';
import {
  ProjectStatus,
  TaskStatus,
  Priority,
  AttendanceStatus,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  ATTENDANCE_STATUS_LABELS,
} from '@/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className,
  dot = false,
}) => {
  const styles = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const dotStyles = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
    purple: 'bg-indigo-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        styles[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ProjectStatus | TaskStatus }> = ({ status }) => {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    not_started: { label: 'Not Started', variant: 'gray' },
    active: { label: 'Active', variant: 'blue' },
    working: { label: 'Working', variant: 'purple' },
    on_hold: { label: 'On Hold', variant: 'yellow' },
    blocked: { label: 'Blocked', variant: 'red' },
    under_review: { label: 'Under Review', variant: 'yellow' },
    ready_for_review: { label: 'Ready for Review', variant: 'yellow' },
    changes_requested: { label: 'Changes Requested', variant: 'red' },
    delivered: { label: 'Delivered', variant: 'green' },
    completed: { label: 'Completed', variant: 'green' },
    reopened: { label: 'Reopened', variant: 'red' },
    archived: { label: 'Archived', variant: 'gray' },
  };

  const config = map[status] || { label: status, variant: 'gray' };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const map: Record<Priority, { label: string; variant: BadgeProps['variant'] }> = {
    low: { label: 'Low', variant: 'gray' },
    medium: { label: 'Medium', variant: 'blue' },
    high: { label: 'High', variant: 'yellow' },
    urgent: { label: 'Urgent', variant: 'red' },
  };
  const config = map[priority] || { label: priority, variant: 'gray' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const AttendanceBadge: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  const map: Record<AttendanceStatus, { label: string; variant: BadgeProps['variant'] }> = {
    present: { label: 'Present', variant: 'green' },
    absent: { label: 'Absent', variant: 'red' },
    half_day: { label: 'Half Day', variant: 'yellow' },
    leave: { label: 'Leave', variant: 'yellow' },
    work_from_home: { label: 'WFH', variant: 'purple' },
    holiday: { label: 'Holiday', variant: 'blue' },
    weekly_off: { label: 'Weekly Off', variant: 'gray' },
  };
  const config = map[status] || { label: status, variant: 'gray' };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};

export const ApprovalBadge: React.FC<{ status: 'pending' | 'approved' | 'rejected' | 'not_required' }> = ({
  status,
}) => {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    approved: { label: 'Approved', variant: 'green' },
    pending: { label: 'Pending Approval', variant: 'yellow' },
    rejected: { label: 'Rejected', variant: 'red' },
    not_required: { label: 'Not Required', variant: 'gray' },
  };
  const config = map[status] || { label: status, variant: 'gray' };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
};


