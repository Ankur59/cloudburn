import BillingSnapshot from '../models/billingSnapshot.model.js';
import InsightCache from '../models/insightCache.model.js';
import { ChatGroq } from '@langchain/groq';
import { config } from '../config/config.js';

// ── Groq client (singleton) ───────────────────────────────────────────────────
let groqClient = null;
const getGroq = () => {
  if (!groqClient) {
    groqClient = new ChatGroq({
      apiKey: config.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
    });
  }
  return groqClient;
};

// ── Today's date key (IST-aware, format YYYY-MM-DD) ─────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);

// ── Build a rich, structured prompt from BillingSnapshot ─────────────────────
const buildInsightPrompt = (snap) => {
  const lines = [];

  lines.push(`You are an expert AWS FinOps consultant. Analyse the following real AWS billing data and generate actionable cost optimisation insights.`);
  lines.push(`\n=== AWS BILLING SUMMARY ===`);
  lines.push(`Total Gross Cost (AmortizedCost): $${(snap.grossCost || 0).toFixed(2)}`);
  lines.push(`Total Credits / Refunds: $${Math.abs(snap.credits || 0).toFixed(2)}`);
  lines.push(`Top Service: ${snap.topService} ($${(snap.topServiceCost || 0).toFixed(2)})`);

  if (snap.serviceBreakdown?.length > 0) {
    lines.push(`\n=== SERVICE BREAKDOWN (Last 30 Days) ===`);
    snap.serviceBreakdown.slice(0, 10).forEach((s) => {
      lines.push(`${s.service}: $${(s.cost || 0).toFixed(2)} (${s.percentOfTotal || s.percent || 0}%)`);
    });
  }

  if (snap.monthComparison?.thisMonthTotal != null) {
    const mc = snap.monthComparison;
    lines.push(`\n=== MONTH-OVER-MONTH COMPARISON ===`);
    lines.push(`Last Month: $${(mc.lastMonthTotal || 0).toFixed(2)}`);
    lines.push(`This Month: $${(mc.thisMonthTotal || 0).toFixed(2)}`);
    lines.push(`Change: ${mc.changePercent ?? 'N/A'}% ($${(mc.delta || 0).toFixed(2)})`);
  }

  if (snap.byRegion?.length > 0) {
    lines.push(`\n=== COST BY REGION ===`);
    snap.byRegion.slice(0, 8).forEach((r) => {
      lines.push(`${r.region}: $${(r.cost || 0).toFixed(2)}`);
    });
  }

  if (snap.byTeam?.length > 0) {
    lines.push(`\n=== COST BY TEAM ===`);
    snap.byTeam.forEach((t) => {
      const name = t.team === 'unassigned' ? 'Unallocated' : t.team;
      lines.push(`${name}: $${(t.cost || 0).toFixed(2)}`);
    });
  }

  if (snap.byOperation?.length > 0) {
    const top = snap.byOperation
      .filter((o) => o.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);
    lines.push(`\n=== TOP API OPERATIONS BY COST ===`);
    top.forEach((o) => {
      lines.push(`${o.service} → ${o.operation}: $${(o.cost || 0).toFixed(2)}`);
    });
  }

  if (snap.monthlyTrend?.length > 0) {
    lines.push(`\n=== MONTHLY TREND (Last 12 Months) ===`);
    snap.monthlyTrend.slice(-6).forEach((m) => {
      lines.push(`${m.month}: $${(m.cost || 0).toFixed(2)}`);
    });
  }

  lines.push(`
=== YOUR TASK ===
Based ONLY on the billing data above, generate between 4 and 8 specific, actionable insights.
Return ONLY a valid JSON array. No markdown, no explanation text before or after.

Each insight object must have EXACTLY these fields:
{
  "group": "Cost Optimization" | "Performance" | "Security" | "Reliability",
  "title": "short action title (max 10 words)",
  "service": "AWS · <ServiceName>",
  "explanation": "2-3 sentences explaining the finding and recommendation based on the real cost data above. Reference actual dollar amounts from the data.",
  "savingsNum": <estimated monthly savings as a plain number (e.g. 15.50), use 20% of the service cost if not explicitly calculable>,
  "confidence": <integer 70-99>,
  "priority": "critical" | "high" | "medium" | "low",
  "actionLabel": "Apply Optimization" | "Review Resource"
}

Rules:
- Use ONLY the services visible in the billing data above.
- Reference REAL dollar amounts from the data.
- For services with high cost percentages, recommend Reserved Instances or Savings Plans.
- If a service has zero usage in some regions, flag it.
- If month-over-month cost increased significantly, flag it as critical.
- ALWAYS provide a non-zero "savingsNum" for Cost Optimization insights (estimate 15-20% of the cost).
- Do NOT invent data not present in the billing context.
`);

  return lines.join('\n');
};

