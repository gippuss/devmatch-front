export type ProjectStatus = 'draft' | 'recruiting' | 'completed' | 'banned'
export type AppealStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface Skill {
  id: number
  name: string
}

export interface Tag {
  id: number
  name: string
  is_system: boolean
}

export interface User {
  id: number
  email: string
  username: string
  bio: string
  avatar_url: string
  is_admin: boolean
  skills: Skill[]
  created_at: string
}

export interface ProjectRole {
  id: number
  project_id: number
  role_name: string
  grade: string
  slots_total: number
  slots_filled: number
}

export interface Project {
  id: number
  owner_id: number
  owner: User
  title: string
  description: string
  status: ProjectStatus
  tags: Tag[]
  roles?: ProjectRole[]
  applications_count?: number
  ban_reason?: string
  appeal_status?: AppealStatus
  appeal_comment?: string
  created_at: string
}

export interface Application {
  id: number
  user_id: number
  project_role_id: number
  status: ApplicationStatus
  message: string
  created_at: string
}

export interface ApplicationWithApplicant extends Application {
  applicant: User
}

export interface ApplicationWithRole extends Application {
  role_name: string
  project_id: number
  project_title: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  access_expires_at: string
  refresh_expires_at: string
}

export interface AuthResponse {
  user: User
  token: TokenPair
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

export interface ProjectsListResponse {
  items: Project[]
}

export interface ApplicationsListResponse {
  items: ApplicationWithApplicant[]
}

export interface TagsListResponse {
  items: Tag[]
}

export interface SkillsListResponse {
  items: Skill[]
}

export interface ProjectListFilter {
  q?: string
  status?: ProjectStatus
  tag_ids?: string
  skill_ids?: string
  limit?: number
  offset?: number
}
