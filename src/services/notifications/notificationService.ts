import { supabase } from '@/services/supabase/client';
import {
  NotificationItem,
  NotificationPriority,
  NotificationCategory,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notifications';
import { todayIST } from '@/utils/dates';

const STORAGE_KEY_STATE = 'teamflow_notifications_state_v1';
const STORAGE_KEY_PREFS = 'teamflow_notification_preferences_v1';

interface LocalNotificationState {
  readIds: string[];
  dismissedIds: string[];
}

function getLocalState(): LocalNotificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read notification local state:', err);
  }
  return { readIds: [], dismissedIds: [] };
}

function saveLocalState(state: LocalNotificationState) {
  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('teamflow:notifications-updated'));
  } catch (err) {
    console.warn('Failed to save notification local state:', err);
  }
}

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to load notification preferences:', err);
  }
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

export function saveNotificationPreferences(prefs: NotificationPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('teamflow:notifications-updated'));
  } catch (err) {
    console.warn('Failed to save notification preferences:', err);
  }
}

/**
 * Fetch, synthesize, and prioritize all functional notifications
 * based on live application records and activity logs.
 */
export async function fetchAllNotifications(): Promise<NotificationItem[]> {
  const localState = getLocalState();
  const preferences = getNotificationPreferences();
  const readSet = new Set(localState.readIds);
  const dismissedSet = new Set(localState.dismissedIds);

  const today = todayIST();
  const synthesized: NotificationItem[] = [];

  // Query live operational data concurrently via Promise.allSettled
  const [
    tasksRes,
    projectsRes,
    leavesRes,
    permsRes,
    earlyRes,
    extRes,
    extraRes,
    revsRes,
    activityRes,
    dbNotifsRes,
  ] = await Promise.allSettled([
    // 1. Tasks
    supabase
      .from('tasks')
      .select('id, title, due_date, status, priority, project:projects(id, name), assignees:task_assignees(employee:employees(id, name))')
      .neq('status', 'completed')
      .limit(100),

    // 2. Projects
    supabase
      .from('projects')
      .select('id, name, target_delivery_date, status')
      .not('status', 'in', '("delivered","archived")')
      .limit(50),

    // 3. Pending Leaves
    supabase
      .from('leave_records')
      .select('id, start_date, end_date, num_days, category, reason, employee:employees(id, name)')
      .eq('approval_status', 'pending')
      .limit(30),

    // 4. Pending Half-day Permissions
    supabase
      .from('attendance_permissions')
      .select('id, permission_date, first_or_second_half, duration_minutes, reason, employee:employees(id, name)')
      .eq('approval_status', 'pending')
      .limit(30),

    // 5. Pending Early Logoffs
    supabase
      .from('early_logoffs')
      .select('id, logoff_date, actual_departure_time, reason, employee:employees(id, name)')
      .eq('approval_status', 'pending')
      .limit(30),

    // 6. Pending Extended Hours
    supabase
      .from('extended_availability')
      .select('id, session_date, total_minutes, activity_type, employee:employees(id, name), project:projects(id, name)')
      .eq('approval_status', 'pending')
      .limit(30),

    // 7. Pending Weekend Extra Work
    supabase
      .from('extra_work_records')
      .select('id, work_date, work_day_type, total_minutes, work_description, employee:employees(id, name), project:projects(id, name)')
      .eq('approval_status', 'pending')
      .limit(30),

    // 8. Active Revisions
    supabase
      .from('revisions')
      .select('id, revision_number, priority, status, deadline, project:projects(id, name)')
      .neq('status', 'completed')
      .limit(20),

    // 9. Recent Activity Events
    supabase
      .from('activity_events')
      .select('id, event_type, description, created_at, project_id, task_id, employee_id, new_value')
      .order('created_at', { ascending: false })
      .limit(40),

    // 10. Direct Notifications table (if available)
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  // A. TASK ALERTS (Overdue, Blocked, In Review, Approaching Deadline)
  if (tasksRes.status === 'fulfilled' && tasksRes.value.data) {
    const tasks = tasksRes.value.data as any[];
    for (const t of tasks) {
      const projectName = t.project?.name;
      const firstAssignee = t.assignees?.[0]?.employee?.name;

      // Overdue Task
      if (t.due_date && t.due_date < today) {
        synthesized.push({
          id: `overdue-task-${t.id}`,
          event_key: `overdue-task-${t.id}-${t.due_date}`,
          title: `Overdue Task: ${t.title}`,
          message: `Due date was ${t.due_date}.${firstAssignee ? ` Assigned to ${firstAssignee}.` : ''}`,
          category: 'task',
          priority: t.priority === 'urgent' ? 'critical' : 'important',
          related_entity_type: 'task',
          related_entity_id: t.id,
          related_entity_name: projectName || t.title,
          target_route: '/tasks',
          is_read: false,
          created_at: new Date(t.due_date + 'T23:59:59Z').toISOString(),
        });
      }
      // Blocked Task
      else if (t.status === 'blocked') {
        synthesized.push({
          id: `blocked-task-${t.id}`,
          event_key: `blocked-task-${t.id}`,
          title: `Task Blocked: ${t.title}`,
          message: `Requires Lead intervention.${projectName ? ` Project: ${projectName}` : ''}`,
          category: 'task',
          priority: 'critical',
          related_entity_type: 'task',
          related_entity_id: t.id,
          related_entity_name: projectName || t.title,
          target_route: '/tasks',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
      // Task Ready For Review
      else if (t.status === 'in_review') {
        synthesized.push({
          id: `review-task-${t.id}`,
          event_key: `review-task-${t.id}`,
          title: `Task Ready for Review: ${t.title}`,
          message: `${firstAssignee || 'Team member'} submitted this task for review.${projectName ? ` Project: ${projectName}` : ''}`,
          category: 'task',
          priority: 'important',
          related_entity_type: 'task',
          related_entity_id: t.id,
          related_entity_name: projectName || t.title,
          target_route: '/tasks',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
      // Due Today
      else if (t.due_date === today) {
        synthesized.push({
          id: `duetoday-task-${t.id}`,
          event_key: `duetoday-task-${t.id}-${today}`,
          title: `Deadline Today: ${t.title}`,
          message: `Scheduled for completion today.${projectName ? ` Project: ${projectName}` : ''}`,
          category: 'task',
          priority: 'normal',
          related_entity_type: 'task',
          related_entity_id: t.id,
          related_entity_name: projectName || t.title,
          target_route: '/tasks',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  // B. PROJECT ALERTS (Overdue Delivery, Revisions)
  if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
    const projects = projectsRes.value.data as any[];
    for (const p of projects) {
      if (p.target_delivery_date && p.target_delivery_date < today) {
        synthesized.push({
          id: `overdue-proj-${p.id}`,
          event_key: `overdue-proj-${p.id}-${p.target_delivery_date}`,
          title: `Project Target Date Missed: ${p.name}`,
          message: `Target delivery date was ${p.target_delivery_date}. Status: ${p.status}.`,
          category: 'project',
          priority: 'critical',
          related_entity_type: 'project',
          related_entity_id: p.id,
          related_entity_name: p.name,
          target_route: `/projects/${p.id}`,
          is_read: false,
          created_at: new Date(p.target_delivery_date + 'T23:59:59Z').toISOString(),
        });
      }
    }
  }

  // Active Revisions
  if (revsRes.status === 'fulfilled' && revsRes.value.data) {
    const revisions = revsRes.value.data as any[];
    for (const r of revisions) {
      const projName = r.project?.name;
      synthesized.push({
        id: `rev-${r.id}`,
        event_key: `rev-${r.id}-${r.status}`,
        title: `Revision #${r.revision_number} Awaiting Completion`,
        message: `${projName ? `Project ${projName}: ` : ''}Priority is ${r.priority}.${r.deadline ? ` Deadline: ${r.deadline}` : ''}`,
        category: 'project',
        priority: r.priority === 'urgent' ? 'critical' : 'important',
        related_entity_type: 'project',
        related_entity_id: r.id,
        related_entity_name: projName,
        target_route: '/revisions',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // C. ATTENDANCE & HR APPROVALS
  // Leaves
  if (leavesRes.status === 'fulfilled' && leavesRes.value.data) {
    const leaves = leavesRes.value.data as any[];
    for (const l of leaves) {
      const empName = l.employee?.name || 'Employee';
      synthesized.push({
        id: `leave-${l.id}`,
        event_key: `leave-${l.id}`,
        title: `Leave Approval Pending: ${empName}`,
        message: `${empName} requested ${l.num_days} day(s) ${l.category?.replace(/_/g, ' ')} (${l.start_date} to ${l.end_date}).`,
        category: 'attendance',
        priority: 'important',
        related_entity_type: 'leave',
        related_entity_id: l.id,
        related_entity_name: empName,
        target_route: '/leave',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Half-Day Permissions
  if (permsRes.status === 'fulfilled' && permsRes.value.data) {
    const perms = permsRes.value.data as any[];
    for (const p of perms) {
      const empName = p.employee?.name || 'Employee';
      synthesized.push({
        id: `perm-${p.id}`,
        event_key: `perm-${p.id}`,
        title: `Half-Day Permission Request: ${empName}`,
        message: `${empName} requested ${p.duration_minutes}m permission on ${p.permission_date} (${p.first_or_second_half}).`,
        category: 'attendance',
        priority: 'important',
        related_entity_type: 'attendance',
        related_entity_id: p.id,
        related_entity_name: empName,
        target_route: '/attendance',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Early Log-offs
  if (earlyRes.status === 'fulfilled' && earlyRes.value.data) {
    const early = earlyRes.value.data as any[];
    for (const e of early) {
      const empName = e.employee?.name || 'Employee';
      synthesized.push({
        id: `early-${e.id}`,
        event_key: `early-${e.id}`,
        title: `Early Log-Off Request: ${empName}`,
        message: `${empName} requested early log-off on ${e.logoff_date} (departs: ${e.actual_departure_time?.slice(0, 5)}).`,
        category: 'attendance',
        priority: 'important',
        related_entity_type: 'attendance',
        related_entity_id: e.id,
        related_entity_name: empName,
        target_route: '/attendance',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Extended Availability
  if (extRes.status === 'fulfilled' && extRes.value.data) {
    const ext = extRes.value.data as any[];
    for (const x of ext) {
      const empName = x.employee?.name || 'Employee';
      synthesized.push({
        id: `ext-${x.id}`,
        event_key: `ext-${x.id}`,
        title: `Extended Hours Awaiting Approval: ${empName}`,
        message: `${empName} logged ${x.total_minutes}m late availability on ${x.session_date}.`,
        category: 'attendance',
        priority: 'important',
        related_entity_type: 'attendance',
        related_entity_id: x.id,
        related_entity_name: empName,
        target_route: '/attendance',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Extra Weekend Work
  if (extraRes.status === 'fulfilled' && extraRes.value.data) {
    const extra = extraRes.value.data as any[];
    for (const w of extra) {
      const empName = w.employee?.name || 'Employee';
      synthesized.push({
        id: `extra-${w.id}`,
        event_key: `extra-${w.id}`,
        title: `Weekend Work Awaiting Approval: ${empName}`,
        message: `${empName} logged ${w.work_day_type} extra session (${w.total_minutes}m) on ${w.work_date}.`,
        category: 'attendance',
        priority: 'important',
        related_entity_type: 'attendance',
        related_entity_id: w.id,
        related_entity_name: empName,
        target_route: '/attendance',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // D. ACTIVITY EVENTS (Stream of real recent occurrences)
  if (activityRes.status === 'fulfilled' && activityRes.value.data) {
    const activities = activityRes.value.data as any[];
    for (const a of activities) {
      const eventKey = `act-${a.id}`;
      let title = 'Activity Update';
      let category: NotificationCategory = 'system';
      let priority: NotificationPriority = 'informational';
      let target_route = '/dashboard';

      switch (a.event_type) {
        case 'task_created':
          title = 'New Task Created';
          category = 'task';
          priority = 'normal';
          target_route = '/tasks';
          break;
        case 'task_completed':
          title = 'Task Completed';
          category = 'task';
          priority = 'informational';
          target_route = '/tasks';
          break;
        case 'project_created':
          title = 'New Project Initialised';
          category = 'project';
          priority = 'normal';
          target_route = a.project_id ? `/projects/${a.project_id}` : '/projects';
          break;
        case 'project_delivered':
          title = 'Project Delivered to Client';
          category = 'project';
          priority = 'informational';
          target_route = a.project_id ? `/projects/${a.project_id}` : '/projects';
          break;
        case 'employee_created':
          title = 'Team Member Added';
          category = 'team';
          priority = 'normal';
          target_route = a.employee_id ? `/team/${a.employee_id}` : '/team';
          break;
        case 'delivery_created':
          title = 'Delivery Milestone Recorded';
          category = 'project';
          priority = 'normal';
          target_route = '/revisions';
          break;
        case 'revision_created':
          title = 'Client Revision Requested';
          category = 'project';
          priority = 'important';
          target_route = '/revisions';
          break;
        case 'leave_created':
          title = 'Leave Request Logged';
          category = 'attendance';
          priority = 'important';
          target_route = '/leave';
          break;
        case 'permission_created':
          title = 'Permission Window Submitted';
          category = 'attendance';
          priority = 'important';
          target_route = '/attendance';
          break;
        default:
          title = 'Operational Event';
          category = 'system';
          priority = 'informational';
          break;
      }

      synthesized.push({
        id: eventKey,
        event_key: eventKey,
        title,
        message: a.description || 'System event recorded in TeamFlow ledger.',
        category,
        priority,
        related_entity_id: a.project_id || a.task_id || a.employee_id,
        target_route,
        is_read: false,
        created_at: a.created_at || new Date().toISOString(),
      });
    }
  }

  // E. DEDICATED DB NOTIFICATIONS TABLE (Merge if existing)
  if (dbNotifsRes.status === 'fulfilled' && dbNotifsRes.value.data) {
    const dbNotifs = dbNotifsRes.value.data as any[];
    for (const d of dbNotifs) {
      synthesized.push({
        id: d.id,
        event_key: d.event_key || d.id,
        title: d.title,
        message: d.message,
        category: d.category as NotificationCategory,
        priority: d.priority as NotificationPriority,
        related_entity_type: d.related_entity_type,
        related_entity_id: d.related_entity_id,
        related_entity_name: d.related_entity_name,
        target_route: d.target_route || '/dashboard',
        is_read: Boolean(d.is_read),
        read_at: d.read_at,
        created_at: d.created_at,
        metadata: d.metadata,
      });
    }
  }

  // Apply Deduplication & Filtering
  const seenKeys = new Set<string>();
  const finalItems: NotificationItem[] = [];

  for (const item of synthesized) {
    if (seenKeys.has(item.event_key)) continue;
    seenKeys.add(item.event_key);

    // Filter out dismissed items
    if (dismissedSet.has(item.id) || dismissedSet.has(item.event_key)) {
      continue;
    }

    // Apply Read state from local persistence or DB
    const isRead = readSet.has(item.id) || readSet.has(item.event_key) || item.is_read;

    // Apply Notification Preferences (Rule 13: Critical alerts are NEVER suppressed!)
    if (item.priority !== 'critical') {
      if (item.category === 'task' && !preferences.taskUpdates) continue;
      if (item.category === 'project' && !preferences.projectUpdates) continue;
      if (item.category === 'attendance' && !preferences.attendanceAndHr) continue;
      if (item.category === 'import' && !preferences.excelImports) continue;
      if (item.category === 'system' && !preferences.reportsAndBackups) continue;
    }

    finalItems.push({
      ...item,
      is_read: isRead,
    });
  }

  // Sort: Unread first, then priority (critical > important > normal > informational), then newest
  const priorityWeight: Record<NotificationPriority, number> = {
    critical: 4,
    important: 3,
    normal: 2,
    informational: 1,
  };

  finalItems.sort((a, b) => {
    // Unread vs Read
    if (!a.is_read && b.is_read) return -1;
    if (a.is_read && !b.is_read) return 1;

    // Priority
    const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pDiff !== 0) return pDiff;

    // Timestamp
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return finalItems;
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string) {
  const state = getLocalState();
  if (!state.readIds.includes(id)) {
    state.readIds.push(id);
    saveLocalState(state);
  }

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Safe to ignore if table does not exist
  }
}

/**
 * Mark a single notification as unread
 */
export async function markNotificationAsUnread(id: string) {
  const state = getLocalState();
  state.readIds = state.readIds.filter((item) => item !== id);
  saveLocalState(state);

  try {
    await supabase
      .from('notifications')
      .update({ is_read: false, read_at: null })
      .eq('id', id);
  } catch {
    // Safe to ignore
  }
}

/**
 * Mark all given notifications as read
 */
export async function markAllNotificationsAsRead(ids: string[]) {
  const state = getLocalState();
  const existingSet = new Set(state.readIds);
  for (const id of ids) {
    existingSet.add(id);
  }
  state.readIds = Array.from(existingSet);
  saveLocalState(state);

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids);
  } catch {
    // Safe to ignore
  }
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(id: string) {
  const state = getLocalState();
  if (!state.dismissedIds.includes(id)) {
    state.dismissedIds.push(id);
    saveLocalState(state);
  }

  try {
    await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Safe to ignore
  }
}

/**
 * Bulk dismiss notifications
 */
export async function bulkDismissNotifications(ids: string[]) {
  const state = getLocalState();
  const set = new Set(state.dismissedIds);
  for (const id of ids) {
    set.add(id);
  }
  state.dismissedIds = Array.from(set);
  saveLocalState(state);

  try {
    await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .in('id', ids);
  } catch {
    // Safe to ignore
  }
}

/**
 * Create a new notification (used by reports, Excel import, backup)
 */
export async function createNotification(
  params: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>
) {
  const payload = {
    ...params,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('notifications').insert([payload]);
  } catch (err) {
    console.warn('Failed to insert into notifications table:', err);
  }

  window.dispatchEvent(new CustomEvent('teamflow:notifications-updated'));
}
