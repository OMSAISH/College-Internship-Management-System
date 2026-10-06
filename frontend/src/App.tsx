import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { VerifyEmailPage } from './pages/public/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';
import { AcceptFacultyInvitePage } from './pages/public/AcceptFacultyInvitePage';
import { InternshipDiscoveryPage } from './pages/public/InternshipDiscoveryPage';
import { InternshipDetailPage } from './pages/public/InternshipDetailPage';
import { CompaniesPage } from './pages/public/CompaniesPage';

// Settings & Security
import { SecuritySettingsPage } from './pages/settings/SecuritySettingsPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentApplicationsPage } from './pages/student/StudentApplicationsPage';
import { StudentApplicationWizard } from './pages/student/StudentApplicationWizard';
import { StudentInterviewsPage } from './pages/student/StudentInterviewsPage';
import { StudentSavedPage } from './pages/student/StudentSavedPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentFeedbackPage } from './pages/student/StudentFeedbackPage';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyCreateInternship } from './pages/faculty/FacultyCreateInternship';
import { FacultyApplicationsPage } from './pages/faculty/FacultyApplicationsPage';
import { FacultyInterviewsPage } from './pages/faculty/FacultyInterviewsPage';
import { FacultyEvaluationsPage } from './pages/faculty/FacultyEvaluationsPage';
import { FacultyReportsPage } from './pages/faculty/FacultyReportsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminFacultyPage } from './pages/admin/AdminFacultyPage';
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage';
import { AdminInternshipsPage } from './pages/admin/AdminInternshipsPage';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';
import { AdminInterviewsPage } from './pages/admin/AdminInterviewsPage';
import { AdminEvaluationsPage } from './pages/admin/AdminEvaluationsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminFeedbackPage } from './pages/admin/AdminFeedbackPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Helper component to redirect /dashboard to the specific role dashboard
const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes with standard Navigation & Footer */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/accept-faculty-invite" element={<AcceptFacultyInvitePage />} />
                <Route path="/settings/security" element={<SecuritySettingsPage />} />
                <Route path="/internships" element={<InternshipDiscoveryPage />} />
                <Route path="/internships/:id" element={<InternshipDetailPage />} />
                <Route path="/companies" element={<CompaniesPage />} />
              </Route>

              {/* Dynamic /dashboard router */}
              <Route path="/dashboard" element={<DashboardRedirect />} />

              {/* Student Portal Protected Routes */}
              <Route element={<DashboardLayout requiredRole="STUDENT" />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/applications" element={<StudentApplicationsPage />} />
                <Route path="/student/apply/:id" element={<StudentApplicationWizard />} />
                <Route path="/student/interviews" element={<StudentInterviewsPage />} />
                <Route path="/student/saved" element={<StudentSavedPage />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />
                <Route path="/student/feedback" element={<StudentFeedbackPage />} />
              </Route>

              {/* Faculty / Coordinator Portal Protected Routes */}
              <Route element={<DashboardLayout requiredRole="FACULTY" />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/create-internship" element={<FacultyCreateInternship />} />
                <Route path="/faculty/applications" element={<FacultyApplicationsPage />} />
                <Route path="/faculty/interviews" element={<FacultyInterviewsPage />} />
                <Route path="/faculty/evaluations" element={<FacultyEvaluationsPage />} />
                <Route path="/faculty/reports" element={<FacultyReportsPage />} />
                <Route path="/faculty/feedback" element={<AdminFeedbackPage />} />
              </Route>

              {/* Admin Portal Protected Routes */}
              <Route element={<DashboardLayout requiredRole="ADMIN" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/faculty" element={<AdminFacultyPage />} />
                <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                <Route path="/admin/internships" element={<AdminInternshipsPage />} />
                <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                <Route path="/admin/interviews" element={<AdminInterviewsPage />} />
                <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Catch-all redirect to Landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
