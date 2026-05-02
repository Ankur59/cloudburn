import mongoose from 'mongoose';

// ── BillingSnapshot ────────────────────────────────────────────────────────────
// Stores one complete billing snapshot per (orgId) per fetch.
// This gives the RAG rich context: service breakdown, monthly trend,
// operations, usage types — beyond just per-day raw records.
//
// Using "replace on fetch" — only ONE latest snapshot per org is kept.
// Old snapshot is replaced on every billing API call so RAG always has fresh data.

const billingSnapshotSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      required: [true, 'orgId is required'],
      unique: true,     // One snapshot per org — replaced on every fetch
    },
    fetchedAt:       { type: Date, default: Date.now },

    // Top-level summary
    grossCost:       { type: Number, default: 0 },
    totalCost:       { type: Number, default: 0 },
    credits:         { type: Number, default: 0 },
    topService:      { type: String, default: '' },
    topServiceCost:  { type: Number, default: 0 },

    // Service breakdown: [{ service, cost, percent }]
    serviceBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Daily breakdown (last 30 days): [{ date, grossCost, credits, netCost }]
    dailyBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Monthly trend: [{ month, cost }]
    monthlyTrend: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Monthly by service: [{ month, service, cost }]
    monthlyByService: { type: mongoose.Schema.Types.Mixed, default: [] },

    // By operation: [{ service, operation, cost }]
    byOperation: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Month-over-month comparison: { lastMonthTotal, thisMonthTotal, byService }
    monthComparison: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Dashboard formatted data
    dashboardData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: false },
);

const BillingSnapshot = mongoose.model('BillingSnapshot', billingSnapshotSchema);
export default BillingSnapshot;
