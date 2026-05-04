import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import ScrollToTop from './components/ScrollToTop';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import TrainingScore from './pages/TrainingScore';
import Attendance from './pages/Attendance';
import EvaluationPage from './pages/Evaluation';
import StudentDashboard from './pages/StudentDashboard';
import QRAttendanceManager from './pages/QRAttendanceManager';
import QRScannerCheckIn from './pages/QRScannerCheckIn';
import RoleRoute from './components/RoleRoute';
import StudentEvaluation from './pages/StudentEvaluation';
import AccountManagement from './pages/AccountManagement';
import AdminDRLManagement from './pages/AdminDRLManagement';
import Classes from './pages/Classes';
import Semesters from './pages/Semesters';
import TrainingScoreApproval from './pages/TrainingScoreApproval';
import TrainingScoreDetail from './pages/TrainingScoreDetail';
import BCHManagement from './pages/BCHManagement';
import Profile from './pages/Profile';
import Tuition from './pages/Tuition';
import Schedule from './pages/Schedule';
import Grades from './pages/Grades';
import Curriculum from './pages/Curriculum';
import ProgressPage from './pages/Progress';
import NotificationsPage from './pages/Notifications';
import ServicesPage from './pages/Services';
import Registration from './pages/Registration';
import Lectures from './pages/elearning/Lectures';
import Assignments from './pages/elearning/Assignments';
import OnlineExam from './pages/elearning/OnlineExam';
import TrainingEvidence from './pages/TrainingEvidence';
import TuitionHistory from './pages/TuitionHistory';
import ServiceRequests from './pages/ServiceRequests';
import SettingsPage from './pages/Settings';
import AdminActivityManager from './pages/AdminActivityManager';
import AdminTimetableManagement from './pages/AdminTimetableManagement';
import RoomManagement from './pages/RoomManagement';
import CurriculumManagement from './pages/CurriculumManagement';
import StudentCurriculum from './pages/StudentCurriculum';
import GradeManagement from './pages/GradeManagement';
import SubjectRegistration from './pages/SubjectRegistration';
import TuitionPayment from './pages/TuitionPayment';
import AdminSubjectManager from './pages/AdminSubjectManager';
import AdminTuitionManager from './pages/AdminTuitionManager';
import StudentELearningDashboard from './pages/elearning/StudentDashboard';
import TeacherELearningDashboard from './pages/elearning/TeacherDashboard';
import TeacherCourses from './pages/elearning/teacher/TeacherCourses';
import TeacherLessons from './pages/elearning/teacher/TeacherLessons';
import TeacherAssignments from './pages/elearning/teacher/TeacherAssignments';
import TeacherExams from './pages/elearning/teacher/TeacherExams';
import AdminELearningDashboard from './pages/elearning/AdminDashboard';
import AdminCourses from './pages/elearning/admin/AdminCourses';
import AdminLessons from './pages/elearning/admin/AdminLessons';
import AdminAssignments from './pages/elearning/admin/AdminAssignments';
import AdminExams from './pages/elearning/admin/AdminExams';
import CourseDetail from './pages/elearning/CourseDetail';
import TakeExam from './pages/elearning/TakeExam';
import NotFound from './pages/NotFound';
import StudentAwards from './pages/StudentAwards';
import StudentTrainingResults from './pages/StudentTrainingResults';
import SystemAudit from './pages/SystemAudit';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, authInitialized } = useAuthStore();

  if (!authInitialized) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { user, isAuthenticated, authInitialized, initializeAuth } = useAuthStore();
  const isStudent = user?.role?.toUpperCase() === 'STUDENT';

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/login"
          element={
            authInitialized && isAuthenticated ? <Navigate to="/" /> : <Login />
          }
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

          {/* QTV ONLY ROUTES */}
          <Route path="bch" element={<RoleRoute allowedRoles={['QTV']}><BCHManagement /></RoleRoute>} />
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
          <Route path="schedule" element={<Schedule />} />
          <Route path="grades" element={<Grades />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="tuition" element={<Tuition />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="training-score" element={<TrainingScore />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="finance" element={<Tuition />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
