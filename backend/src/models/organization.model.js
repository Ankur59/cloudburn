import mongoose from 'mongoose';

// Organization stores cloud provider data and usage info only.
// It is NOT linked to authentication — auth lives entirely in the User model.
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Organization contact email is required'],
      lowercase: true,
      trim: true,
    },

    // ── AWS Cloud credentials ──────────────────────────────────────────────
    awsAccessKey:   { type: String, select: false, default: null },
    awsSecretKey:   { type: String, select: false, default: null },
    awsRegion:      { type: String, default: null },
    awsConnectedAt: { type: Date,   default: null },
    lastSyncedAt:   { type: Date,   default: null },
  },
  { timestamps: true }
);

// Strip cloud secrets from JSON output
organizationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.awsAccessKey;
  delete obj.awsSecretKey;
  return obj;
};

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
