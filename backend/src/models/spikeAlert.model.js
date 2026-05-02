import mongoose from 'mongoose';

// ── SpikeAlert ─────────────────────────────────────────────────────────────────
// Created when a service cost is ≥ 2× yesterday's cost.
// One document per (date, service) pair — upserted by the spike job.

const spikeAlertSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      required: [true, 'orgId is required'],
    },
    date: {
      type: String,
      required: [true, 'date is required'], // "YYYY-MM-DD"
    },
    service: {
      type: String,
      required: [true, 'service is required'],
    },
    previousCost: { type: Number, required: true },
    currentCost:  { type: Number, required: true },
    multiplier:   { type: Number, required: true },
    aiExplanation: { type: String, default: '' },
    isRead:        { type: Boolean, default: false },
  },
  { timestamps: true },
);

spikeAlertSchema.index({ orgId: 1, date: 1, service: 1 });

const SpikeAlert = mongoose.model('SpikeAlert', spikeAlertSchema);
export default SpikeAlert;
