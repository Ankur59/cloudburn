import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import DailyCost from '../models/dailyCost.model.js';
import BillingSnapshot from '../models/billingSnapshot.model.js';

// ── Shared embeddings model (singleton — model download happens once) ──────────
let embeddingsModel = null;

const getEmbeddingsModel = () => {
  if (!embeddingsModel) {
    embeddingsModel = new HuggingFaceTransformersEmbeddings({
      modelName: 'sentence-transformers/all-MiniLM-L6-v2',
    });
  }
  return embeddingsModel;
};

// ── Cosine similarity helper ──────────────────────────────────────────────────
const cosineSim = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ── Lightweight in-memory vector store ───────────────────────────────────────
const createMemoryVectorStore = (docs) => ({
  _docs: docs,
  async similaritySearch(query, k = 5) {
    const model = getEmbeddingsModel();
    const queryEmbedding = await model.embedQuery(query);
    return this._docs
      .map((doc) => ({
        ...doc,
        score: cosineSim(queryEmbedding, doc.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(({ pageContent }) => ({ pageContent }));
  },
});

// ── Per-org vector store Map ───────────────────────────────────────────────────
const orgVectorStores = new Map();

// ── buildTextChunks ────────────────────────────────────────────────────────────
// Builds rich text chunks from DailyCost + BillingSnapshot for an org.
// More text = richer AI context.

const buildTextChunks = async (orgId) => {
  const texts = [];

  // 1) Per-day per-service cost records
  const dailyRecords = await DailyCost.find({ orgId }).lean();
  if (dailyRecords.length > 0) {
    dailyRecords.forEach(({ date, service, grossCost, netCost, credits }) => {
      texts.push(
        `Date: ${date} | Service: ${service} | Gross: $${grossCost.toFixed(6)} | Net: $${netCost.toFixed(6)} | Credits: $${credits.toFixed(6)}`,
      );
    });
  }

  // 2) Snapshot: service breakdown totals
  const snap = await BillingSnapshot.findOne({ orgId }).lean();
  if (snap) {
    texts.push(
      `Organisation AWS Cost Summary: Total gross cost $${snap.grossCost.toFixed(6)} USD. ` +
      `Net cost after credits: $${snap.totalCost.toFixed(6)} USD. Credits: $${snap.credits.toFixed(6)} USD. ` +
      `Top service: ${snap.topService} ($${snap.topServiceCost.toFixed(6)} USD).`,
    );

    // Service breakdown
    if (snap.serviceBreakdown?.length > 0) {
      const lines = snap.serviceBreakdown.map(
        (s) => `${s.service}: $${(s.cost || 0).toFixed(6)} (${s.percent || 0}% of total)`,
      );
      texts.push(`Service cost breakdown:\n${lines.join('\n')}`);
    }

    // Monthly trend
    if (snap.monthlyTrend?.length > 0) {
      const lines = snap.monthlyTrend.map(
        (m) => `${m.month}: $${(m.cost || 0).toFixed(6)}`,
      );
      texts.push(`Monthly cost trend:\n${lines.join('\n')}`);
    }

    // Monthly by service
    if (snap.monthlyByService?.length > 0) {
      const lines = snap.monthlyByService.map(
        (m) => `${m.month} | ${m.service}: $${(m.cost || 0).toFixed(6)}`,
      );
      texts.push(`Monthly cost by service:\n${lines.join('\n')}`);
    }

    // Top operations by cost
    if (snap.byOperation?.length > 0) {
      const top = snap.byOperation
        .filter((o) => o.cost > 0)
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);
      const lines = top.map(
        (o) => `${o.service} → ${o.operation}: $${(o.cost || 0).toFixed(6)}`,
      );
      texts.push(`Top AWS operations by cost:\n${lines.join('\n')}`);
    }

    // Month comparison
    if (snap.monthComparison?.thisMonthTotal != null) {
      const mc = snap.monthComparison;
      texts.push(
        `Month-over-month comparison: Last month $${(mc.lastMonthTotal || 0).toFixed(6)}, ` +
        `This month $${(mc.thisMonthTotal || 0).toFixed(6)}, ` +
        `Delta: $${(mc.delta || 0).toFixed(6)} (${mc.changePercent ?? 'N/A'}% change).`,
      );
    }

    // Dashboard Data (Frontend Context)
    if (snap.dashboardData) {
      if (snap.dashboardData.kpis) {
        const kpiStr = snap.dashboardData.kpis.map(k => `${k.label}: ${k.value} (${k.trend || ''} ${k.subtitle || ''})`).join('\n');
        texts.push(`Dashboard KPIs:\n${kpiStr}`);
      }
      if (snap.dashboardData.teams) {
        const teamStr = snap.dashboardData.teams.map(t => `${t.name}: Spent $${t.spent} (Budget $${t.budget}, Status: ${t.status})`).join('\n');
        texts.push(`Dashboard Top Spending Teams:\n${teamStr}`);
      }
    }
  }

  return texts;
};

// ── buildVectorStoreForOrg ────────────────────────────────────────────────────
const buildVectorStoreForOrg = async (orgId) => {
  const texts = await buildTextChunks(orgId);

  if (texts.length === 0) {
    console.warn(`⚠️  RAG [${orgId}]: No billing data found.`);
    orgVectorStores.delete(orgId);
    return;
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 60,
  });

  const allText = texts.join('\n\n');
  const chunks  = await splitter.splitText(allText);

  const model = getEmbeddingsModel();
  console.log(`📐 RAG [${orgId}]: Embedding ${chunks.length} chunk(s)...`);
  const embeddings = await model.embedDocuments(chunks);

  const docs = chunks.map((pageContent, i) => ({
    pageContent,
    embedding: embeddings[i],
  }));

  orgVectorStores.set(orgId, createMemoryVectorStore(docs));
  console.log(`✅ RAG [${orgId}]: ${texts.length} text block(s) → ${docs.length} chunk(s) indexed.`);
};

// ── initRAG ───────────────────────────────────────────────────────────────────
// Called once on server startup — indexes all orgs that have billing data.

export const initRAG = async () => {
  console.log('🔍 Initialising RAG vector store(s)...');
  try {
    const orgIds = await DailyCost.distinct('orgId');

    if (orgIds.length === 0) {
      console.warn(
        '⚠️  RAG: No billing data yet. ' +
        'Call GET /api/aws/billing to populate and auto-index.',
      );
      return;
    }

    await Promise.all(orgIds.map((orgId) => buildVectorStoreForOrg(orgId)));
    console.log(`✅ RAG ready for ${orgIds.length} organisation(s).`);
  } catch (err) {
    console.error('❌ RAG initialisation failed:', err.message);
  }
};

// ── refreshRAGForOrg ──────────────────────────────────────────────────────────
// Called after every billing fetch — rebuilds that org's vector store
// with the latest DailyCost + BillingSnapshot data.

export const refreshRAGForOrg = async (orgId) => {
  if (!orgId) return;
  try {
    await buildVectorStoreForOrg(orgId);
  } catch (err) {
    console.error(`❌ RAG refresh failed for [${orgId}]:`, err.message);
  }
};

// ── getVectorStore ─────────────────────────────────────────────────────────────
export const getVectorStore = (orgId) => orgVectorStores.get(orgId);
