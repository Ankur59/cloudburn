import axiosInstance from '../../../utils/axios';

/** Fetch all chat sessions for current user */
export const getChatsApi = async () => {
  const response = await axiosInstance.get('/chat');
  return response.data;
};

/** Fetch messages for a specific chat */
export const getChatMessagesApi = async (chatId) => {
  const response = await axiosInstance.get(`/chat/${chatId}/messages`);
  return response.data;
};

/**
 * Send a message. If chatId is omitted, backend creates a new chat.
 * Returns { chatId, answer }
 */
export const sendMessageApi = async ({ chatId, message }) => {
  const body = { message };
  if (chatId) body.chatId = chatId;
  const response = await axiosInstance.post('/chat/message', body);
  return response.data;
};

/** Delete a chat session */
export const deleteChatApi = async (chatId) => {
  const response = await axiosInstance.delete(`/chat/delete/${chatId}`);
  return response.data;
};
