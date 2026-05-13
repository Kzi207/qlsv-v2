import { Router } from 'express';
import { 
  createServiceRequest, 
  getAllServiceRequests, 
  updateServiceRequestStatus,
  getAvailableServices
} from '../controllers/service.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/request', authMiddleware, createServiceRequest);
router.get('/list', authMiddleware, getAvailableServices);
router.get('/all', authMiddleware, getAllServiceRequests);
router.put('/approve/:id', authMiddleware, updateServiceRequestStatus);

export default router;
