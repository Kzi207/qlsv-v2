import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Allow all roles, but the controller will filter results based on role
router.get('/', authMiddleware, roleMiddleware(['QTV', 'BCH', 'LECTURER', 'STUDENT']), getAuditLogs);

export default router;
