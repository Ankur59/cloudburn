import asyncHandler from '../middlewares/async.middleware.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/responseHelper.js';
import { processMessage, getUserChats, getChatMessages, removeChat } from '../services/chat.service.js';

// ── POST /api/chat/message ────────────────────────────────────────────────────
// Body: { chatId?: string, message: string }
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, message } = req.body;
  const user = req.user;
  const orgId = user?.orgId;

  if (!orgId) {
    throw new AppError('Organisation not identified. Please log in again.', 401);
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new AppError('message is required and must be a non-empty string.', 400);
  }

  const { chatId: resolvedChatId, answer } = await processMessage({
    chatId,
    message: message.trim(),
    userId: user._id,
    orgId
  });

  return sendSuccess(res, 200, 'Message sent successfully', {
    chatId: resolvedChatId,
    answer,
  });
});

// ── GET /api/chat/ ────────────────────────────────────────────────────────────
// Returns a list of all chat sessions for the user
export const getChats = asyncHandler(async (req, res) => {
  const chats = await getUserChats(req.user._id);
  return sendSuccess(res, 200, 'Chats retrieved.', { chats });
});

// ── GET /api/chat/:chatId/messages ─────────────────────────────────────────────
// Returns message history for the chat
export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const messages = await getChatMessages(chatId, req.user._id);
  return sendSuccess(res, 200, 'Messages retrieved.', { messages });
});

// ── DELETE /api/chat/delete/:chatId ────────────────────────────────────────────
// Deletes a chat session and all its messages
export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  await removeChat(chatId, req.user._id);
  return sendSuccess(res, 200, 'Chat deleted successfully.', null);
});
