import { Router } from 'express';
import {
  createNotification,
  deleteNotification,
  getNotificationCenter,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notification.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/center', getNotificationCenter);
router.post('/read-all', markAllNotificationsRead);
router.post('/:id/read', markNotificationRead);
router.post('/', roleMiddleware(['QTV']), createNotification);
router.delete('/:id', roleMiddleware(['QTV']), deleteNotification);

export default router;
