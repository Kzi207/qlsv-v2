import { Router } from 'express';
import { getStudents, createStudent, updateStudent, deleteStudent, createStudentAccount, deleteStudentAccount, importStudentsExcel, getStudentTemplate, deleteClassStudents, exportStudentAccounts, getStudentStats, getStudentCount, updateStudentProfile, getStudentProfileDetails, getStudentAwards } from '../controllers/student.controller';
import { getStudentDashboardStats } from '../controllers/studentDashboard.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Public routes (for all authenticated users)
router.get('/stats', getStudentStats);
router.get('/dashboard-stats', getStudentDashboardStats);
router.get('/profile-details', getStudentProfileDetails);
router.get('/awards', getStudentAwards);
router.put('/update-profile', updateStudentProfile);

// Protected routes (ADMIN, BCH & LECTURER)
const adminBchLecturer = roleMiddleware(['QTV', 'BCH', 'LECTURER']);
const adminBchOnly = roleMiddleware(['QTV', 'BCH']);

router.get('/count', adminBchLecturer, getStudentCount);
router.get('/', adminBchLecturer, getStudents);
router.get('/template', adminBchOnly, getStudentTemplate);
router.get('/export-accounts', adminBchOnly, exportStudentAccounts);
router.post('/', adminBchOnly, createStudent);
router.post('/import', adminBchOnly, upload.single('file'), importStudentsExcel);
router.put('/:id', adminBchOnly, updateStudent);
router.delete('/:id', adminBchOnly, deleteStudent);
router.delete('/class/:classId', adminBchOnly, deleteClassStudents);
router.post('/:id/account', adminBchOnly, createStudentAccount);
router.delete('/:id/account', adminBchOnly, deleteStudentAccount);

export default router;
