import { Router } from 'express';
import { getNotifications, createNotification, deleteNotification } from '../controllers/notification.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.post('/', authMiddleware, roleMiddleware(['QTV']), createNotification);
router.delete('/:id', authMiddleware, roleMiddleware(['QTV']), deleteNotification);

export default router;
