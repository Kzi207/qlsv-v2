import { Router } from 'express';
import { 
  getAllBorrowings, 
  createBorrowing, 
  updateBorrowingStatus, 
  deleteBorrowing 
} from '../controllers/borrowing.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getAllBorrowings);
router.post('/', protect, createBorrowing);
router.patch('/:id/status', protect, admin, updateBorrowingStatus);
router.delete('/:id', protect, protect, deleteBorrowing); // User can delete their own? For now just protect

export default router;
