import React from 'react';
import { Card } from '@/components/shared/Card';
import { Employee, Task } from '@/types';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CHART_PALETTE, getTaskCategory } from '@/utils/chartTheme';

interface TeamWorkloadBarProps {
  employees: Employee[];
  tasks: Task[];
  className?: string;
}

export const TeamWorkloadBar: React.FC<TeamWorkloadBarProps> = ({ employees, tasks, className }) => {
  const navigate = useNavigate();

  const employeeWorkload = employees.map((emp) => {
    const assignedTasks = tasks.filter((t) =>
      t.assignees?.some(
        (a: any) => a.employee?.id === emp.id || a.employee_id === emp.id
      )
    );
    const activeTasks = assignedTasks.filter((t) => t.status !== 'completed');
    const completedTasks = assignedTasks.filter((t) => t.status === 'completed');
    const workingTasks = assignedTasks.filter((t) => t.status === 'working');

    // Categorize active tasks
    let designCount = 0;
    let devCount = 0;
    let qaCount = 0;
    let docCount = 0;
    let otherCount = 0;

    activeTasks.forEach((t) => {
      const cat = getTaskCategory(t.title, t.description);
      if (cat.key === 'design') designCount++;
      else if (cat.key === 'dev') devCount++;
      else if (cat.key === 'qa') qaCount++;
      else if (cat.key === 'content') docCount++;
      else otherCount++;
    });

    const activeTotal = activeTasks.length;

    return {
      emp,
      totalAssigned: assignedTasks.length,
      activeCount: activeTotal,
      completedCount: completedTasks.length,
      workingCount: workingTasks.length,
      categories: {
        design: designCount,
        dev: devCount,
        qa: qaCount,
        doc: docCount,
        other: otherCount,
      },
    };
  });

  // Sort employees by active load descending
  employeeWorkload.sort((a, b) => b.activeCount - a.activeCount);

  return (
    <Card className={`p-6 border-[0.5px] border-black bg-surface flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFAED0]/30 border-[0.5px] border-black flex items-center justify-center">
              <Users className="w-4 h-4 text-[#782046]" />
            </div>
            <span>Team Workload & Cross-Functional Allocation</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEE9DD] text-primary border-[0.5px] border-black">
            {employees.length} Team Members
          </span>
        </div>
        <p className="text-xs text-secondary mb-5">
          Real-time workload distribution to monitor multidisciplinary capacity and identify bottlenecks
        </p>

        {employeeWorkload.length === 0 ? (
          <div className="py-10 text-center text-xs text-secondary italic">
            No team members registered yet
          </div>
        ) : (
          <div className="space-y-4">
            {employeeWorkload.map(({ emp, activeCount, completedCount, workingCount, categories }) => {
              const maxScale = Math.max(...employeeWorkload.map((e) => e.activeCount), 1);
              const relativeWidth = activeCount > 0 ? Math.max((activeCount / maxScale) * 100, 15) : 0;

              // Proportions inside the active bar
              const designPct = activeCount > 0 ? (categories.design / activeCount) * 100 : 0;
              const devPct = activeCount > 0 ? (categories.dev / activeCount) * 100 : 0;
              const qaPct = activeCount > 0 ? (categories.qa / activeCount) * 100 : 0;
              const docPct = activeCount > 0 ? (categories.doc / activeCount) * 100 : 0;
              const otherPct = activeCount > 0 ? (categories.other / activeCount) * 100 : 0;

              return (
                <div
                  key={emp.id}
                  onClick={() => navigate(`/team/${emp.id}`)}
                  className="p-3 rounded-xl border-[0.5px] border-black/20 bg-[#FFFDF7] hover:bg-[#EEE9DD]/35 transition-all cursor-pointer group shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#EEE9DD] text-primary font-bold flex items-center justify-center text-[11px] shrink-0 border-[0.5px] border-black/30">
                        {emp.initials || emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-primary group-hover:text-accent transition-colors truncate block">
                          {emp.name}
                        </span>
                        <span className="text-[10px] text-secondary truncate block">
                          {emp.designation}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0">
                      {activeCount > 4 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E99A88]/30 text-[#731E1E] border-[0.5px] border-black/20 inline-flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> High Load
                        </span>
                      ) : activeCount === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A9BB78]/30 text-[#2D3E16] border-[0.5px] border-black/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Available
                        </span>
                      ) : null}

                      <span className="font-bold text-primary text-xs">
                        {activeCount} active
                      </span>
                      <span className="text-[11px] text-secondary font-medium">
                        ({completedCount} done)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Stacked Bar */}
                  <div className="w-full h-3 rounded-full bg-[#EEE9DD] overflow-hidden flex border-[0.5px] border-black/20">
                    {activeCount === 0 ? (
                      <div className="w-full h-full bg-[#EEE9DD] flex items-center justify-center text-[9px] text-secondary font-medium">
                        No active tasks
                      </div>
                    ) : (
                      <div className="h-full flex" style={{ width: `${relativeWidth}%` }}>
                        {categories.design > 0 && (
                          <div
                            style={{ width: `${designPct}%`, backgroundColor: CHART_PALETTE.pink.base }}
                            title={`Design Tasks: ${categories.design}`}
                            className="h-full"
                          />
                        )}
                        {categories.dev > 0 && (
                          <div
                            style={{ width: `${devPct}%`, backgroundColor: CHART_PALETTE.blue.base }}
                            title={`Dev Tasks: ${categories.dev}`}
                            className="h-full"
                          />
                        )}
                        {categories.qa > 0 && (
                          <div
                            style={{ width: `${qaPct}%`, backgroundColor: CHART_PALETTE.teal.base }}
                            title={`QA / Testing Tasks: ${categories.qa}`}
                            className="h-full"
                          />
                        )}
                        {categories.doc > 0 && (
                          <div
                            style={{ width: `${docPct}%`, backgroundColor: CHART_PALETTE.purple.base }}
                            title={`Content / Docs Tasks: ${categories.doc}`}
                            className="h-full"
                          />
                        )}
                        {categories.other > 0 && (
                          <div
                            style={{ width: `${otherPct}%`, backgroundColor: CHART_PALETTE.yellow.base }}
                            title={`General Tasks: ${categories.other}`}
                            className="h-full"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-4 mt-2 border-t-[0.5px] border-black/15 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.pink.base }} />
          <span className="text-secondary font-medium">Design</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.blue.base }} />
          <span className="text-secondary font-medium">Dev</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.teal.base }} />
          <span className="text-secondary font-medium">Testing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.purple.base }} />
          <span className="text-secondary font-medium">Docs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_PALETTE.yellow.base }} />
          <span className="text-secondary font-medium">Other</span>
        </div>
      </div>
    </Card>
  );
};

