import mongoose from 'mongoose';

// ── DailyCost ──────────────────────────────────────────────────────────────────
// Persists the output of transformAwsCost() to MongoDB.
// One document per (orgId, date, service) — upserted on each billing fetch.
// orgId ensures complete data isolation between organisations.

const dailyCostSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      required: [true, 'orgId is required'], // Organisation identifier from JWT
    },
    date: {
      type: String,
      required: [true, 'date is required'], // "YYYY-MM-DD"
    },
    service: {
      type: String,
      required: [true, 'service is required'],
    },
    grossCost: { type: Number, default: 0 },
    netCost:   { type: Number, default: 0 },
    credits:   { type: Number, default: 0 },
    fetchedAt: { type: Date,   default: Date.now },
  },
  { timestamps: false },
);

// Compound unique index — one row per (org, date, service)
dailyCostSchema.index({ orgId: 1, date: 1, service: 1 }, { unique: true });

const DailyCost = mongoose.model('DailyCost', dailyCostSchema);
export default DailyCost;