// ── _callGroqAndNormalise ──────────────────────────────────────────────────────
// Internal: fires Groq, parses JSON, normalises insight objects.
const _callGroqAndNormalise = async (snap) => {
  const prompt = buildInsightPrompt(snap);
  let rawInsights = [];

  try {
    const groq = getGroq();
    const response = await groq.invoke([
      {
        role: 'system',
        content:
          'You are an AWS FinOps expert. You ONLY output valid JSON arrays. Never add explanation text outside the JSON.',
      },
      { role: 'user', content: prompt },
    ]);

    const content = response.content?.trim() || '[]';
    const cleaned = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    rawInsights = JSON.parse(cleaned);
    if (!Array.isArray(rawInsights)) rawInsights = [];
  } catch (err) {
    console.error('⚠️  Groq insights generation failed:', err.message);
    rawInsights = [];
  }

  return rawInsights.map((ins, i) => ({
    id: `ins-${Date.now()}-${i}`,
    group: ins.group || 'Cost Optimization',
    title: ins.title || 'Untitled insight',
    service: ins.service || 'AWS',
    explanation: ins.explanation || '',
    savings:
      ins.savingsNum > 0
        ? `$${Number(ins.savingsNum).toLocaleString('en-US')}/mo`
        : '$0/mo',
    savingsNum: Number(ins.savingsNum) || 0,
    confidence: Number(ins.confidence) || 80,
    priority: ins.priority || 'medium',
    actionLabel: ins.actionLabel || 'Review Resource',
    isNew: true,
    status: 'active',
  }));
};

// ── refreshInsightsForOrg ─────────────────────────────────────────────────────
// Generates fresh insights from Groq and persists them to InsightCache.
// Called:
//   1. After every /api/aws/billing fetch (non-blocking, background)
//   2. By the midnight cron job for all orgs
export const refreshInsightsForOrg = async (orgId) => {
  if (!orgId) return;

  try {
    const snap = await BillingSnapshot.findOne({ orgId }).lean();
    if (!snap) {
      console.warn(`⚠️  InsightCache [${orgId}]: No BillingSnapshot found — skipping.`);
      return;
    }

    console.log(`🤖 Generating AI insights for org [${orgId}]...`);
    const insights = await _callGroqAndNormalise(snap);

    const summary = {
      grossCost: snap.grossCost,
      topService: snap.topService,
      topServiceCost: snap.topServiceCost,
    };

    await InsightCache.findOneAndUpdate(
      { orgId },
      {
        $set: {
          orgId,
          dateKey: todayKey(),
          generatedAt: new Date(),
          billingFetchedAt: snap.fetchedAt,
          insights,
          summary,
        },
      },
      { upsert: true },
    );

    console.log(
      `✅ InsightCache saved for org [${orgId}] — ${insights.length} insight(s).`,
    );
  } catch (err) {
    console.error(`❌ refreshInsightsForOrg [${orgId}] failed:`, err.message);
  }
};

