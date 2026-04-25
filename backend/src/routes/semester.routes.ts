import { Router } from 'express';
import { getSemesters, createSemester, deleteSemester, updateSemester } from '../controllers/semester.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getSemesters);
router.post('/', authMiddleware, roleMiddleware(['QTV', 'BCH']), createSemester);
router.put('/:name', authMiddleware, roleMiddleware(['QTV', 'BCH']), updateSemester);
router.delete('/:name', authMiddleware, roleMiddleware(['QTV', 'BCH']), deleteSemester);

export default router;
