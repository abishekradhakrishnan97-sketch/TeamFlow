import { Project, Task } from '@/types';

/**
 * Returns all projects associated with an employee:
 * - Projects where employee is owner / lead
 * - Projects where employee is in members list
 * - Projects where employee has any assigned tasks
 */
export function getEmployeeProjects(
  employeeId: string,
  allProjects: Project[],
  employeeTasks: Task[] = []
): Project[] {
  // 1. Gather all project IDs from the employee's assigned tasks
  const taskProjectIds = new Set(
    employeeTasks
      .map((t) => t.project_id || t.project?.id)
      .filter((id): id is string => Boolean(id))
  );

  // 2. Filter from all projects
  const matchedProjects = allProjects.filter((p) => {
    // Is project owner
    if (p.owner_id === employeeId || p.owner?.id === employeeId) return true;

    // Is in project members
    if (
      p.members?.some(
        (m: any) =>
          m.employee_id === employeeId ||
          m.employee?.id === employeeId
      )
    ) {
      return true;
    }

    // Has assigned tasks in project
    if (taskProjectIds.has(p.id)) {
      return true;
    }

    return false;
  });

  // 3. Fallback: if employeeTasks reference a project that wasn't in allProjects, include it
  const matchedIds = new Set(matchedProjects.map((p) => p.id));
  employeeTasks.forEach((t) => {
    if (t.project && !matchedIds.has(t.project.id)) {
      matchedIds.add(t.project.id);
      matchedProjects.push(t.project);
    }
  });

  return matchedProjects;
}
