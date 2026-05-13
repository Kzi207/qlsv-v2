import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getSettings);
router.patch('/', protect, admin, updateSettings);
router.put('/', protect, admin, updateSettings);

export default router;
