/**
 * Query Parser Module
 * Extracts structured search criteria from natural language queries using LLM
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export interface ParsedQuery {
  priceRange?: [number, number]
  brands?: string[]
  categories?: string[]
  sources?: string[]
  specs?: {
    processor?: string
    ram?: string
    storage?: string
    graphics?: string
  }
  intent?: {
    productCount: 'single' | 'multiple' | 'comparison' | 'any'  // How many products user wants
    action: 'find' | 'compare' | 'recommend' | 'info'  // What user wants to do
  }
}

const QUERY_PARSER_PROMPT = `You are a query parser for an e-commerce search system. Extract structured search criteria from user queries.

Extract ONLY what the user explicitly mentions. Return JSON with these optional fields:
{
  "priceRange": [min, max],  // In Bangladeshi Taka (৳). Use 0 for "under X", 200000 for "above X"
  "brands": ["brand1", "brand2"],  // HP, Dell, Lenovo, Asus, Acer, MSI, etc.
  "categories": ["category"],  // gaming laptop, office laptop, desktop, etc.
  "sources": ["StarTech", "Daraz"],  // Only if explicitly mentioned
  "specs": {
    "processor": "...",  // i3, i5, i7, Ryzen 5, etc.
    "ram": "...",  // 8GB, 16GB, etc.
    "storage": "...",  // 256GB SSD, 512GB, 1TB, etc.
    "graphics": "..."  // RTX 3050, GTX 1650, etc.
  },
  "intent": {
    "productCount": "single" | "multiple" | "comparison" | "any",
    "action": "find" | "compare" | "recommend" | "info"
  }
}

Price extraction rules:
- "under 30k" or "below 30000" → [0, 30000]
- "above 50k" or "over 50000" → [50000, 200000]
- "between 30k and 50k" or "30000 to 50000" → [30000, 50000]
- "around 40k" → [35000, 45000]
- "30k" alone (without "under/above") → [25000, 35000] (±5k range)

Intent extraction rules:
- productCount:
  * "single" → "a laptop", "one laptop", "the best laptop", "recommend me a laptop"
  * "multiple" → "laptops", "some laptops", "few laptops", "show me options", "list laptops"
  * "comparison" → "compare", "difference between", "which is better", "vs"
  * "any" → General questions like "which price range", no specific product request

- action:
  * "find" → "find", "search", "show me", "I want", "looking for", "need"
  * "compare" → "compare", "vs", "difference", "which is better"
  * "recommend" → "recommend", "suggest", "best", "good", "which one should I"
  * "info" → "what is", "tell me about", "which price range", "how much"

Examples:
- "I want a laptop" → productCount: "single", action: "find"
- "show me some laptops" → productCount: "multiple", action: "find"
- "recommend the best laptop" → productCount: "single", action: "recommend"
- "compare gaming laptops" → productCount: "comparison", action: "compare"
- "which price range for laptops?" → productCount: "any", action: "info"
- "find laptops under 50k" → productCount: "multiple", action: "find"

If NO price mentioned, omit "priceRange" entirely.
If NO brands mentioned, omit "brands" entirely.
Always return valid JSON only, no explanation.`

/**
 * Parse natural language query into structured search criteria
 */
export async function parseQuery(userQuery: string): Promise<ParsedQuery> {
  try {
    console.log('[Query Parser] Parsing query:', userQuery)

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent parsing
        maxOutputTokens: 300,
        responseMimeType: 'application/json',
      },
    })

    const prompt = `${QUERY_PARSER_PROMPT}\n\nUser query: "${userQuery}"`
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON response
    const parsed: ParsedQuery = JSON.parse(text)

    console.log('[Query Parser] Extracted criteria:', JSON.stringify(parsed))

    // Validate and clean the parsed data
    const cleaned: ParsedQuery = {}

    // Validate price range
    if (parsed.priceRange && Array.isArray(parsed.priceRange)) {
      const [min, max] = parsed.priceRange
      if (typeof min === 'number' && typeof max === 'number' && min >= 0 && max <= 300000) {
        cleaned.priceRange = [min, max]
      }
    }

    // Validate brands
    if (parsed.brands && Array.isArray(parsed.brands) && parsed.brands.length > 0) {
      cleaned.brands = parsed.brands.filter(b => typeof b === 'string' && b.length > 0)
    }

    // Validate categories
    if (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
      cleaned.categories = parsed.categories.filter(c => typeof c === 'string' && c.length > 0)
    }

    // Validate sources
    if (parsed.sources && Array.isArray(parsed.sources) && parsed.sources.length > 0) {
      const validSources = ['StarTech', 'Daraz']
      cleaned.sources = parsed.sources.filter(s => validSources.includes(s))
    }

    // Validate specs
    if (parsed.specs && typeof parsed.specs === 'object') {
      cleaned.specs = {}
      if (parsed.specs.processor) cleaned.specs.processor = String(parsed.specs.processor)
      if (parsed.specs.ram) cleaned.specs.ram = String(parsed.specs.ram)
      if (parsed.specs.storage) cleaned.specs.storage = String(parsed.specs.storage)
      if (parsed.specs.graphics) cleaned.specs.graphics = String(parsed.specs.graphics)
    }

    // Validate intent
    if (parsed.intent && typeof parsed.intent === 'object') {
      const validProductCounts = ['single', 'multiple', 'comparison', 'any']
      const validActions = ['find', 'compare', 'recommend', 'info']

      if (validProductCounts.includes(parsed.intent.productCount) &&
          validActions.includes(parsed.intent.action)) {
        cleaned.intent = parsed.intent
      }
    }

    return cleaned
  } catch (error: any) {
    console.error('[Query Parser] Parsing failed:', error.message)
    // Return empty object on parse failure (will use sidebar filters)
    return {}
  }
}

/**
 * Merge parsed query filters with sidebar filters
 * Query filters take priority over sidebar filters
 */
export function mergeFilters(
  sidebarFilters: any,
  parsedFilters: ParsedQuery
): any {
  const merged = { ...sidebarFilters }

  // Price range: Use query if specified, else sidebar
  if (parsedFilters.priceRange) {
    merged.priceRange = parsedFilters.priceRange
    console.log('[Query Parser] Overriding price with query:', parsedFilters.priceRange)
  }

  // Brands: Combine query + sidebar (OR logic)
  if (parsedFilters.brands && parsedFilters.brands.length > 0) {
    const sidebarBrands = sidebarFilters.brands || []
    merged.brands = [...new Set([...sidebarBrands, ...parsedFilters.brands])]
    console.log('[Query Parser] Combined brands:', merged.brands)
  }

  // Categories: Combine query + sidebar (OR logic)
  if (parsedFilters.categories && parsedFilters.categories.length > 0) {
    const sidebarCategories = sidebarFilters.categories || []
    merged.categories = [...new Set([...sidebarCategories, ...parsedFilters.categories])]
    console.log('[Query Parser] Combined categories:', merged.categories)
  }

  // Sources: Use query if specified, else sidebar
  if (parsedFilters.sources && parsedFilters.sources.length > 0) {
    merged.source = parsedFilters.sources
    console.log('[Query Parser] Overriding sources with query:', parsedFilters.sources)
  }

  return merged
}
