/**
 * Vector Search Module - Pinecone Integration
 *
 * Handles semantic search queries against the Pinecone vector database
 * with support for metadata filtering and dual embedding namespaces.
 */

import { Pinecone } from '@pinecone-database/pinecone'
import { Product, EmbeddingModel } from './types'

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

// Get index reference
const indexName = process.env.PINECONE_INDEX_NAME || 'concommerce-products'
const index = pc.index(indexName)

export interface SearchFilters {
  priceRange?: [number, number]
  categories?: string[]
  brands?: string[]
  sources?: string[]
}

// Minimum relevance score threshold (cosine similarity)
// Using native 384-dim embeddings now, so we can use higher thresholds
const RELEVANCE_THRESHOLD = 0.5 // For HuggingFace native 384-dim
const OPENAI_RELEVANCE_THRESHOLD = 0.4 // OpenAI text-embedding-3-small at 384-dim

/**
 * Get the appropriate namespace for an embedding model
 */
function getNamespace(embeddingModel: EmbeddingModel): string | undefined {
  // Default namespace (empty string) is for OpenAI embeddings
  // 'huggingface' namespace is for HuggingFace embeddings
  return embeddingModel === 'huggingface' ? 'huggingface' : undefined
}

/**
 * Search products using vector similarity and metadata filters
 *
 * @param queryEmbedding - 384-dimensional embedding vector
 * @param filters - Optional metadata filters
 * @param topK - Number of results to return (default: 10)
 * @param embeddingModel - Which embedding model was used for the query
 * @returns Array of matching products
 */
export async function searchProducts(
  queryEmbedding: number[],
  filters: SearchFilters = {},
  topK: number = 10,
  embeddingModel: EmbeddingModel = 'openai'
): Promise<Product[]> {
  try {
    // Build Pinecone metadata filter
    const pineconeFilter: any = {}

    // Price range filter
    // User wants products with price between [minPrice, maxPrice]
    // Product has price range [price_min, price_max]
    // STRICT: Both price_min AND price_max must fall within user's range
    if (filters.priceRange && filters.priceRange.length === 2) {
      const [minPrice, maxPrice] = filters.priceRange

      // Product's minimum price should be at least the user's minimum (or start from 0)
      if (minPrice > 0) {
        pineconeFilter.price_min = { $gte: minPrice }
      }

      // Product's maximum price should not exceed user's maximum budget
      // This ensures we only show products that are FULLY within the budget range
      if (maxPrice < 200000) {
        pineconeFilter.price_max = { $lte: maxPrice }
      }
    }

    // Source filter (StarTech or Daraz)
    if (filters.sources && filters.sources.length > 0) {
      pineconeFilter.source = { $in: filters.sources }
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      pineconeFilter.brand = { $in: filters.brands }
    }

    // Fetch extra results for category filtering (Pinecone doesn't support CONTAINS)
    const fetchCount = filters.categories && filters.categories.length > 0 ? topK * 2 : topK

    // Get the appropriate namespace for the embedding model
    const namespace = getNamespace(embeddingModel)
    console.log(`[Vector Search] Using namespace: ${namespace || 'default'}`)
    console.log(`[Vector Search] Embedding model: ${embeddingModel}`)

    // Query Pinecone with namespace support
    const queryIndex = namespace ? index.namespace(namespace) : index
    const results = await queryIndex.query({
      vector: queryEmbedding,
      topK: fetchCount,
      includeMetadata: true,
      filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
    })

    console.log(`[Vector Search] Raw matches: ${results.matches.length}`)
    if (results.matches.length > 0) {
      console.log(`[Vector Search] Top 3 scores: ${results.matches.slice(0, 3).map(m => m.score?.toFixed(3)).join(', ')}`)
    }

    // Filter out low-relevance results using model-specific threshold
    const threshold = embeddingModel === 'huggingface' ? RELEVANCE_THRESHOLD : OPENAI_RELEVANCE_THRESHOLD
    const relevantMatches = results.matches.filter((match) => (match.score || 0) >= threshold)
    console.log(`[Vector Search] Relevant matches (>= ${threshold}): ${relevantMatches.length}`)

    // Convert Pinecone results to Product objects
    let products: Product[] = relevantMatches.map((match) => {
      const meta = match.metadata as any

      return {
        id: match.id,
        name: meta.name || '',
        price_min: meta.price_min || 0,
        price_max: meta.price_max || 0,
        brand: meta.brand || '',
        category: meta.category || '',
        source: (meta.source as 'StarTech' | 'Daraz') || 'StarTech',
        url: meta.url || '',
        image: meta.image || '',
        specs: {
          processor: meta.processor || undefined,
          ram: meta.ram || undefined,
          storage: meta.storage || undefined,
          graphics: meta.graphics || undefined,
        },
        warranty: meta.warranty || '',
        availability: meta.availability || undefined,
        rating: meta.rating || undefined,
        reviews_count: meta.reviews_count || undefined,
      }
    })

    // Post-filter by category (partial match)
    // Pinecone doesn't support CONTAINS, so we filter client-side
    if (filters.categories && filters.categories.length > 0) {
      products = products.filter((p) =>
        filters.categories!.some((cat) => p.category.toLowerCase().includes(cat.toLowerCase()))
      )
    }

    // STRICT client-side price filter (double-check after Pinecone filtering)
    // Ensure BOTH price_min AND price_max are within the user's range
    if (filters.priceRange && filters.priceRange.length === 2) {
      const [minPrice, maxPrice] = filters.priceRange
      const beforeCount = products.length

      products = products.filter((p) => {
        const withinRange = p.price_min >= minPrice && p.price_max <= maxPrice
        if (!withinRange) {
          console.log(`[Vector Search] Filtered out: ${p.name} (${p.price_min}-${p.price_max}৳ outside ${minPrice}-${maxPrice}৳)`)
        }
        return withinRange
      })

      console.log(`[Vector Search] Strict price filter: ${beforeCount} → ${products.length} products`)
    }

    // Sort products by price (cheapest first) when user has a price constraint
    if (filters.priceRange && filters.priceRange[1] < 200000) {
      products.sort((a, b) => a.price_min - b.price_min)
      console.log(`[Vector Search] Sorted by price (cheapest first)`)
    }

    // Return top K results after filtering
    return products.slice(0, topK)
  } catch (error: any) {
    console.error('Error searching products:', error)
    throw new Error(`Vector search failed: ${error.message}`)
  }
}

/**
 * Get product by ID
 *
 * @param productId - Product ID
 * @returns Product or null if not found
 */
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const result = await index.fetch([productId])

    if (!result.records || !result.records[productId]) {
      return null
    }

    const record = result.records[productId]
    const meta = record.metadata as any

    return {
      id: productId,
      name: meta.name || '',
      price_min: meta.price_min || 0,
      price_max: meta.price_max || 0,
      brand: meta.brand || '',
      category: meta.category || '',
      source: (meta.source as 'StarTech' | 'Daraz') || 'StarTech',
      url: meta.url || '',
      image: meta.image || '',
      specs: {
        processor: meta.processor || undefined,
        ram: meta.ram || undefined,
        storage: meta.storage || undefined,
        graphics: meta.graphics || undefined,
      },
      warranty: meta.warranty || '',
    }
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return null
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
  try {
    const stats = await index.describeIndexStats()
    return {
      totalVectors: stats.totalRecordCount || 0,
      dimension: 384,
      indexName: indexName,
    }
  } catch (error: any) {
    console.error('Error getting index stats:', error)
    throw new Error(`Failed to get index stats: ${error.message}`)
  }
}
