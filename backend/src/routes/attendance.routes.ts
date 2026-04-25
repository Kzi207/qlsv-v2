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

router.get('/sessions', roleMiddleware(['QTV', 'BCH']), getAttendanceSessions);
router.get('/sessions/active', getActiveSessions);
router.post('/qr-check-in', qrCheckIn);

// Admin & BCH routes
router.post('/session', roleMiddleware(['QTV', 'BCH']), createAttendanceSession);
router.patch('/sessions/:sessionId/end', roleMiddleware(['QTV', 'BCH']), endAttendanceSession);
router.get('/sessions/:sessionId/attendees', roleMiddleware(['QTV', 'BCH']), getSessionAttendees);
router.get('/sessions/:sessionId/summary', roleMiddleware(['QTV', 'BCH']), getSessionSummary);
router.post('/', roleMiddleware(['QTV', 'BCH']), checkAttendance);
router.get('/', roleMiddleware(['QTV', 'BCH']), getAttendanceByDate);
router.get('/student/:studentId', getAttendanceByStudent);

export default router;
