export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT' | 'COMPANY';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type PlacementStatus = 'not_placed' | 'placed' | 'opted_out' | 'seeking' | 'not_interested' | 'NOT_PLACED' | 'PLACED' | 'OPTED_OUT' | 'SEEKING' | 'NOT_INTERESTED';
export const PlacementStatus = {
  NOT_PLACED: 'not_placed' as const,
  PLACED: 'placed' as const,
  OPTED_OUT: 'opted_out' as const,
  SEEKING: 'seeking' as const,
  NOT_INTERESTED: 'not_interested' as const,
};

export interface EducationItem {
  degree: string;
  institution: string;
  start_year: number;
  end_year?: number;
  gpa?: number;
}

export interface ProjectItem {
  title: string;
  description: string;
  tech_stack: string[];
  github_url?: string;
  live_url?: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  issue_date?: string;
  credential_url?: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  student_id_number: string;
  department: string;
  batch_year: number;
  gpa: number;
  bio?: string | null;
  about?: string | null;
  resume_url?: string | null;
  resume_filename?: string | null;
  resume_updated_at?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  skills: string[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  placement_status: PlacementStatus | string;
  completion_percentage?: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface FacultyProfile {
  id: number;
  user_id: number;
  employee_id: string;
  department: string;
  designation: string;
  phone?: string | null;
  cabin_location?: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface CompanyContact {
  id: number;
  company_id: number;
  contact_name: string;
  email: string;
  phone: string;
  designation: string;
  is_primary: boolean;
  created_at: string;
}

export interface CompanyRating {
  id: number;
  company_id: number;
  student_id: number;
  student_name?: string;
  culture_rating: number;
  mentorship_rating: number;
  learning_rating: number;
  work_env_rating: number;
  overall_rating: number;
  review?: string | null;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  registration_number: string;
  industry: string;
  website?: string | null;
  logo_url?: string | null;
  location: string;
  about: string;
  is_verified: boolean;
  is_archived: boolean;
  average_rating: number;
  active_internships_count?: number;
  contacts?: CompanyContact[];
  ratings?: CompanyRating[];
  created_at: string;
  updated_at: string;
}

export type WorkMode = 'on_site' | 'remote' | 'hybrid' | 'ON_SITE' | 'REMOTE' | 'HYBRID';
export const WorkMode = {
  ON_SITE: 'on_site' as const,
  REMOTE: 'remote' as const,
  HYBRID: 'hybrid' as const,
};

export type InternshipStatus = 'draft' | 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'closed' | 'archived' | 'DRAFT' | 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'ARCHIVED';
export const InternshipStatus = {
  DRAFT: 'draft' as const,
  PENDING: 'pending' as const,
  PENDING_APPROVAL: 'pending_approval' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
  CLOSED: 'closed' as const,
  ARCHIVED: 'archived' as const,
};

export interface Internship {
  id: number;
  company_id: number;
  posted_by_user_id?: number | null;
  title: string;
  domain: string;
  description: string;
  responsibilities: string;
  requirements: string;
  eligibility_criteria: string;
  benefits: string;
  location: string;
  work_mode: WorkMode | string;
  stipend_amount: number;
  stipend_currency: string;
  duration_weeks: number;
  openings: number;
  start_date: string;
  end_date: string;
  application_deadline: string;
  skills_required: string[];
  status: InternshipStatus;
  approval_notes?: string | null;
  admin_approval_notes?: string | null;
  is_featured: boolean;
  applications_count?: number;
  is_bookmarked?: boolean;
  company?: Company;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'pending' | 'shortlisted' | 'interview_scheduled' | 'accepted' | 'rejected' | 'withdrawn' | 'PENDING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export const ApplicationStatus = {
  PENDING: 'pending' as const,
  SHORTLISTED: 'shortlisted' as const,
  INTERVIEW_SCHEDULED: 'interview_scheduled' as const,
  ACCEPTED: 'accepted' as const,
  REJECTED: 'rejected' as const,
  WITHDRAWN: 'withdrawn' as const,
};

export interface ApplicationTimeline {
  id: number;
  application_id: number;
  status: ApplicationStatus | string;
  comment?: string | null;
  changed_by_user_id?: number | null;
  changed_by_name?: string | null;
  created_at: string;
}

export interface ApplicationDocument {
  id: number;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

export interface Application {
  id: number;
  internship_id: number;
  student_id: number;
  resume_url: string;
  cover_letter: string;
  qualifications: Record<string, any>;
  status: ApplicationStatus;
  faculty_notes?: string | null;
  faculty_rating?: number | null;
  withdrawn_reason?: string | null;
  applied_at: string;
  updated_at: string;
  internship?: Internship;
  student?: User;
  timeline?: ApplicationTimeline[];
  documents?: ApplicationDocument[];
  // Display helpers from backend
  student_name?: string;
  student_email?: string;
  internship_title?: string;
  company_name?: string;
}

export type InterviewStatus = 'SCHEDULED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'scheduled' | 'rescheduled' | 'completed' | 'cancelled';
export const InterviewStatus = {
  SCHEDULED: 'SCHEDULED' as const,
  RESCHEDULED: 'RESCHEDULED' as const,
  COMPLETED: 'COMPLETED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export type InterviewResult = 'PENDING' | 'PASSED' | 'FAILED' | 'ON_HOLD' | 'pending' | 'passed' | 'failed' | 'on_hold';
export const InterviewResult = {
  PENDING: 'PENDING' as const,
  PASSED: 'PASSED' as const,
  FAILED: 'FAILED' as const,
  ON_HOLD: 'ON_HOLD' as const,
};

export interface Interview {
  id: number;
  application_id: number;
  scheduled_by_user_id?: number | null;
  interviewer_name: string;
  interviewer_email?: string | null;
  round_name: string;
  scheduled_at: string;
  duration_minutes: number;
  location_or_link: string;
  meeting_link?: string | null;
  status: InterviewStatus;
  cancellation_reason?: string | null;
  feedback?: string | null;
  result: InterviewResult;
  student_name?: string;
  student_email?: string;
  internship_title?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export type HiringRecommendation = 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'NEUTRAL' | 'DO_NOT_RECOMMEND' | 'strongly_recommend' | 'recommend' | 'neutral' | 'do_not_recommend';
export const HiringRecommendation = {
  STRONGLY_RECOMMEND: 'STRONGLY_RECOMMEND' as const,
  RECOMMEND: 'RECOMMEND' as const,
  NEUTRAL: 'NEUTRAL' as const,
  DO_NOT_RECOMMEND: 'DO_NOT_RECOMMEND' as const,
};

export interface Evaluation {
  id: number;
  application_id: number;
  internship_id: number;
  student_id: number;
  evaluator_user_id?: number | null;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  teamwork_score: number;
  punctuality_score: number;
  responsibility_score: number;
  learning_ability_score: number;
  overall_score: number;
  strengths?: string | null;
  areas_for_improvement?: string | null;
  comments?: string | null;
  hiring_recommendation: HiringRecommendation;
  is_archived: boolean;
  student_name?: string;
  internship_title?: string;
  company_name?: string;
  evaluator_name?: string;
  created_at: string;
  updated_at: string;
}

export type FeedbackTargetType = 'PLATFORM' | 'COMPANY' | 'INTERNSHIP' | 'SYSTEM' | 'STUDENT' | 'platform' | 'company' | 'internship' | 'system' | 'student';
export const FeedbackTargetType = {
  PLATFORM: 'PLATFORM' as const,
  COMPANY: 'COMPANY' as const,
  INTERNSHIP: 'INTERNSHIP' as const,
  SYSTEM: 'SYSTEM' as const,
  STUDENT: 'STUDENT' as const,
};

export type FeedbackStatus = 'SUBMITTED' | 'IN_REVIEW' | 'REVIEWED' | 'RESOLVED' | 'ARCHIVED' | 'CLOSED' | 'submitted' | 'in_review' | 'reviewed' | 'resolved' | 'archived' | 'closed';
export const FeedbackStatus = {
  SUBMITTED: 'SUBMITTED' as const,
  IN_REVIEW: 'IN_REVIEW' as const,
  REVIEWED: 'REVIEWED' as const,
  RESOLVED: 'RESOLVED' as const,
  ARCHIVED: 'ARCHIVED' as const,
  CLOSED: 'CLOSED' as const,
};

export interface FeedbackItem {
  id: number;
  from_user_id: number;
  from_user_name?: string;
  from_user_role?: string;
  target_type: FeedbackTargetType;
  target_id?: number | null;
  rating?: number | null;
  title: string;
  comment: string;
  status: FeedbackStatus;
  admin_response?: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationCategory = 'APPLICATION' | 'INTERVIEW' | 'EVALUATION' | 'INTERNSHIP' | 'SYSTEM';

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  category: NotificationCategory;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  user_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  details?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface SystemSettingItem {
  id: number;
  key: string;
  value: string;
  description?: string | null;
  updated_at: string;
}

export interface OverviewStats {
  total_students: number;
  total_companies: number;
  active_internships: number;
  total_applications: number;
  total_interviews: number;
  total_placements: number;
  placement_rate: number;
  average_stipend: number;
}

export interface AnalyticsDashboard {
  overview: OverviewStats;
  status_distribution: { status: string; count: number }[];
  domain_distribution: { domain: string; count: number }[];
  monthly_trends: { month: string; applications: number; placements: number }[];
  top_companies: { id: number; name: string; industry: string; internships_count: number; applications_count: number; average_rating: number }[];
  top_students: { id: number; name: string; department: string; gpa: number; applications_count: number; placement_status: string }[];
}
