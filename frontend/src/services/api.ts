import {
  User, StudentProfile, FacultyProfile, Company, Internship,
  Application, Interview, Evaluation, FeedbackItem, NotificationItem,
  AuditLogItem, SystemSettingItem, AnalyticsDashboard,
  WorkMode, InternshipStatus, ApplicationStatus, InterviewStatus, InterviewResult,
  HiringRecommendation, FeedbackTargetType
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000')
    ? `http://${window.location.hostname || 'localhost'}:8000/api/v1`
    : '/api/v1');

class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('cims_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An error occurred while communicating with the server.';
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
      }
    } catch (_) {}

    if (response.status === 401) {
      localStorage.removeItem('cims_token');
      localStorage.removeItem('cims_user');
      window.dispatchEvent(new Event('auth_state_changed'));
    }

    throw new ApiError(errorDetail, response.status, errorData);
  }

  // Handle empty or file responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData: any) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getMe: () => request<User>('/auth/me'),

  changePassword: (passwords: { current_password: string; new_password: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>(`/auth/forgot-password?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    }),

  // Students
  getMyStudentProfile: () => request<StudentProfile>('/students/me/profile'),
  updateMyStudentProfile: (profile: Partial<StudentProfile>) =>
    request<StudentProfile>('/students/me/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ message: string; resume_url: string; resume_filename: string; file_size: number }>('/students/me/resume', {
      method: 'POST',
      body: formData,
    });
  },
  listStudents: (params?: { search?: string; department?: string; placement_status?: string; min_gpa?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.department) query.append('department', params.department);
    if (params?.placement_status) query.append('placement_status', params.placement_status);
    if (params?.min_gpa) query.append('min_gpa', params.min_gpa.toString());
    return request<StudentProfile[]>(`/students?${query.toString()}`);
  },
  getStudentById: (userId: number) => request<StudentProfile>(`/students/${userId}`),
  deactivateStudent: (userId: number) =>
    request<{ message: string }>(`/students/${userId}/deactivate`, { method: 'POST' }),
  activateStudent: (userId: number) =>
    request<{ message: string }>(`/students/${userId}/activate`, { method: 'POST' }),

  // Faculty
  getMyFacultyProfile: () => request<FacultyProfile>('/faculty/me/profile'),
  updateMyFacultyProfile: (profile: Partial<FacultyProfile>) =>
    request<FacultyProfile>('/faculty/me/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  listFaculty: () => request<FacultyProfile[]>('/faculty'),

  // Companies
  listCompanies: (params?: { search?: string; industry?: string; include_archived?: boolean; limit?: number; skip?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.industry) query.append('industry', params.industry);
    if (params?.include_archived) query.append('include_archived', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());
    return request<Company[]>(`/companies?${query.toString()}`);
  },
  getCompany: (id: number) => request<Company>(`/companies/${id}`),
  createCompany: (company: any) =>
    request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    }),
  updateCompany: (id: number, data: any) =>
    request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  archiveCompany: (id: number) =>
    request<{ message: string; is_archived: boolean }>(`/companies/${id}/archive`, {
      method: 'POST',
    }),
  rateCompany: (companyId: number, rating: any) =>
    request<any>(`/companies/${companyId}/ratings`, {
      method: 'POST',
      body: JSON.stringify(rating),
    }),
  addCompanyContact: (companyId: number, contact: any) =>
    request<any>(`/companies/${companyId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(contact),
    }),

  // Internships
  listInternships: (params?: {
    search?: string;
    domain?: string;
    location?: string;
    work_mode?: string;
    min_stipend?: number;
    duration_weeks?: number;
    company_id?: number;
    status_filter?: string;
    is_featured?: boolean;
    sort_by?: string;
    limit?: number;
    skip?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.domain) query.append('domain', params.domain);
    if (params?.location) query.append('location', params.location);
    if (params?.work_mode) query.append('work_mode', params.work_mode);
    if (params?.min_stipend) query.append('min_stipend', params.min_stipend.toString());
    if (params?.duration_weeks) query.append('duration_weeks', params.duration_weeks.toString());
    if (params?.company_id) query.append('company_id', params.company_id.toString());
    if (params?.status_filter) query.append('status_filter', params.status_filter);
    if (params?.is_featured !== undefined) query.append('is_featured', String(params.is_featured));
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());
    return request<Internship[]>(`/internships?${query.toString()}`);
  },
  getInternship: (id: number) => request<Internship>(`/internships/${id}`),
  createInternship: (internship: any) =>
    request<Internship>('/internships', {
      method: 'POST',
      body: JSON.stringify(internship),
    }),
  updateInternship: (id: number, data: any) =>
    request<Internship>(`/internships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  approveInternship: (id: number, approve: boolean, notes?: string) =>
    request<{ message: string; status: string }>(`/internships/${id}/approve?approve=${approve}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`, {
      method: 'POST',
    }),
  toggleBookmark: (id: number) =>
    request<{ bookmarked: boolean; message: string }>(`/internships/${id}/bookmark`, {
      method: 'POST',
    }),
  getMyBookmarks: () => request<Internship[]>('/internships/bookmarks/my'),
  getDomains: () => request<string[]>('/internships/domains'),

  // Applications
  submitApplication: (application: { internship_id: number; resume_url: string; cover_letter: string; qualifications: any }) =>
    request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    }),
  getMyApplications: () => request<Application[]>('/applications/my'),
  listApplications: (params?: { internship_id?: number; status_filter?: string; student_id?: number; search?: string; limit?: number; skip?: number }) => {
    const query = new URLSearchParams();
    if (params?.internship_id) query.append('internship_id', params.internship_id.toString());
    if (params?.status_filter) query.append('status_filter', params.status_filter);
    if (params?.student_id) query.append('student_id', params.student_id.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());
    return request<Application[]>(`/applications?${query.toString()}`);
  },
  getApplicationDetails: (id: number) => request<Application>(`/applications/${id}`),
  updateApplicationStatus: (id: number, statusData: { status: ApplicationStatus; comment?: string; faculty_notes?: string; faculty_rating?: number }) =>
    request<Application>(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    }),
  withdrawApplication: (id: number, reason: string) =>
    request<Application>(`/applications/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Interviews
  listInterviews: (params?: { status_filter?: string; application_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.status_filter) query.append('status_filter', params.status_filter);
    if (params?.application_id) query.append('application_id', params.application_id.toString());
    return request<Interview[]>(`/interviews?${query.toString()}`);
  },
  getInterview: (id: number) => request<Interview>(`/interviews/${id}`),
  scheduleInterview: (interviewData: any) =>
    request<Interview>('/interviews', {
      method: 'POST',
      body: JSON.stringify(interviewData),
    }),
  updateInterview: (id: number, data: any) =>
    request<Interview>(`/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  completeInterview: (id: number, resultData: { result: InterviewResult; feedback: string }) =>
    request<Interview>(`/interviews/${id}/complete?result=${resultData.result}&feedback=${encodeURIComponent(resultData.feedback)}`, {
      method: 'POST',
    }),

  // Evaluations
  listEvaluations: (params?: { student_id?: number; internship_id?: number; include_archived?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.student_id) query.append('student_id', params.student_id.toString());
    if (params?.internship_id) query.append('internship_id', params.internship_id.toString());
    if (params?.include_archived) query.append('include_archived', 'true');
    return request<Evaluation[]>(`/evaluations?${query.toString()}`);
  },
  getEvaluation: (id: number) => request<Evaluation>(`/evaluations/${id}`),
  submitEvaluation: (evalData: any) =>
    request<Evaluation>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(evalData),
    }),
  updateEvaluation: (id: number, data: any) =>
    request<Evaluation>(`/evaluations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  archiveEvaluation: (id: number) =>
    request<{ message: string; is_archived: boolean }>(`/evaluations/${id}/archive`, {
      method: 'POST',
    }),

  // Feedback
  submitFeedback: (feedbackData: any) =>
    request<FeedbackItem>('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    }),
  listFeedbacks: (params?: { target_type?: FeedbackTargetType; status_filter?: string }) => {
    const query = new URLSearchParams();
    if (params?.target_type) query.append('target_type', params.target_type);
    if (params?.status_filter) query.append('status_filter', params.status_filter);
    return request<FeedbackItem[]>(`/feedback?${query.toString()}`);
  },
  updateFeedback: (id: number, data: any) =>
    request<FeedbackItem>(`/feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Reports
  getAnalyticsDashboard: () => request<AnalyticsDashboard>('/reports/dashboard'),
  downloadApplicationsCsv: async () => {
    const token = localStorage.getItem('cims_token');
    const res = await fetch(`${API_BASE}/reports/export/applications/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export applications CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cims_applications_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  downloadPlacementsCsv: async () => {
    const token = localStorage.getItem('cims_token');
    const res = await fetch(`${API_BASE}/reports/export/placements/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export placements CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cims_placements_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Notifications
  listNotifications: (unreadOnly: boolean = false) =>
    request<NotificationItem[]>(`/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (id: number) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'POST' }),

  // Audit Logs
  listAuditLogs: (params?: { action?: string; entity_type?: string; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    if (params?.skip) query.append('skip', params.skip.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<AuditLogItem[]>(`/audit-logs?${query.toString()}`);
  },

  // Settings
  getSystemSettings: () => request<SystemSettingItem[]>('/settings'),
  updateSystemSetting: (key: string, data: { value: string; description?: string }) =>
    request<SystemSettingItem>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
