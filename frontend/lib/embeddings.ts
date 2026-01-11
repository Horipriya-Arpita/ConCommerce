/**
 * Embeddings Module - Dual Model Support
 *
 * Supports both OpenAI and HuggingFace embedding models:
 * - OpenAI text-embedding-3-small: Premium, more accurate
 * - HuggingFace all-MiniLM-L6-v2: Free, faster
 *
 * Both models produce 384-dimensional vectors for Pinecone compatibility.
 */

import OpenAI from 'openai'
import type { EmbeddingModel } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embedding using OpenAI
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 384, // Native 384 dimensions for better quality
  })

  return response.data[0].embedding
}

/**
 * Generate embedding using HuggingFace Inference Providers API
 * Using the new router endpoint with HF Inference provider
 */
async function generateHuggingFaceEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY

  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not set in environment variables')
  }

  // New HF Inference Providers endpoint with feature-extraction pipeline
  const response = await fetch('https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: [text], // Array format for sentence-transformers
      parameters: {
        wait_for_model: true,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HuggingFace API error (${response.status}): ${errorText}`)
  }

  const result = await response.json()

  // Handle different response formats
  // Sentence-transformers returns array of embeddings [[embedding1], [embedding2], ...]
  if (Array.isArray(result)) {
    // If it's an array of arrays (batch response), take first
    if (Array.isArray(result[0])) {
      // Check if inner array is numbers (the embedding)
      if (typeof result[0][0] === 'number') {
        return result[0] // Return first embedding
      }
    }
    // Direct array of numbers
    if (typeof result[0] === 'number') {
      return result
    }
  }

  throw new Error(`Unexpected response format: ${JSON.stringify(result).substring(0, 100)}`)
}

/**
 * Generate embedding for a text query with model selection
 *
 * @param text - The text to embed (user query)
 * @param model - Which embedding model to use ('openai' or 'huggingface')
 * @returns 384-dimensional embedding vector
 */
export async function generateEmbedding(text: string, model: EmbeddingModel = 'openai'): Promise<number[]> {
  try {
    if (model === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set in environment variables')
      }
      return await generateOpenAIEmbedding(text)
    } else {
      return await generateHuggingFaceEmbedding(text)
    }
  } catch (error: any) {
    console.error(`Error generating ${model} embedding:`, error)
    throw new Error(`Failed to generate ${model} embedding: ${error.message}`)
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 *
 * @param texts - Array of texts to embed
 * @param model - Which embedding model to use
 * @returns Array of 384-dimensional embedding vectors
 */
export async function generateEmbeddings(texts: string[], model: EmbeddingModel = 'openai'): Promise<number[][]> {
  try {
    if (model === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set in environment variables')
      }

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 384, // Native 384 dimensions for better quality
      })

      return response.data.map((item) => item.embedding)
    } else {
      // For HuggingFace, batch requests are not as efficient, but we'll process sequentially
      const embeddings = await Promise.all(texts.map((text) => generateHuggingFaceEmbedding(text)))
      return embeddings
    }
  } catch (error: any) {
    console.error(`Error generating ${model} embeddings:`, error)
    throw new Error(`Failed to generate ${model} embeddings: ${error.message}`)
  }
}
