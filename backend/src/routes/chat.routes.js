import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { postMessage, getChatHistory, getChatSessions } from '../controllers/chat.controller.js';

const router = Router();

// All chat routes require authentication — orgId is extracted from the JWT
// by the protect middleware and placed on req.user.orgId

// POST /api/chat/message
// Body: { sessionId?: string, message: string }
// Returns: { answer: string, sessionId: string }
router.post('/message', protect(), postMessage);

// GET /api/chat/sessions
// Returns: { sessions: [{ sessionId, title, updatedAt }] }
router.get('/sessions', protect(), getChatSessions);

// GET /api/chat/history/:sessionId
// Returns: { messages: [...] }
router.get('/history/:sessionId', protect(), getChatHistory);

export default router;
