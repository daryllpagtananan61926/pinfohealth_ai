export const config = {
  port: Number(process.env.PORT) || 3000,
  allowedOrigin: process.env.ALLOWED_ORIGIN || null,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
};

export default config;