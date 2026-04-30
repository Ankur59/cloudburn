import crypto from "crypto";
import { config } from "../config/config.js";

const algorithm = "aes-256-cbc";
// Fallback to a 32-byte key if undefined, to prevent crashes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "cloudburn-secret-key-12345678901";
const key = Buffer.from(ENCRYPTION_KEY, "utf-8");

export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
};

export const decrypt = (text) => {
  if (!text) return text;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
