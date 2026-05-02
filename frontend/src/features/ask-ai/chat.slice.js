import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    // list of { _id, title, createdAt }
    chats: [],
    // currently selected chat id
    activeChatId: null,
    // messages for the active chat: [{ _id, role, content, createdAt }]
    messages: [],
    // true while sending a message / waiting for AI reply
    sending: false,
    // true while loading chat list or messages
    loading: false,
    error: null,
  },
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    addChat: (state, action) => {
      // prepend new chat to the top
      state.chats = [action.payload, ...state.chats];
    },
    removeChat: (state, action) => {
      state.chats = state.chats.filter((c) => c._id !== action.payload);
      if (state.activeChatId === action.payload) {
        state.activeChatId = null;
        state.messages = [];
      }
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    appendMessage: (state, action) => {
      state.messages = [...state.messages, action.payload];
    },
    setSending: (state, action) => {
      state.sending = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateChatTitle: (state, action) => {
      const { chatId, title } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat) chat.title = title;
    },
  },
});

export const {
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
} = chatSlice.actions;

export default chatSlice.reducer;
