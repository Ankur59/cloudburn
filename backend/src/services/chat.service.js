import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import AppError from '../utils/AppError.js';
import { askGroq, generateChatTitle } from './ai.service.js';
import { getVectorStore, refreshRAGForOrg } from '../loaders/rag.loader.js';

// ── System prompt factory ─────────────────────────────────────────────────────
const buildSystemPrompt = (ragContext, orgId) =>
  `You are CloudBurn AI, an expert AWS cloud cost analyst assistant.
You help engineering teams understand their AWS spending, diagnose cost spikes, and reduce infrastructure costs.

You have access to the following real AWS billing data for organisation "${orgId}":

--- AWS COST CONTEXT ---
${ragContext || 'No billing data indexed yet. Answer based on general AWS cost knowledge.'}
--- END CONTEXT ---

Instructions:
- Use the billing data above to give specific, accurate answers.
- When costs are mentioned, always include the USD amount.
- Recommend actionable cost optimizations based on the actual services shown.
- Be concise but thorough. Do not make up numbers that are not in the context.`;

export const processMessage = async ({ chatId, message, userId, orgId }) => {
  // 1. Resolve or create Chat
  let chat;
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, user: userId });
    if (!chat) {
      throw new AppError('Chat session not found.', 404);
    }
  } else {
    // Generate a contextual title using AI
    const title = await generateChatTitle(message);
    chat = await Chat.create({ user: userId, title });
  }

  // 2. Save User Message
  await Message.create({
    chat: chat._id,
    content: message,
    role: 'user',
  });

  // 3. Fetch past messages for AI context
  const pastMessages = await Message.find({ chat: chat._id })
    .sort({ createdAt: 1 })
    .lean();

  const formattedHistory = pastMessages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // 4. RAG Context
  let ragContext = '';
  try {
    let vectorStore = getVectorStore(orgId);
    if (!vectorStore) {
      console.log(`🔄 RAG auto-refresh triggered for [${orgId}]`);
      await refreshRAGForOrg(orgId);
      vectorStore = getVectorStore(orgId);
    }

    if (vectorStore) {
      const docs = await vectorStore.similaritySearch(message, 3);
      ragContext = docs.map((d) => d.pageContent).join('\n\n');
    }
  } catch (err) {
    console.warn('⚠️  RAG lookup skipped:', err.message);
  }

  // 5. Construct payload for Groq
  const aiPayload = [
    { role: 'system', content: buildSystemPrompt(ragContext, orgId) },
    ...formattedHistory // Includes the current user message
  ];

  // 6. Call Groq
  const answer = await askGroq(aiPayload);

  // 7. Save AI Response
  const aiMessage = await Message.create({
    chat: chat._id,
    content: answer,
    role: 'ai',
  });

  return { chatId: chat._id, answer: aiMessage.content };
};

export const getUserChats = async (userId) => {
  return await Chat.find({ user: userId }).sort({ updatedAt: -1 });
};

export const getChatMessages = async (chatId, userId) => {
  const chat = await Chat.findOne({ _id: chatId, user: userId });
  if (!chat) {
    throw new AppError('Chat not found.', 404);
  }
  return await Message.find({ chat: chatId }).sort({ createdAt: 1 });
};

export const removeChat = async (chatId, userId) => {
  const chat = await Chat.findOneAndDelete({ _id: chatId, user: userId });
  if (!chat) {
    throw new AppError('Chat not found.', 404);
  }
  await Message.deleteMany({ chat: chatId });
};
