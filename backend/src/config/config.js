import dotenv from 'dotenv';
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // MongoDB
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/cloudburn',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'cb-access-secret-change-in-prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'cb-refresh-secret-change-in-prod',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Client
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Brevo (email)
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Email verification token TTL (24 h in ms)
  EMAIL_VERIFICATION_TTL_MS: 24 * 60 * 60 * 1000,

  // AI — Groq (LLaMA3)
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // pinecone
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
};
