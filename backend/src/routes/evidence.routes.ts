import { Router } from 'express';
import { 
  saveDraft, 
  submitSlip, 
  getMySlip, 
  getAllSlips, 
  reviewSlip 
} from '../controllers/evidence.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

// Student routes
router.post('/draft', protect, saveDraft);
router.post('/submit', protect, submitSlip);
router.get('/my-slip/:semesterId', protect, getMySlip);

// Admin routes
router.get('/all-slips', protect, admin, getAllSlips);
router.patch('/review/:id', protect, admin, reviewSlip);

export default router;
