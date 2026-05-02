import mongoose from "mongoose";

// ── BillingSnapshot ────────────────────────────────────────────────────────────
// Stores one complete billing snapshot per orgId per fetch.
// One document per org — replaced on every billing API call so RAG always has fresh data.
//
// ⚠️  grossCost / totalCost = AmortizedCost (credits NOT subtracted).
//     netCost = AmortizedCost minus credits (internal, NOT shown in UI).
//     credits = negative value representing refunds/discounts — shown as "savings".

const billingSnapshotSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      required: [true, "orgId is required"],
      unique: true, // One snapshot per org — replaced on every fetch
    },
    fetchedAt: { type: Date, default: Date.now },

    // ─ Top-level cost summary ──────────────────────────────────────────────────
    grossCost: { type: Number, default: 0 }, // AmortizedCost total (PRIMARY — no credit deduction)
    totalCost: { type: Number, default: 0 }, // alias of grossCost (credits NOT subtracted)
    credits: { type: Number, default: 0 }, // credits/refunds (negative) — shown as savings
    netCost: { type: Number, default: 0 }, // after-credit total (internal only)
    topService: { type: String, default: "" },
    topServiceCost: { type: Number, default: 0 },

    // ─ Breakdowns ─────────────────────────────────────────────────────────────
    // Service breakdown: [{ service, cost, percentOfTotal }]
    serviceBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Daily breakdown (last 30 days): [{ date, grossCost, credits, netCost }]
    dailyBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Daily trend (last 90 days): [{ date, cost }]
    dailyTrend90: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Monthly trend: [{ month, cost }] last 12 months
    monthlyTrend: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Monthly by service: [{ month, service, cost }]
    monthlyByService: { type: mongoose.Schema.Types.Mixed, default: [] },

    // By AWS region: [{ region, cost }]
    byRegion: { type: mongoose.Schema.Types.Mixed, default: [] },

    // By usage type: [{ usageType, cost, amortized, usageQuantity, unit }]
    byUsageType: { type: mongoose.Schema.Types.Mixed, default: [] },

    // By operation: [{ service, operation, cost }]
    byOperation: { type: mongoose.Schema.Types.Mixed, default: [] },

    // By record type: [{ recordType, cost }] — Usage | Tax | Credit | Refund | Fee
    byRecordType: { type: mongoose.Schema.Types.Mixed, default: [] },

    // By team: [{ team, cost, services[{service,cost,usageQty}], instances[{instanceType,cost,usageHours}] }]
    byTeam: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Month-over-month comparison: { lastMonthTotal, thisMonthTotal, delta, changePercent, byService[] }
    monthComparison: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Dashboard formatted data (pre-computed for the frontend)
    dashboardData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: false },
);

const BillingSnapshot = mongoose.model(
  "BillingSnapshot",
  billingSnapshotSchema,
);
export default BillingSnapshot;
