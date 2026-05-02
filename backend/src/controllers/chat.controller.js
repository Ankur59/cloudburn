import crypto from 'crypto';
import asyncHandler from '../middlewares/async.middleware.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/responseHelper.js';
import { sendMessage, getHistory, getAllSessions } from '../services/chat.service.js';

// ── POST /api/chat/message ────────────────────────────────────────────────────
// Body: { sessionId?: string, message: string }
// orgId is extracted from the JWT (req.user.orgId) — never trusted from body.

export const postMessage = asyncHandler(async (req, res) => {
  const { sessionId, message } = req.body;
  const orgId = req.user?.orgId;

  if (!orgId) {
    throw new AppError('Organisation not identified. Please log in again.', 401);
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new AppError('message is required and must be a non-empty string.', 400);
  }

  // Auto-generate session ID if client didn't provide one
  const sid = sessionId || crypto.randomUUID();

  const { answer } = await sendMessage({
    sessionId: sid,
    message: message.trim(),
    orgId,                          // ← org context from JWT
  });

  return sendSuccess(res, 200, 'Chat response generated.', {
    answer,
    sessionId: sid,
  });
});

// ── GET /api/chat/history/:sessionId ─────────────────────────────────────────
// Returns message history for the session — filtered by orgId for security.

export const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const orgId = req.user?.orgId;

  if (!orgId) {
    throw new AppError('Organisation not identified. Please log in again.', 401);
  }

  if (!sessionId) {
    throw new AppError('sessionId param is required.', 400);
  }

  const messages = await getHistory(sessionId, orgId);

  return sendSuccess(res, 200, 'Chat history retrieved.', { messages });
});

// ── GET /api/chat/sessions ────────────────────────────────────────────────────
// Returns a list of all chat sessions for the org (for a sidebar)

export const getChatSessions = asyncHandler(async (req, res) => {
  const orgId = req.user?.orgId;

  if (!orgId) {
    throw new AppError('Organisation not identified. Please log in again.', 401);
  }

  const sessions = await getAllSessions(orgId);

  return sendSuccess(res, 200, 'Chat sessions retrieved.', { sessions });
});
