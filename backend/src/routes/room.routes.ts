import { Router } from 'express';
import { 
  getAllRooms, 
  createRoom, 
  updateRoom,
  deleteRoom, 
  getAvailableRooms 
} from '../controllers/room.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getAllRooms);
router.get('/available', protect, getAvailableRooms);
router.post('/', protect, admin, createRoom);
router.put('/:id', protect, admin, updateRoom);
router.delete('/:id', protect, admin, deleteRoom);

export default router;
