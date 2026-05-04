import { Router } from 'express';
import { getAdminAnalytics, globalAdminSearch } from '../controllers/admin.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['QTV', 'BCH', 'LECTURER']));

router.get('/search', globalAdminSearch);
router.get('/analytics', getAdminAnalytics);

export default router;

