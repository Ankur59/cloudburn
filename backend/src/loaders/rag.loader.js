import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { Pinecone } from '@pinecone-database/pinecone';
import BillingSnapshot from '../models/billingSnapshot.model.js';

// ── Pinecone Setup ────────────────────────────────────────────────────────────
let pc = null;
const INDEX_NAME = 'cloudburn-rag';
const DIMENSION = 384; // all-MiniLM-L6-v2

const getPineconeClient = () => {
  if (!pc) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is not defined in environment variables.");
    }
    pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pc;
};

// Get or create index helper
const getPineconeIndex = async () => {
  const client = getPineconeClient();
  const existingIndexes = await client.listIndexes();
  const indexExists = existingIndexes.indexes?.some(i => i.name === INDEX_NAME);
  
  if (!indexExists) {
    console.log(`Creating Pinecone index: ${INDEX_NAME}... (this might take a minute)`);
    await client.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1' // You can change this to match your preferred region
        }
      },
      waitUntilReady: true
    });
  }
  return client.index(INDEX_NAME);
};

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

// ── buildTextChunks ────────────────────────────────────────────────────────────
// Builds rich text chunks from DailyCost + BillingSnapshot for an org.
// More text = richer AI context.

const buildTextChunks = async (orgId) => {
  const texts = [];

  // 1) Snapshot: service breakdown totals
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

    // Team and EC2 Instance spending breakdown
    if (snap.byTeam?.length > 0) {
      const lines = [];
      snap.byTeam.forEach(t => {
        const teamName = t.team === "unassigned" ? "Unallocated" : t.team;
        lines.push(`Team: ${teamName} | Total Cost: $${(t.cost || 0).toFixed(6)}`);
        if (t.instances && t.instances.length > 0) {
          lines.push(`  EC2 Instances for ${teamName}:`);
          t.instances.forEach(i => {
            lines.push(`  - Instance: ${i.instanceName || i.resourceId} (${i.instanceType}) | State: ${i.state} | AZ: ${i.az} | Cost: $${(i.cost || 0).toFixed(6)} | Usage Hours: ${i.usageHours}`);
          });
        }
      });
      texts.push(`Team and EC2 Instance Spending:\n${lines.join('\n')}`);
    }

    // Daily Trend (Last 90 Days)
    if (snap.dailyTrend90?.length > 0) {
      const lines = snap.dailyTrend90.map(
        (d) => `${d.date}: $${(d.cost || 0).toFixed(4)}`
      );
      texts.push(`Daily cost trend (last 90 days):\n${lines.join('\n')}`);
    } else if (snap.dailyBreakdown?.length > 0) {
      // Fallback to 30 days
      const lines = snap.dailyBreakdown.map(
        (d) => `${d.date}: $${(d.grossCost || 0).toFixed(4)}`
      );
      texts.push(`Daily cost trend (last 30 days):\n${lines.join('\n')}`);
    }

    // By AWS Region
    if (snap.byRegion?.length > 0) {
      const lines = snap.byRegion.map(
        (r) => `${r.region}: $${(r.cost || 0).toFixed(6)}`
      );
      texts.push(`Cost breakdown by AWS Region:\n${lines.join('\n')}`);
    }

    // By Usage Type
    if (snap.byUsageType?.length > 0) {
      const lines = snap.byUsageType.map(
        (u) => `${u.usageType}: $${(u.cost || 0).toFixed(6)} (${u.usageQuantity} ${u.unit})`
      );
      texts.push(`Cost breakdown by Usage Type:\n${lines.join('\n')}`);
    }

    // By Record Type (Usage vs Tax vs Credits)
    if (snap.byRecordType?.length > 0) {
      const lines = snap.byRecordType.map(
        (r) => `${r.recordType}: $${(r.cost || 0).toFixed(6)}`
      );
      texts.push(`Cost breakdown by Record Type (Usage/Tax/Credits):\n${lines.join('\n')}`);
    }
  }

  return texts;
};

// ── buildVectorStoreForOrg ────────────────────────────────────────────────────
const buildVectorStoreForOrg = async (orgId) => {
  const texts = await buildTextChunks(orgId);

  if (texts.length === 0) {
    console.warn(`⚠️  RAG [${orgId}]: No billing data found.`);
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

  const index = await getPineconeIndex();

  const records = chunks.map((pageContent, i) => ({
    id: `${orgId}-chunk-${i}`,
    values: embeddings[i],
    metadata: {
      orgId: orgId.toString(),
      pageContent
    }
  }));

  console.log(`📦 RAG [${orgId}]: Upserting to Pinecone...`);
  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await index.upsert({ records: batch });
  }
  
  console.log(`✅ RAG [${orgId}]: ${texts.length} text block(s) → ${chunks.length} chunk(s) indexed in Pinecone.`);
};

// ── initRAG ───────────────────────────────────────────────────────────────────
// Called once on server startup — indexes all orgs that have billing data.

export const initRAG = async () => {
  console.log('🔍 Initialising RAG vector store in Pinecone...');
  try {
    const orgIds = await BillingSnapshot.distinct('orgId');

    if (orgIds.length === 0) {
      console.warn(
        '⚠️  RAG: No billing data yet. ' +
        'Call GET /api/aws/billing to populate and auto-index.',
      );
      return;
    }

    await Promise.all(orgIds.map((orgId) => buildVectorStoreForOrg(orgId)));
    console.log(`✅ RAG ready for ${orgIds.length} organisation(s) in Pinecone.`);
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
// Returns an object matching the expected interface (with similaritySearch)
export const getVectorStore = (orgId) => {
  return {
    async similaritySearch(query, k = 5) {
      try {
        const model = getEmbeddingsModel();
        const queryEmbedding = await model.embedQuery(query);
        const index = await getPineconeIndex();
        
        const results = await index.query({
          vector: queryEmbedding,
          topK: k,
          filter: { orgId: orgId.toString() },
          includeMetadata: true
        });

        // Map results back to expected format
        return results.matches.map(match => ({
          pageContent: match.metadata.pageContent
        }));
      } catch (err) {
        console.error("Pinecone similarity search failed:", err);
        return [];
      }
    }
  };
};
