import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    shareSlug: {
      type: String,
      default: null,
      unique: true,
      sparse: true, // null values pe unique apply nahi hogi
    },
  },
  { timestamps: true },
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
