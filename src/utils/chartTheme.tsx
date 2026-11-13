import React from 'react';

export interface ColorDefinition {
  base: string;
  light: string;
  dark: string;
  border: string;
  label: string;
}

export const CHART_PALETTE: Record<string, ColorDefinition> = {
  pink: {
    base: '#EFAED0',
    light: '#FDF1F7',
    dark: '#D688AB',
    border: '#C9779C',
    label: 'Design / Active Tasks',
  },
  yellow: {
    base: '#F2D76B',
    light: '#FEF9E7',
    dark: '#D8BC44',
    border: '#C7A82D',
    label: 'Pending Work / Attention',
  },
  green: {
    base: '#A9BB78',
    light: '#F2F7EC',
    dark: '#8CA056',
    border: '#7A8E45',
    label: 'Completed Work / Present',
  },
  blue: {
    base: '#AFC7E9',
    light: '#F1F6FC',
    dark: '#8AAFD8',
    border: '#759EC9',
    label: 'Development / Info',
  },
  purple: {
    base: '#B9A5D8',
    light: '#F6F2FA',
    dark: '#9A82BE',
    border: '#856BAE',
    label: 'Review / Approvals',
  },
  coral: {
    base: '#E99A88',
    light: '#FCF1EF',
    dark: '#CE7864',
    border: '#BD6450',
    label: 'Blocked / Overdue / Absent',
  },
  teal: {
    base: '#87C9BD',
    light: '#EFF9F7',
    dark: '#61AFA1',
    border: '#4D9B8D',
    label: 'Testing / QA / Standby',
  },
  charcoal: {
    base: '#343434',
    light: '#EEE9DD',
    dark: '#1C1C1C',
    border: '#000000',
    label: 'Neutral / Comparison',
  },
};

/**
 * Project status semantic color mapping
 */
export function getProjectStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return CHART_PALETTE.pink.base;
    case 'under_review':
      return CHART_PALETTE.purple.base;
    case 'delivered':
      return CHART_PALETTE.green.base;
    case 'on_hold':
      return CHART_PALETTE.yellow.base;
    case 'reopened':
      return CHART_PALETTE.coral.base;
    case 'not_started':
      return CHART_PALETTE.charcoal.light;
    default:
      return CHART_PALETTE.blue.base;
  }
}

/**
 * Task status semantic color mapping
 */
export function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'working':
      return CHART_PALETTE.pink.base;
    case 'ready_for_review':
      return CHART_PALETTE.purple.base;
    case 'changes_requested':
      return CHART_PALETTE.yellow.base;
    case 'blocked':
      return CHART_PALETTE.coral.base;
    case 'completed':
      return CHART_PALETTE.green.base;
    case 'not_started':
      return CHART_PALETTE.charcoal.light;
    default:
      return CHART_PALETTE.blue.base;
  }
}

/**
 * Attendance status semantic color mapping
 */
export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return CHART_PALETTE.green.base;
    case 'work_from_home':
      return CHART_PALETTE.teal.base;
    case 'leave':
      return CHART_PALETTE.blue.base;
    case 'half_day':
      return CHART_PALETTE.yellow.base;
    case 'absent':
      return CHART_PALETTE.coral.base;
    case 'holiday':
    default:
      return CHART_PALETTE.charcoal.light;
  }
}

/**
 * Task category semantic color mapping derived from title/description
 */
export function getTaskCategory(title?: string, description?: string): {
  key: string;
  label: string;
  color: string;
  fill: string;
} {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  if (
    text.includes('design') ||
    text.includes('ui') ||
    text.includes('ux') ||
    text.includes('figma') ||
    text.includes('visual') ||
    text.includes('icon') ||
    text.includes('animation') ||
    text.includes('layout')
  ) {
    return {
      key: 'design',
      label: 'Design',
      color: CHART_PALETTE.pink.base,
      fill: CHART_PALETTE.pink.light,
    };
  }

  if (
    text.includes('dev') ||
    text.includes('code') ||
    text.includes('frontend') ||
    text.includes('backend') ||
    text.includes('api') ||
    text.includes('component') ||
    text.includes('react')
  ) {
    return {
      key: 'dev',
      label: 'Development',
      color: CHART_PALETTE.blue.base,
      fill: CHART_PALETTE.blue.light,
    };
  }

  if (
    text.includes('test') ||
    text.includes('qa') ||
    text.includes('bug') ||
    text.includes('audit') ||
    text.includes('spec')
  ) {
    return {
      key: 'qa',
      label: 'Testing / QA',
      color: CHART_PALETTE.teal.base,
      fill: CHART_PALETTE.teal.light,
    };
  }

  if (
    text.includes('doc') ||
    text.includes('copy') ||
    text.includes('content') ||
    text.includes('research') ||
    text.includes('guide')
  ) {
    return {
      key: 'content',
      label: 'Content / Docs',
      color: CHART_PALETTE.purple.base,
      fill: CHART_PALETTE.purple.light,
    };
  }

  return {
    key: 'other',
    label: 'General / Operations',
    color: CHART_PALETTE.yellow.base,
    fill: CHART_PALETTE.yellow.light,
  };
}

/**
 * Custom Recharts Tooltip Component
 */
export const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  suffix?: string;
  formatter?: (val: any) => string;
}> = ({ active, payload, label, suffix = '', formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#171717] text-[#FFFDF7] px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-xl border-[0.5px] border-black space-y-1.5 z-50">
      {label && <p className="text-[11px] font-bold text-[#A09C92] uppercase tracking-wider">{label}</p>}
      {payload.map((item, idx) => {
        const val = formatter ? formatter(item.value) : `${item.value}${suffix}`;
        return (
          <div key={idx} className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 border-[0.5px] border-black/40"
              style={{ backgroundColor: item.color || item.fill || item.stroke || '#AFC7E9' }}
            />
            <span className="text-[#D6D2C4] font-medium">{item.name || item.dataKey}:</span>
            <span className="font-bold text-[#FFFDF7] ml-auto">{val}</span>
          </div>
        );
      })}
    </div>
  );
};

