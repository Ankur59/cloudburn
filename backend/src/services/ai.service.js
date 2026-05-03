import { ChatGroq } from '@langchain/groq';
import { config } from '../config/config.js';

// ── Groq client (singleton) ───────────────────────────────────────────────────
const groq = new ChatGroq({
  apiKey: config.GROQ_API_KEY,
  model: 'llama-3.1-8b-instant',
  temperature: 0.4,
});

// ── generateSpikeExplanation ──────────────────────────────────────────────────
// Given spike metadata, calls Groq LLaMA3-8b and returns a 3-4 sentence
// plain-English explanation of why the cost spike likely occurred and what
// the team should do about it.

export const generateSpikeExplanation = async ({
  service,
  previousCost,
  currentCost,
  multiplier,
  date,
}) => {
  const prompt = `You are an AWS cost analysis expert. An AWS cost spike has been detected.

Details:
- AWS Service: ${service}
- Date: ${date}
- Previous day cost: $${previousCost.toFixed(6)} USD
- Current day cost: $${currentCost.toFixed(6)} USD
- Spike multiplier: ${multiplier.toFixed(2)}x

In exactly 3-4 sentences, explain: (1) the most likely technical reason for this specific spike in ${service}, (2) what AWS resource behaviour typically causes this pattern, and (3) one concrete remediation step the engineering team should take. Be specific and actionable. Do not use bullet points.`;

  try {
    const response = await groq.invoke([{ role: 'user', content: prompt }]);
    return response.content?.trim() || 'AI explanation unavailable.';
  } catch (err) {
    console.error('⚠️  Groq spike explanation failed:', err.message);
    return 'AI explanation unavailable due to a temporary error.';
  }
};

// ── askGroq ───────────────────────────────────────────────────────────────────
// General-purpose chat invocation used by chat.service.js.
// Accepts a LangChain-compatible messages array and returns the answer string.

export const askGroq = async (messages) => {
  const response = await groq.invoke(messages);
  return response.content?.trim() || '';
};

// ── generateChatTitle ─────────────────────────────────────────────────────────
// Generates a short, descriptive title (max 5 words) for a new chat session based
// on the user's first message.

export const generateChatTitle = async (firstMessage) => {
  const prompt = `You are a helpful assistant that generates short, concise titles for chat sessions.
Based on the following user message, generate a chat title that is at most 5 words long.
Do not use quotes or punctuation. Just output the title.

Message: "${firstMessage}"`;

  try {
    const response = await groq.invoke([{ role: 'user', content: prompt }]);
    return response.content?.trim() || 'New Chat';
  } catch (err) {
    console.error('⚠️  Groq title generation failed:', err.message);
    return 'New Chat';
  }
};
