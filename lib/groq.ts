import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const GROQ_MODELS = {
  FAST: "llama3-8b-8192",      // Fastest, good for simple tasks
  BALANCED: "llama3-70b-8192", // Best balance of speed and quality
  ADVANCED: "mixtral-8x7b-32768" // More capable, slightly slower
} as const

// Default model for code correction
export const DEFAULT_MODEL = GROQ_MODELS.BALANCED