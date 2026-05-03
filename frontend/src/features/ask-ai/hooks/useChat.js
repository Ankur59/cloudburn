import { useDispatch, useSelector } from 'react-redux';
import {
  getChatsApi,
  getChatMessagesApi,
  sendMessageApi,
  deleteChatApi,
} from '../service/chat.api';
import {
  setChats,
  addChat,
  removeChat,
  setActiveChatId,
  setMessages,
  appendMessage,
  setSending,
  setLoading,
  setError,
  updateChatTitle,
} from '../chat.slice';

const useChat = () => {
  const dispatch = useDispatch();
  const { chats, activeChatId, messages, sending, loading, error } =
    useSelector((state) => state.chat);

  /** Load the chat list for current user */
  const fetchChats = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const res = await getChatsApi();
      dispatch(setChats(res.data?.chats ?? []));
    } catch (err) {
      dispatch(setError(err?.response?.data?.message || 'Failed to load chats'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  /** Select a chat and load its messages */
  const selectChat = async (chatId) => {
    dispatch(setActiveChatId(chatId));
    dispatch(setMessages([]));
    try {
      dispatch(setLoading(true));
      const res = await getChatMessagesApi(chatId);
      dispatch(setMessages(res.data?.messages ?? []));
    } catch (err) {
      dispatch(setError(err?.response?.data?.message || 'Failed to load messages'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Send a message in the current chat (or create a new one if no active chat).
   * Optimistically adds user message, then appends AI reply.
   */
  const sendMessage = async (text) => {
    if (!text.trim() || sending) return;

    const optimisticUser = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    dispatch(appendMessage(optimisticUser));
    dispatch(setSending(true));
    dispatch(setError(null));

    try {
      const res = await sendMessageApi({ chatId: activeChatId, message: text.trim() });
      const { chatId: resolvedId, answer } = res.data;

      // If a brand-new chat was created, select it and refresh chat list
      if (!activeChatId) {
        dispatch(setActiveChatId(resolvedId));
        await fetchChats();
        // Also update title after first message
        dispatch(updateChatTitle({ chatId: resolvedId, title: text.trim().slice(0, 40) }));
      }

      const aiMessage = {
        _id: `ai-${Date.now()}`,
        role: 'ai',
        content: answer,
        createdAt: new Date().toISOString(),
      };
      dispatch(appendMessage(aiMessage));
    } catch (err) {
      dispatch(setError(err?.response?.data?.message || 'Failed to send message'));
    } finally {
      dispatch(setSending(false));
    }
  };

  /** Start a fresh chat (clears active selection without deleting) */
  const startNewChat = () => {
    dispatch(setActiveChatId(null));
    dispatch(setMessages([]));
    dispatch(setError(null));
  };

  /** Delete a chat */
  const deleteChat = async (chatId) => {
    try {
      await deleteChatApi(chatId);
      dispatch(removeChat(chatId));
    } catch (err) {
      dispatch(setError(err?.response?.data?.message || 'Failed to delete chat'));
    }
  };

  return {
    chats,
    activeChatId,
    messages,
    sending,
    loading,
    error,
    fetchChats,
    selectChat,
    sendMessage,
    startNewChat,
    deleteChat,
  };
};

export default useChat;
