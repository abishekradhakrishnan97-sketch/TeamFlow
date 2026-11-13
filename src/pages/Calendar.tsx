import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { getProjects } from '@/services/supabase/projects';
import { getTasks } from '@/services/supabase/tasks';
import { getLeaveRecords } from '@/services/supabase/leave';
import { getRevisions } from '@/services/supabase/revisions';
import { getHolidays } from '@/services/supabase/settings';
import { Project, Task, LeaveRecord, Revision, Holiday } from '@/types';
import {
  getMonthDays,
  formatDate,
  formatMonthYear,
  isToday,
} from '@/utils/dates';
import { useToast } from '@/store/useAppStore';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  CheckSquare,
  History,
  Plane,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'project' | 'task' | 'revision' | 'leave' | 'holiday';
  color: string;
}

export const CalendarPage: React.FC = () => {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [projects, tasks, leaves, revisions, holidays] = await Promise.all([
        getProjects({ includeArchived: false }),
        getTasks(),
        getLeaveRecords(),
        getRevisions(),
        getHolidays(),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Project target delivery dates
      projects.forEach((p) => {
        if (p.target_delivery_date) {
          calendarEvents.push({
            id: `p-${p.id}`,
            title: `[Project] ${p.name}`,
            date: p.target_delivery_date,
            type: 'project',
            color: 'bg-indigo-50 text-accent border-indigo-200',
          });
        }
      });

      // Task due dates
      tasks.forEach((t) => {
        if (t.due_date && t.status !== 'completed') {
          calendarEvents.push({
            id: `t-${t.id}`,
            title: `[Task] ${t.title}`,
            date: t.due_date,
            type: 'task',
            color: 'bg-amber-50 text-amber-700 border-amber-200',
          });
        }
      });

      // Revision deadlines
      revisions.forEach((r) => {
        if (r.deadline && r.status !== 'completed') {
          calendarEvents.push({
            id: `r-${r.id}`,
            title: `[Rev #${r.revision_number}] ${r.project?.name || ''}`,
            date: r.deadline,
            type: 'revision',
            color: 'bg-rose-50 text-danger border-rose-200',
          });
        }
      });

      // Leaves
      leaves.forEach((l) => {
        calendarEvents.push({
          id: `l-${l.id}`,
          title: `[Leave] ${l.employee?.name} (${l.category.replace(/_/g, ' ')})`,
          date: l.start_date,
          type: 'leave',
          color: 'bg-emerald-50 text-success border-emerald-200',
        });
      });

      // Holidays
      holidays.forEach((h) => {
        calendarEvents.push({
          id: `h-${h.id}`,
          title: `[Holiday] ${h.name}`,
          date: h.date,
          type: 'holiday',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
        });
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthDays = getMonthDays(currentDate.getFullYear(), currentDate.getMonth() + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Operations Calendar</h2>
          <p className="text-xs text-secondary mt-0.5">
            Unified view of project deliverables, task deadlines, revision rounds, employee leaves and holidays
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-border rounded-lg shadow-xs p-1">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded text-secondary hover:text-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-primary min-w-[130px] text-center">
              {formatMonthYear(currentDate)}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded text-secondary hover:text-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Current Month
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap bg-white p-3 rounded-lg border border-border">
        <span className="flex items-center gap-1.5 font-medium text-accent">
          <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Project Deliveries
        </span>
        <span className="flex items-center gap-1.5 font-medium text-amber-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Task Deadlines
        </span>
        <span className="flex items-center gap-1.5 font-medium text-danger">
          <span className="w-2.5 h-2.5 rounded-full bg-danger" /> Revision Deadlines
        </span>
        <span className="flex items-center gap-1.5 font-medium text-success">
          <span className="w-2.5 h-2.5 rounded-full bg-success" /> Employee Leaves
        </span>
        <span className="flex items-center gap-1.5 font-medium text-purple-600">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Holidays
        </span>
      </div>

      {/* Month Calendar Grid */}
      <Card className="p-4 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden text-center text-xs font-semibold">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-gray-50 py-2 text-secondary font-bold">
              {d}
            </div>
          ))}

          {/* Days */}
          {monthDays.map((day, idx) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayEvents = events.filter((e) => e.date === dateStr);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={idx}
                className={`min-h-[110px] bg-white p-2 flex flex-col text-left transition-colors hover:bg-gray-50/50 ${
                  isCurrentDay ? 'bg-indigo-50/30' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      isCurrentDay ? 'bg-accent text-white' : 'text-primary'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-semibold text-secondary">
                      {dayEvents.length} items
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      title={ev.title}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate ${ev.color}`}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