// ── generateInsights ──────────────────────────────────────────────────────────
// Public — called by GET /api/dashboard/insights.
// Strategy:
//   1. Check InsightCache for this org → if found (today's dateKey), return it.
//   2. If stale or missing → generate via Groq + save → return.
export const generateInsights = async (orgId) => {
  // ── Step 1: Cache hit? ────────────────────────────────────────────────────
  const cached = await InsightCache.findOne({ orgId }).lean();

  if (cached && cached.dateKey === todayKey() && cached.insights?.length > 0) {
    console.log(`⚡ InsightCache hit for org [${orgId}] (${cached.insights.length} insights)`);
    return {
      insights: cached.insights,
      fetchedAt: cached.billingFetchedAt || cached.generatedAt,
      generatedAt: cached.generatedAt,
      summary: cached.summary,
    };
  }

  // ── Step 2: Cache miss / stale → check BillingSnapshot ───────────────────
  const snap = await BillingSnapshot.findOne({ orgId }).lean();

  if (!snap) {
    return { insights: [], fetchedAt: null, generatedAt: null };
  }

  // ── Step 3: Generate fresh insights via Groq ──────────────────────────────
  console.log(`🔄 InsightCache miss for org [${orgId}] — generating via Groq...`);
  const insights = await _callGroqAndNormalise(snap);

  const summary = {
    grossCost: snap.grossCost,
    topService: snap.topService,
    topServiceCost: snap.topServiceCost,
  };

  // ── Step 4: Persist to MongoDB ────────────────────────────────────────────
  const now = new Date();
  await InsightCache.findOneAndUpdate(
    { orgId },
    {
      $set: {
        orgId,
        dateKey: todayKey(),
        generatedAt: now,
        billingFetchedAt: snap.fetchedAt,
        insights,
        summary,
      },
    },
    { upsert: true },
  );

  console.log(`✅ InsightCache created for org [${orgId}] — ${insights.length} insight(s).`);

  return {
    insights,
    fetchedAt: snap.fetchedAt,
    generatedAt: now,
    summary,
  };
};

// ── applyInsightInCache ───────────────────────────────────────────────────────
// Marks a single insight as applied (status: 'applied') in InsightCache.
export const applyInsightInCache = async (orgId, insightId) => {
  const cache = await InsightCache.findOne({ orgId });
  if (!cache) throw new Error('InsightCache not found for this org');

  const idx = cache.insights.findIndex((ins) => ins.id === insightId);
  if (idx === -1) throw new Error(`Insight ${insightId} not found`);

  cache.insights[idx] = {
    ...cache.insights[idx],
    status: 'applied',
    isNew: false,
    appliedAt: new Date().toISOString(),
  };
  cache.markModified('insights'); // tell Mongoose Mixed field changed
  await cache.save();

  return cache.insights[idx];
};

// ── dismissInsightFromCache ───────────────────────────────────────────────────
// Removes an insight permanently from InsightCache (no dismissed tab in DB).
export const dismissInsightFromCache = async (orgId, insightId) => {
  const result = await InsightCache.findOneAndUpdate(
    { orgId },
    { $pull: { insights: { id: insightId } } },
    { new: true },
  );
  if (!result) throw new Error('InsightCache not found for this org');
  return { deleted: true, insightId };
};

// ── forceRefreshInsights ──────────────────────────────────────────────────────
// Deletes current InsightCache and generates fresh insights via Groq.
// Called by POST /api/dashboard/insights/refresh (Run AI Scan button).
export const forceRefreshInsights = async (orgId) => {
  const snap = await BillingSnapshot.findOne({ orgId }).lean();
  if (!snap) throw new Error('No billing data found. Please fetch billing data first.');

  // Delete current cache so a fresh one is created
  await InsightCache.deleteOne({ orgId });

  console.log(`🔄 Force-refreshing AI insights for org [${orgId}]...`);
  const insights = await _callGroqAndNormalise(snap);

  const summary = {
    grossCost: snap.grossCost,
    topService: snap.topService,
    topServiceCost: snap.topServiceCost,
  };

  const now = new Date();
  await InsightCache.create({
    orgId,
    dateKey: todayKey(),
    generatedAt: now,
    billingFetchedAt: snap.fetchedAt,
    insights,
    summary,
  });

  console.log(`✅ Force-refresh complete for org [${orgId}] — ${insights.length} insight(s).`);

  return {
    insights,
    fetchedAt: snap.fetchedAt,
    generatedAt: now,
    summary,
  };
};
