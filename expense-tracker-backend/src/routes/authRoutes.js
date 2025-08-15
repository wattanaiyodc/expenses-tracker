import express from 'express';
import { register, login, getUserbyId} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/me', protect,  getUserbyId);
router.post('/register', register);
router.post('/login', login);


export default router;
