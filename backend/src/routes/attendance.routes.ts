import { Router } from 'express';
import { 
  checkAttendance, 
  getAttendanceByDate, 
  getAttendanceByStudent, 
  createAttendanceSession, 
  getAttendanceSessions,
  getActiveSessions, 
  qrCheckIn, 
  getSessionAttendees,
  getSessionSummary,
  endAttendanceSession,
} from '../controllers/attendance.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/sessions', roleMiddleware(['QTV', 'BCH', 'LECTURER']), getAttendanceSessions);
router.get('/sessions/active', getActiveSessions);
router.post('/qr-check-in', qrCheckIn);

// Admin, BCH & Lecturer routes
router.post('/session', roleMiddleware(['QTV', 'BCH', 'LECTURER']), createAttendanceSession);
router.patch('/sessions/:sessionId/end', roleMiddleware(['QTV', 'BCH', 'LECTURER']), endAttendanceSession);
router.get('/sessions/:sessionId/attendees', roleMiddleware(['QTV', 'BCH', 'LECTURER']), getSessionAttendees);
router.get('/sessions/:sessionId/summary', roleMiddleware(['QTV', 'BCH', 'LECTURER']), getSessionSummary);
router.post('/', roleMiddleware(['QTV', 'BCH', 'LECTURER']), checkAttendance);
router.get('/', roleMiddleware(['QTV', 'BCH', 'LECTURER']), getAttendanceByDate);
router.get('/student/:studentId', getAttendanceByStudent);

export default router;
