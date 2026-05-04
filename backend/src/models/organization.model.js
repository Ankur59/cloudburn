import mongoose from "mongoose";

// Organization stores cloud provider data and usage info only.
// It is NOT linked to authentication — auth lives entirely in the User model.
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: [100, "Organization name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Organization contact email is required"],
      lowercase: true,
      trim: true,
    },

    // ── AWS Cloud credentials ──────────────────────────────────────────────
    awsAccessKey: { type: String, select: false, default: null },
    awsSecretKey: { type: String, select: false, default: null },
    awsRegion: { type: String, default: null },
    awsAccountId: { type: String, default: null },
    awsConnectedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Strip cloud secrets from JSON output
organizationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.awsAccessKey;
  delete obj.awsSecretKey;
  return obj;
};

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;


// April ke liye, maine data ka adhyayan kiya hai aur yeh hai ki:
// 
// - April ke liye total gross cost hai $0.003698.
// - April ke liye total net cost hai $0.003698 (gross cost se credits ko ghataaya gaya hai, jo ki is case mein zero hai).
// - April ke liye total credits hai $0.
// 
// April ke liye sabse badi kharcha Amazon Elastic Container Service (ECS) se hai, jiska gross cost $0.001564 hai.
// 
// April ke liye, yeh hai ki:
// 
// - ECS ka net cost $0.001564 hai.
// - Amazon Elastic Load Balancing (ELB) ka net cost $0.000031 hai.
// - Amazon Simple Notification Service (SNS), Amazon Simple Queue Service (SQS), aur Amazon Simple Storage Service (S3) ke net costs zero hain.
// 
// April ke liye, yeh hai ki koi bhi service ka net cost zero nahi hai, jisse yeh pata chalta hai ki April ke liye koi bhi service ka net cost zero nahi hai.
// 
// Yeh hai ki April ke liye sabse badi kharcha ECS se hai, jisse yeh pata chalta hai ki ECS ko optimize karna upyogi ho sakta hai.
// 
// Actionable cost optimization suggestion:
// - ECS ke usage ko monitor karein aur ECS ke instance ko downsize ya terminate karein, agar zaroorat nahi hai.
// - ECS ke usage ko optimize karein, agar zaroorat hai.