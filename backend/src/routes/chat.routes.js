import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  deleteChat,
  getChats,
  getMessages,
  sendMessage,
} from '../controllers/chat.controller.js';

const router = Router();

// All chat routes require authentication
router.post('/message', protect(), sendMessage);
router.get('/', protect(), getChats);
router.get('/:chatId/messages', protect(), getMessages);
router.delete('/delete/:chatId', protect(), deleteChat);

export default router;
