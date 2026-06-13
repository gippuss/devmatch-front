import { apiClient } from './apiClient'
import type {
  AuthResponse,
  User,
  Project,
  ProjectRole,
  Application,
  ApplicationWithApplicant,
  ApplicationWithRole,
  Tag,
  Skill,
  ProjectListFilter,
  ProjectStatus,
  ApplicationStatus,
} from '../types/api'

// Auth
export const authApi = {
  register: (email: string, username: string, password: string) =>
    apiClient.post<AuthResponse>('/api/v1/auth/register', { email, username, password }),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/api/v1/auth/login', { email, password }),

  refresh: (refresh_token: string) =>
    apiClient.post<AuthResponse>('/api/v1/auth/refresh', { refresh_token }),

  logout: (refresh_token: string) =>
    apiClient.post<void>('/api/v1/auth/logout', { refresh_token }),
}

// Current user
export const meApi = {
  get: () => apiClient.get<User>('/api/v1/me'),

  update: (data: { username?: string; bio?: string; avatar_url?: string; skill_ids?: number[] }) =>
    apiClient.patch<User>('/api/v1/me', data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return apiClient.postForm<User>('/api/v1/me/avatar', form)
  },

  deleteAvatar: () => apiClient.delete<User>('/api/v1/me/avatar'),
}

// Projects
export const projectsApi = {
  list: (filter?: ProjectListFilter) => {
    const params = new URLSearchParams()
    if (filter?.q) params.set('q', filter.q)
    if (filter?.status) params.set('status', filter.status)
    if (filter?.tag_ids) params.set('tag_ids', filter.tag_ids)
    if (filter?.skill_ids) params.set('skill_ids', filter.skill_ids)
    if (filter?.limit !== undefined) params.set('limit', String(filter.limit))
    if (filter?.offset !== undefined) params.set('offset', String(filter.offset))
    const qs = params.toString()
    return apiClient.get<{ items: Project[] }>(`/api/v1/projects${qs ? `?${qs}` : ''}`)
  },

  getById: (id: number) => apiClient.get<Project>(`/api/v1/projects/${id}`),

  create: (data: { title: string; description: string; status?: ProjectStatus; tag_ids?: number[] }) =>
    apiClient.post<Project>('/api/v1/projects', data),

  update: (id: number, data: { title?: string; description?: string; status?: ProjectStatus; tag_ids?: number[] }) =>
    apiClient.patch<Project>(`/api/v1/projects/${id}`, data),

  delete: (id: number) => apiClient.delete<void>(`/api/v1/projects/${id}`),

  addRole: (projectId: number, data: { role_name: string; grade?: string; slots_total: number }) =>
    apiClient.post<ProjectRole>(`/api/v1/projects/${projectId}/roles`, data),

  updateRole: (projectRoleId: number, data: { role_name: string; grade?: string; slots_total: number }) =>
    apiClient.patch<ProjectRole>(`/api/v1/project-roles/${projectRoleId}`, data),

  deleteRole: (projectRoleId: number) =>
    apiClient.delete<void>(`/api/v1/project-roles/${projectRoleId}`),

  getApplications: (projectId: number) =>
    apiClient.get<{ items: ApplicationWithApplicant[] }>(`/api/v1/projects/${projectId}/applications`),

  listMine: () =>
    apiClient.get<{ items: Project[] }>('/api/v1/me/projects'),
}

// Applications
export const applicationsApi = {
  apply: (projectRoleId: number, message: string) =>
    apiClient.post<Application>(`/api/v1/project-roles/${projectRoleId}/applications`, { message }),

  updateStatus: (applicationId: number, status: ApplicationStatus) =>
    apiClient.patch<Application>(`/api/v1/applications/${applicationId}/status`, { status }),

  listMine: () =>
    apiClient.get<{ items: ApplicationWithRole[] }>('/api/v1/me/applications'),
}

// Users
export const usersApi = {
  getProfile: (userId: number) => apiClient.get<User>(`/api/v1/users/${userId}`),
}

// Admin
export const adminApi = {
  listProjects: (filter?: { q?: string; status?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams()
    if (filter?.q) params.set('q', filter.q)
    if (filter?.status) params.set('status', filter.status)
    if (filter?.limit !== undefined) params.set('limit', String(filter.limit))
    if (filter?.offset !== undefined) params.set('offset', String(filter.offset))
    const qs = params.toString()
    return apiClient.get<{ items: Project[] }>(`/api/v1/admin/projects${qs ? `?${qs}` : ''}`)
  },

  banProject: (id: number, reason: string) =>
    apiClient.post<Project>(`/api/v1/admin/projects/${id}/ban`, { reason }),

  unbanProject: (id: number) =>
    apiClient.post<Project>(`/api/v1/admin/projects/${id}/unban`, {}),

  reviewAppeal: (id: number, approve: boolean, newBanReason?: string) =>
    apiClient.post<Project>(`/api/v1/admin/projects/${id}/appeal/review`, {
      approve,
      new_ban_reason: newBanReason ?? '',
    }),

  listProjectApplications: (projectId: number) =>
    apiClient.get<{ items: ApplicationWithApplicant[] }>(`/api/v1/admin/projects/${projectId}/applications`),

  deleteProject: (id: number) => apiClient.delete<void>(`/api/v1/admin/projects/${id}`),
}

// Appeal (owner)
export const appealApi = {
  submit: (projectId: number, comment: string) =>
    apiClient.post<Project>(`/api/v1/projects/${projectId}/appeal`, { comment }),
}

// Dictionaries
export const dictionariesApi = {
  getTags: () => apiClient.get<{ items: Tag[] }>('/api/v1/tags'),
  getSystemTags: () => apiClient.get<{ items: Tag[] }>('/api/v1/tags/system'),
  getSkills: () => apiClient.get<{ items: Skill[] }>('/api/v1/skills'),
  createTag: (name: string) => apiClient.post<Tag>('/api/v1/tags', { name }),
  deleteTag: (tagId: number) => apiClient.delete<void>(`/api/v1/tags/${tagId}`),
}
