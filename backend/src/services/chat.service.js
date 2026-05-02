import { getVectorStore, refreshRAGForOrg } from '../loaders/rag.loader.js';
import { askGroq } from './ai.service.js';

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

// ── sendMessage ───────────────────────────────────────────────────────────────
export const sendMessage = async ({ sessionId, message, orgId }) => {
  if (!orgId) throw new Error('orgId is required for chat');

  // RAG similarity search — ONLY this org's vector store
  let ragContext = '';
  try {
    let vectorStore = getVectorStore(orgId);

    // Auto-refresh: if org has no store yet (e.g. first chat after billing fetch),
    // trigger a rebuild so the user immediately benefits from their data.
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

  // Stateless messages payload — just system prompt and the current user message
  const messages = [
    { role: 'system', content: buildSystemPrompt(ragContext, orgId) },
    { role: 'user', content: message },
  ];

  // Call Groq
  const answer = await askGroq(messages);

  return { answer, sessionId };
};

// ── getHistory ────────────────────────────────────────────────────────────────
// Since data saving is disabled, always return an empty array.

export const getHistory = async (sessionId, orgId) => {
  return [];
};

// ── getAllSessions ────────────────────────────────────────────────────────────
// Since data saving is disabled, always return an empty array.

export const getAllSessions = async (orgId) => {
  return [];
};
