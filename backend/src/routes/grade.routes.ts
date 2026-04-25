import { Router } from 'express';
import { getGradesByClass, upsertGrades, getMyGrades, getMyTeachingAssignments } from '../controllers/grade.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Student routes
router.get('/my', getMyGrades);

// Lecturer & Admin routes
router.get('/assignments', roleMiddleware(['QTV', 'LECTURER']), getMyTeachingAssignments);
router.get('/class', roleMiddleware(['QTV', 'LECTURER', 'BCH']), getGradesByClass);
router.post('/bulk', roleMiddleware(['QTV', 'LECTURER']), upsertGrades);

export default router;
