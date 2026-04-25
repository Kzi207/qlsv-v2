import { Router } from 'express';
import { getMyTuition, getAllTuition, payTuition, generateTuition } from '../controllers/finance.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/my', getMyTuition);
router.get('/all', roleMiddleware(['QTV']), getAllTuition);
router.post('/pay/:id', roleMiddleware(['QTV']), payTuition);
router.post('/generate-semester', roleMiddleware(['QTV']), generateTuition);

export default router;
