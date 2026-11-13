import React from 'react';
import { clsx } from 'clsx';
import {
  ProjectStatus,
  TaskStatus,
  Priority,
  AttendanceStatus,
} from '@/types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
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
    gray: 'bg-[#EEE9DD] text-[#55524B] border-[#E0D8C8]',
    blue: 'bg-[#AFC7E9]/30 text-[#1E3A8A] border-[#AFC7E9]/60',
    green: 'bg-[#A9BB78]/25 text-[#2D4018] border-[#A9BB78]/50',
    yellow: 'bg-[#F2D76B]/30 text-[#6B5007] border-[#F2D76B]/60',
    red: 'bg-[#EFAED0]/35 text-[#731E43] border-[#EFAED0]/70',
    pink: 'bg-[#EFAED0]/35 text-[#731E43] border-[#EFAED0]/70',
    purple: 'bg-[#E8DDF8] text-[#553C9A] border-[#D6BCFA]',
  };

  const dotStyles = {
    gray: 'bg-[#77746D]',
    blue: 'bg-[#4871A9]',
    green: 'bg-[#5D7B38]',
    yellow: 'bg-[#C68B1A]',
    red: 'bg-[#C84C4C]',
    pink: 'bg-[#C84C4C]',
    purple: 'bg-[#7B58C9]',
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
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant])} />}
      <span className="truncate">{children}</span>
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
