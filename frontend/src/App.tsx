import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import ScrollToTop from './components/ScrollToTop';
import RoleRoute from './components/RoleRoute';

const MainLayout = lazy(() => import('./layout/MainLayout'));
const Login = lazy(() => import('./pages/Login'));
const RegisterAccount = lazy(() => import('./pages/RegisterAccount'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const TrainingScore = lazy(() => import('./pages/TrainingScore'));
const Attendance = lazy(() => import('./pages/Attendance'));
const EvaluationPage = lazy(() => import('./pages/Evaluation'));
const StudentDashboard = lazy(() => import('./pages/v2/StudentDashboard'));
const QRAttendanceManager = lazy(() => import('./pages/QRAttendanceManager'));
const QRScannerCheckIn = lazy(() => import('./pages/QRScannerCheckIn'));
const ExternalCheckIn = lazy(() => import('./pages/ExternalCheckIn'));
const StudentEvaluation = lazy(() => import('./pages/StudentEvaluation'));
const AccountManagement = lazy(() => import('./pages/AccountManagement'));
const AdminDRLManagement = lazy(() => import('./pages/AdminDRLManagement'));
const Classes = lazy(() => import('./pages/Classes'));
const Semesters = lazy(() => import('./pages/Semesters'));
const TrainingScoreApproval = lazy(() => import('./pages/TrainingScoreApproval'));
const TrainingScoreDetail = lazy(() => import('./pages/TrainingScoreDetail'));
const BCHManagement = lazy(() => import('./pages/BCHManagement'));
const Profile = lazy(() => import('./pages/Profile'));
const Tuition = lazy(() => import('./pages/Tuition'));
const ScheduleV2 = lazy(() => import('./pages/v2/ScheduleV2'));
const Grades = lazy(() => import('./pages/Grades'));
const Curriculum = lazy(() => import('./pages/Curriculum'));
const ProgressPage = lazy(() => import('./pages/Progress'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const ServicesPage = lazy(() => import('./pages/Services'));
const Registration = lazy(() => import('./pages/Registration'));
const Lectures = lazy(() => import('./pages/elearning/Lectures'));
const Assignments = lazy(() => import('./pages/elearning/Assignments'));
const OnlineExam = lazy(() => import('./pages/elearning/OnlineExam'));
const TrainingEvidence = lazy(() => import('./pages/TrainingEvidence'));
const TuitionHistory = lazy(() => import('./pages/TuitionHistory'));
const ServiceRequests = lazy(() => import('./pages/ServiceRequests'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const AdminActivityManager = lazy(() => import('./pages/AdminActivityManager'));
const AdminTimetableManagement = lazy(() => import('./pages/AdminTimetableManagement'));
const RoomManagement = lazy(() => import('./pages/RoomManagement'));
const CurriculumManagement = lazy(() => import('./pages/CurriculumManagement'));
const StudentCurriculum = lazy(() => import('./pages/StudentCurriculum'));
const GradeManagement = lazy(() => import('./pages/GradeManagement'));
const SubjectRegistration = lazy(() => import('./pages/SubjectRegistration'));
const TuitionPayment = lazy(() => import('./pages/TuitionPayment'));
const AdminSubjectManager = lazy(() => import('./pages/AdminSubjectManager'));
const AdminTuitionManager = lazy(() => import('./pages/AdminTuitionManager'));
const StudentELearningDashboard = lazy(() => import('./pages/elearning/StudentDashboard'));
const TeacherELearningDashboard = lazy(() => import('./pages/elearning/TeacherDashboard'));
const TeacherCourses = lazy(() => import('./pages/elearning/teacher/TeacherCourses'));
const TeacherLessons = lazy(() => import('./pages/elearning/teacher/TeacherLessons'));
const TeacherAssignments = lazy(() => import('./pages/elearning/teacher/TeacherAssignments'));
const TeacherExams = lazy(() => import('./pages/elearning/teacher/TeacherExams'));
const AdminELearningDashboard = lazy(() => import('./pages/elearning/AdminDashboard'));
const AdminCourses = lazy(() => import('./pages/elearning/admin/AdminCourses'));
const AdminLessons = lazy(() => import('./pages/elearning/admin/AdminLessons'));
const AdminAssignments = lazy(() => import('./pages/elearning/admin/AdminAssignments'));
const AdminExams = lazy(() => import('./pages/elearning/admin/AdminExams'));
const CourseDetail = lazy(() => import('./pages/elearning/CourseDetail'));
const TakeExam = lazy(() => import('./pages/elearning/TakeExam'));
const NotFound = lazy(() => import('./pages/NotFound'));
const StudentAwards = lazy(() => import('./pages/StudentAwards'));
const StudentTrainingResults = lazy(() => import('./pages/StudentTrainingResults'));
const AdminServiceManagement = lazy(() => import('./pages/AdminServiceManagement'));
const SystemAudit = lazy(() => import('./pages/SystemAudit'));
const Checkout = lazy(() => import('./pages/Checkout'));

const RouteFallback = () => <div className="min-h-screen bg-slate-50" />;

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, authInitialized } = useAuthStore();

  if (!authInitialized) {
    return <RouteFallback />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { user, isAuthenticated, authInitialized, initializeAuth } = useAuthStore();
  const isStudent = user?.role?.toUpperCase() === 'STUDENT';

  useEffect(() => {
    initializeAuth();

    const handleUnauthorized = () => {
      useAuthStore.setState({ user: null, isAuthenticated: false, authInitialized: true });
      if (window.location.pathname !== '/login') {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    };

    window.addEventListener('qlsv-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('qlsv-unauthorized', handleUnauthorized);
  }, [initializeAuth]);

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              authInitialized && isAuthenticated ? <Navigate to="/" /> : <Login />
            }
          />
          <Route
            path="/register"
            element={
              authInitialized && isAuthenticated ? <Navigate to="/" /> : <RegisterAccount />
            }
          />
          <Route
            path="/qr/:token"
            element={<ExternalCheckIn />}
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={isStudent ? <StudentDashboard /> : <Dashboard />} />

            {/* ADMIN & BCH & LECTURER ROUTES */}
            <Route path="students" element={<RoleRoute allowedRoles={['QTV', 'LECTURER', 'BCH']}><Students /></RoleRoute>} />
            <Route path="drl" element={<RoleRoute allowedRoles={['QTV', 'BCH']}><AdminDRLManagement /></RoleRoute>} />
            <Route path="training/approval/:id" element={<RoleRoute allowedRoles={['QTV', 'BCH']}><TrainingScoreDetail /></RoleRoute>} />
            <Route path="evaluation/:studentId" element={<RoleRoute allowedRoles={['QTV', 'BCH']}><EvaluationPage /></RoleRoute>} />
            <Route path="classes" element={<RoleRoute allowedRoles={['QTV', 'BCH']}><Classes /></RoleRoute>} />
            <Route path="semesters" element={<RoleRoute allowedRoles={['QTV']}><Semesters /></RoleRoute>} />
            <Route path="accounts" element={<RoleRoute allowedRoles={['QTV']}><AccountManagement /></RoleRoute>} />
            <Route path="attendance/manage" element={<RoleRoute allowedRoles={['QTV', 'LECTURER', 'BCH']}><QRAttendanceManager /></RoleRoute>} />
            <Route path="training/approval" element={<RoleRoute allowedRoles={['QTV', 'BCH']}><TrainingScoreApproval /></RoleRoute>} />
            <Route path="activities/manage" element={<RoleRoute allowedRoles={['QTV', 'BCH']}><AdminActivityManager /></RoleRoute>} />
            <Route path="timetable/manage" element={<RoleRoute allowedRoles={['QTV']}><AdminTimetableManagement /></RoleRoute>} />
            <Route path="timetable/bulk" element={<Navigate to="/timetable/manage" replace />} />
            <Route path="timetable/rooms" element={<RoleRoute allowedRoles={['QTV']}><RoomManagement /></RoleRoute>} />
            <Route path="curriculum/manage" element={<RoleRoute allowedRoles={['QTV']}><CurriculumManagement /></RoleRoute>} />
            <Route path="curriculum/my" element={<RoleRoute allowedRoles={['STUDENT']}><StudentCurriculum /></RoleRoute>} />
            <Route path="grades/manage" element={<RoleRoute allowedRoles={['QTV', 'LECTURER', 'BCH']}><GradeManagement /></RoleRoute>} />

            {/* ACADEMIC & FINANCE */}
            <Route path="registration" element={<RoleRoute allowedRoles={['STUDENT']}><SubjectRegistration /></RoleRoute>} />
            <Route path="tuition" element={<RoleRoute allowedRoles={['STUDENT']}><TuitionPayment /></RoleRoute>} />
            <Route path="academic/manage" element={<RoleRoute allowedRoles={['QTV']}><AdminSubjectManager /></RoleRoute>} />
            <Route path="academic/class-subjects" element={<Navigate to="/academic/manage" replace />} />
            <Route path="finance/manage" element={<RoleRoute allowedRoles={['QTV']}><AdminTuitionManager /></RoleRoute>} />
            <Route path="checkout/:paymentCode" element={<RoleRoute allowedRoles={['STUDENT']}><Checkout /></RoleRoute>} />

            {/* QTV ONLY ROUTES */}
            <Route path="bch" element={<RoleRoute allowedRoles={['QTV', 'BCH']}><BCHManagement /></RoleRoute>} />
            <Route path="admin/services" element={<RoleRoute allowedRoles={['QTV']}><AdminServiceManagement /></RoleRoute>} />
            <Route path="system/audit" element={<RoleRoute allowedRoles={['QTV', 'BCH', 'LECTURER', 'STUDENT']}><SystemAudit /></RoleRoute>} />

            {/* STUDENT ONLY ROUTES */}
            <Route path="training/evaluation/self" element={<RoleRoute allowedRoles={['STUDENT']}><StudentEvaluation /></RoleRoute>} />
            <Route path="registration" element={<RoleRoute allowedRoles={['STUDENT']}><Registration /></RoleRoute>} />
            {/* E-LEARNING ROUTES */}
            <Route path="elearning" element={<RoleRoute allowedRoles={['STUDENT']}><StudentELearningDashboard /></RoleRoute>} />
            {/* Lecturer E-Learning Routes */}
            <Route path="elearning/manage" element={<RoleRoute allowedRoles={['LECTURER']}><TeacherELearningDashboard /></RoleRoute>} />
            <Route path="elearning/manage/courses" element={<RoleRoute allowedRoles={['LECTURER']}><TeacherCourses /></RoleRoute>} />
            <Route path="elearning/manage/lessons" element={<RoleRoute allowedRoles={['LECTURER']}><TeacherLessons /></RoleRoute>} />
            <Route path="elearning/manage/assignments" element={<RoleRoute allowedRoles={['LECTURER']}><TeacherAssignments /></RoleRoute>} />
            <Route path="elearning/manage/exams" element={<RoleRoute allowedRoles={['LECTURER']}><TeacherExams /></RoleRoute>} />
            <Route path="elearning/admin" element={<RoleRoute allowedRoles={['QTV']}><AdminELearningDashboard /></RoleRoute>} />
            <Route path="elearning/admin/courses" element={<RoleRoute allowedRoles={['QTV']}><AdminCourses /></RoleRoute>} />
            <Route path="elearning/admin/lessons" element={<RoleRoute allowedRoles={['QTV']}><AdminLessons /></RoleRoute>} />
            <Route path="elearning/admin/assignments" element={<RoleRoute allowedRoles={['QTV']}><AdminAssignments /></RoleRoute>} />
            <Route path="elearning/admin/exams" element={<RoleRoute allowedRoles={['QTV']}><AdminExams /></RoleRoute>} />
            <Route path="elearning/course/:id" element={<CourseDetail />} />
            <Route path="elearning/manage/:id" element={<CourseDetail />} />

            <Route path="elearning/lectures" element={<RoleRoute allowedRoles={['STUDENT']}><Lectures /></RoleRoute>} />
            <Route path="elearning/assignments" element={<RoleRoute allowedRoles={['STUDENT']}><Assignments /></RoleRoute>} />
            <Route path="elearning/exam" element={<RoleRoute allowedRoles={['STUDENT']}><OnlineExam /></RoleRoute>} />
            <Route path="elearning/exam/:id" element={<RoleRoute allowedRoles={['STUDENT']}><TakeExam /></RoleRoute>} />
            <Route path="training/evidence" element={<RoleRoute allowedRoles={['STUDENT']}><TrainingEvidence /></RoleRoute>} />
            <Route path="training/awards" element={<RoleRoute allowedRoles={['STUDENT']}><StudentAwards /></RoleRoute>} />
            <Route path="profile/achievements" element={<RoleRoute allowedRoles={['STUDENT']}><StudentAwards /></RoleRoute>} />
            <Route path="training/results" element={<RoleRoute allowedRoles={['STUDENT']}><StudentTrainingResults /></RoleRoute>} />
            <Route path="tuition/history" element={<RoleRoute allowedRoles={['STUDENT']}><TuitionHistory /></RoleRoute>} />
            <Route path="services/requests" element={<RoleRoute allowedRoles={['STUDENT']}><ServiceRequests /></RoleRoute>} />
            <Route path="settings" element={<SettingsPage />} />

            {/* SHARED ROUTES */}
            <Route path="profile" element={<Profile />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="attendance/scan" element={<QRScannerCheckIn />} />
            <Route path="qr-scan" element={<QRScannerCheckIn />} />
            <Route path="training" element={<TrainingScore />} />
            <Route path="schedule" element={<ScheduleV2 />} />
            <Route path="lich-hoc" element={<ScheduleV2 />} />
            <Route path="grades" element={<Grades />} />
            <Route path="curriculum" element={<Curriculum />} />
            <Route path="tuition" element={<Tuition />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="training-score" element={<TrainingScore />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="thong-bao" element={<NotificationsPage />} />
            <Route path="finance" element={<Tuition />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="tai-khoan" element={<Profile />} />
            <Route path="diem-danh" element={<Attendance />} />
            <Route path="huong-dan" element={<div className="p-8">Đang cập nhật hướng dẫn...</div>} />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
