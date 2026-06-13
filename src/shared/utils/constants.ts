import type { ProjectStatus, ApplicationStatus } from '../types/api'

export const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  recruiting: 'Recruiting',
  completed: 'Completed',
  banned: 'Banned',
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'draft',
  'recruiting',
  'completed',
]
