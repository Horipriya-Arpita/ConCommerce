/**
 * Chat API Route - Main RAG Pipeline Endpoint
 *
 * This endpoint orchestrates the entire RAG (Retrieval-Augmented Generation) pipeline:
 * 1. Generate query embedding
 * 2. Search Pinecone for relevant products
 * 3. Build context from retrieved products
 * 4. Query LLM with context (including conversation history)
 * 5. Return formatted response
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { searchProducts } from '@/lib/vector-search'
import { queryLLM, SYSTEM_PROMPT, type LLMProvider } from '@/lib/llm-providers'
import { Product, type EmbeddingModel, type Message } from '@/lib/types'
import { parseQuery, mergeFilters } from '@/lib/query-parser'

// Use Node.js runtime for full library support (not Edge)
export const runtime = 'nodejs'

// Enable CORS for development
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers })
}

/**
 * Build context string from retrieved products with IDs for LLM selection
 */
function buildContext(products: Product[]): string {
  if (products.length === 0) {
    return 'No products found matching the query.'
  }

  const lines = ['Here are the most relevant products from our database:\n']

  products.forEach((p, i) => {
    lines.push(`\n--- Product ID: ${i + 1} ---`)
    lines.push(`Name: ${p.name}`)

    // Format price
    if (p.price_min === p.price_max) {
      lines.push(`Price: ${p.price_min.toLocaleString()}৳`)
    } else {
      lines.push(`Price: ${p.price_min.toLocaleString()}৳ - ${p.price_max.toLocaleString()}৳`)
    }

    lines.push(`Category: ${p.category}`)
    lines.push(`Brand: ${p.brand}`)
    lines.push(`Source: ${p.source}`)

    // Add specs if available
    if (p.specs.processor) lines.push(`Processor: ${p.specs.processor}`)
    if (p.specs.ram) lines.push(`RAM: ${p.specs.ram}`)
    if (p.specs.storage) lines.push(`Storage: ${p.specs.storage}`)
    if (p.specs.graphics) lines.push(`Graphics: ${p.specs.graphics}`)

    if (p.warranty) lines.push(`Warranty: ${p.warranty}`)
    if (p.availability) lines.push(`Availability: ${p.availability}`)

    lines.push(`URL: ${p.url}`)
  })

  return lines.join('\n')
}

/**
 * Main POST handler - RAG pipeline
 */
/**
 * Format conversation history for LLM context (ChatGPT-style)
 * Includes full conversation history so LLM can naturally understand context
 */
function formatConversationHistory(history: Message[]): string {
  if (!history || history.length === 0) return ''

  // Keep last 8 messages for context (4 exchanges) - balance between context and tokens
  const recentHistory = history.slice(-8)

  const contextLines: string[] = []

  recentHistory.forEach(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant'

    // Include the message content
    contextLines.push(`${role}: ${msg.content}`)

    // If assistant message had products, include them as context
    if (msg.role === 'assistant' && msg.products && msg.products.length > 0) {
      const productNames = msg.products.map((p, i) => `${i + 1}. ${p.name}`).join(', ')
      contextLines.push(`[Products shown: ${productNames}]`)
    }
  })

  return '\n\n=== Conversation History ===\n' + contextLines.join('\n') + '\n=== End History ===\n'
}

/**
 * Check if message is a casual greeting or conversation (not a product query)
 */
function isCasualMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim()

  // Product-related keywords that indicate a real query
  const productKeywords = [
    'laptop', 'desktop', 'pc', 'computer', 'phone', 'mobile', 'tablet',
    'monitor', 'keyboard', 'mouse', 'headphone', 'camera', 'printer',
    'show me', 'find', 'search', 'looking for', 'need', 'want', 'buy',
    'price', 'taka', '৳', 'budget', 'under', 'above', 'between',
    'gaming', 'office', 'work', 'student', 'professional',
    'i5', 'i7', 'ryzen', 'ram', 'ssd', 'hdd', 'gb', 'tb'
  ]

  // If message contains product keywords, it's NOT casual
  if (productKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return false
  }

  // Greetings - only if they're standalone or with punctuation
  const greetings = ['hi', 'hello', 'hey', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening']

  // Check if message is ONLY a greeting (nothing else)
  if (greetings.some(g => lowerMessage === g || lowerMessage === g + '!' || lowerMessage === g + '?')) {
    return true
  }

  // Specific casual phrases that should trigger casual response
  const casualPhrases = ['how are you', 'whats up', "what's up", 'how r u', 'sup']
  if (casualPhrases.some(phrase => lowerMessage === phrase || lowerMessage === phrase + '?')) {
    return true
  }

  // Thank you messages (only if standalone)
  if (lowerMessage === 'thanks' || lowerMessage === 'thank you' ||
      lowerMessage === 'thanks!' || lowerMessage === 'thank you!') {
    return true
  }

  // Goodbye messages
  if (lowerMessage === 'bye' || lowerMessage === 'goodbye' ||
      lowerMessage === 'bye!' || lowerMessage === 'goodbye!') {
    return true
  }

  return false
}

/**
 * Smart detection: Should we search for new products or use conversation history?
 * Returns true if query is vague/contextual (use history), false if specific (search)
 */
function shouldUseConversationHistory(message: string, conversationHistory: Message[]): boolean {
  if (conversationHistory.length === 0) return false

  const lowerMessage = message.toLowerCase().trim()
  const words = lowerMessage.split(/\s+/)

  // Very short queries (1-5 words) without product keywords → likely contextual
  if (words.length <= 5) {
    const productKeywords = [
      'laptop', 'desktop', 'pc', 'computer', 'camera', 'phone', 'monitor',
      'keyboard', 'mouse', 'headphone', 'speaker', 'tablet', 'processor',
      'ram', 'ssd', 'graphics', 'display'
    ]

    const hasProductKeyword = productKeywords.some(k => lowerMessage.includes(k))
    const hasContextTrigger = [
      'which', 'what', 'better', 'best', 'recommend', 'choose',
      'first', 'second', 'third', 'that', 'this', 'them', 'it'
    ].some(t => lowerMessage.includes(t))

    // Short + contextual trigger + no product keyword = use history
    if (hasContextTrigger && !hasProductKeyword) {
      console.log('[Smart Search] 🔄 Using conversation history (vague contextual query)')
      return true
    }
  }

  // Explicit follow-up phrases
  const followUpPhrases = [
    'which is better', 'which will be better', 'which one',
    'tell me more', 'more details', 'more about',
    'compare them', 'compare these', 'difference between',
    'your recommendation', 'what do you think',
    'the first one', 'the second one', 'the third one'
  ]

  if (followUpPhrases.some(phrase => lowerMessage.includes(phrase))) {
    console.log('[Smart Search] 🔄 Using conversation history (explicit follow-up phrase)')
    return true
  }

  console.log('[Smart Search] 🔍 Performing new search (specific query)')
  return false
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const { message, provider = 'gemini', embeddingModel = 'openai', filters, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400, headers })
    }

    console.log('[Chat API] Received query:', message)
    console.log('[Chat API] Provider:', provider)
    console.log('[Chat API] Embedding Model:', embeddingModel)
    console.log('[Chat API] Filters:', filters)
    console.log('[Chat API] Conversation history length:', conversationHistory.length)

    // Handle casual messages without product search
    if (isCasualMessage(message)) {
      console.log('[Chat API] Detected casual message, responding without product search')

      const casualResponses = [
        "Hello! I'm here to help you find the best tech products from StarTech and Daraz. What are you looking for today?",
        "Hi there! Looking for laptops, desktops, or any specific tech products? I can help you compare prices and specs.",
        "Hey! Ready to help you find great deals on tech products. What would you like to search for?",
      ]

      const responseContent = message.toLowerCase().includes('thank')
        ? "You're welcome! Let me know if you need help finding any other products."
        : casualResponses[Math.floor(Math.random() * casualResponses.length)]

      return NextResponse.json({
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          products: [],
          timestamp: new Date(),
        },
        metadata: {
          provider: 'system',
          model: 'casual-response',
          productsFound: 0,
        },
      }, { headers })
    }

    // Smart decision: Use conversation history or search for new products?
    if (shouldUseConversationHistory(message, conversationHistory)) {
      // Get products from last assistant message
      const lastAssistantMessage = [...conversationHistory]
        .reverse()
        .find(m => m.role === 'assistant' && m.products && m.products.length > 0)

      const previousProducts = lastAssistantMessage?.products || []

      if (previousProducts.length > 0) {
        console.log(`[Chat API] Using ${previousProducts.length} products from conversation history`)

        // Build context with previous products
        const productContext = buildContext(previousProducts)
        const conversationContext = formatConversationHistory(conversationHistory)
        const fullContext = productContext + conversationContext

        // Add intent hint for LLM
        const intentHint = `\n\nUser Intent: The user is asking a follow-up question about products shown earlier. Answer based on the products above.\n`

        // Query LLM with previous products
        try {
          const llmResponse = await queryLLM(SYSTEM_PROMPT, message, fullContext + intentHint, provider as LLMProvider)

          // Parse product selection
          let selectedProductIds: number[] = []
          let cleanedContent = llmResponse.content

          try {
            let jsonMatch = llmResponse.content.match(/\{[\s\S]*?"selected_product_ids"[\s\S]*?\}/)

            if (!jsonMatch) {
              const codeBlockMatch = llmResponse.content.match(/```json?\s*(\{[\s\S]*?"selected_product_ids"[\s\S]*?\})\s*```/)
              if (codeBlockMatch) jsonMatch = [codeBlockMatch[1]]
            }

            if (jsonMatch) {
              const selectionData = JSON.parse(jsonMatch[0])
              selectedProductIds = selectionData.selected_product_ids || []
              cleanedContent = llmResponse.content
                .replace(/\{[\s\S]*?"selected_product_ids"[\s\S]*?\}/, '')
                .replace(/```json?\s*\{[\s\S]*?"selected_product_ids"[\s\S]*?\}\s*```/, '')
                .trim()
              console.log(`[Chat API] ✅ Follow-up selected product IDs: [${selectedProductIds.join(', ')}]`)
            }
          } catch (error) {
            console.error('[Chat API] ❌ Failed to parse JSON from follow-up:', error)
          }

          // Map selected IDs to products
          const displayProducts = selectedProductIds.length > 0
            ? selectedProductIds.map(id => previousProducts[id - 1]).filter(Boolean)
            : previousProducts

          return NextResponse.json({
            message: {
              id: Date.now().toString(),
              role: 'assistant',
              content: cleanedContent,
              products: displayProducts,
              timestamp: new Date(),
            },
            metadata: {
              provider: llmResponse.provider,
              model: llmResponse.model,
              productsFound: displayProducts.length,
              tokensUsed: llmResponse.tokensUsed,
            },
          }, { headers })
        } catch (error: any) {
          console.error('[Chat API] LLM error on follow-up:', error)
          return NextResponse.json(
            { error: 'Failed to generate response', details: error.message },
            { status: 500, headers }
          )
        }
      }
    }

    // Step 0: Parse query to extract search criteria (price, brands, etc.)
    console.log('[Chat API] Parsing query for search criteria...')
    let parsedQuery
    try {
      parsedQuery = await parseQuery(message)
      console.log('[Chat API] Parsed query:', JSON.stringify(parsedQuery))
      if (parsedQuery.intent) {
        console.log(`[Chat API] User intent: ${parsedQuery.intent.productCount} product(s), action: ${parsedQuery.intent.action}`)
      }
    } catch (error: any) {
      console.error('[Chat API] Query parsing failed:', error.message)
      parsedQuery = {}
    }

    // Merge parsed filters with sidebar filters (query takes priority)
    const mergedFilters = mergeFilters(filters, parsedQuery)
    console.log('[Chat API] Final merged filters:', JSON.stringify(mergedFilters))

    // CRITICAL: Check for unrealistic budget scenarios BEFORE searching
    // If user asks for laptops/desktops but budget is too low, intervene early
    const priceRange = mergedFilters?.priceRange || [0, 200000]
    const [minPrice, maxPrice] = priceRange
    const userQuery = message.toLowerCase()

    // Detect if user is looking for complete systems (not accessories)
    const isLookingForCompleteSystem =
      userQuery.includes('laptop') ||
      userQuery.includes('desktop') ||
      userQuery.includes('pc') ||
      userQuery.includes('computer')

    const isLookingForAccessories =
      userQuery.includes('keyboard') ||
      userQuery.includes('mouse') ||
      userQuery.includes('cable') ||
      userQuery.includes('accessory') ||
      userQuery.includes('part')

    // If user wants a complete system with unrealistic budget, stop BEFORE searching
    if (isLookingForCompleteSystem && !isLookingForAccessories && maxPrice > 0 && maxPrice < 25000) {
      const productType = userQuery.includes('desktop') || userQuery.includes('pc') ? 'desktop' : 'laptop'
      const minRealisticPrice = productType === 'desktop' ? 35000 : 30000

      console.log(`[Chat API] Unrealistic budget detected: ${productType} under ${maxPrice}৳. Stopping early.`)

      let suggestionMessage = `Unfortunately, complete ${productType}s aren't available under ${maxPrice.toLocaleString()}৳. `
      suggestionMessage += `\n\nAt this price point, only accessories and parts (keyboards, displays, mice) are available. `
      suggestionMessage += `\n\nWould you like to see:\n`
      suggestionMessage += `• Budget ${productType}s starting from ${minRealisticPrice.toLocaleString()}৳?\n`
      suggestionMessage += `• Used/refurbished ${productType}s (may have options in higher ranges)?\n`
      suggestionMessage += `• Accessories and parts in your ${maxPrice.toLocaleString()}৳ budget?`

      return NextResponse.json(
        {
          message: {
            id: Date.now().toString(),
            role: 'assistant',
            content: suggestionMessage,
            products: [],
            timestamp: new Date(),
          },
          metadata: {
            provider: 'system',
            model: 'unrealistic-budget',
            productsFound: 0,
          },
        },
        { headers }
      )
    }

    // Step 1: Generate query embedding
    console.log('[Chat API] Generating embedding...')
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateEmbedding(message, embeddingModel as EmbeddingModel)
      console.log(`[Chat API] Embedding generated: ${queryEmbedding.length} dimensions`)
    } catch (error: any) {
      console.error('[Chat API] Embedding error:', error)
      return NextResponse.json(
        { error: 'Failed to generate embedding', details: error.message },
        { status: 500, headers }
      )
    }

    // Step 2: Search Pinecone for relevant products
    console.log('[Chat API] Searching products...')
    let products: Product[]
    try {
      const searchFilters = {
        priceRange: mergedFilters?.priceRange,
        categories: mergedFilters?.categories,
        brands: mergedFilters?.brands,
        sources: mergedFilters?.source,
      }

      products = await searchProducts(queryEmbedding, searchFilters, 8, embeddingModel as EmbeddingModel)
      console.log(`[Chat API] Found ${products.length} products`)
    } catch (error: any) {
      console.error('[Chat API] Search error:', error)
      return NextResponse.json(
        { error: 'Failed to search products', details: error.message },
        { status: 500, headers }
      )
    }

    // Handle no results with helpful suggestions
    if (products.length === 0) {
      let suggestionMessage = "I couldn't find any products matching your exact criteria. "

      // Check if price filter is restrictive
      if (maxPrice < 200000 && maxPrice > 0) {
        suggestionMessage += `\n\nNo products found in the ${minPrice.toLocaleString()}৳ to ${maxPrice.toLocaleString()}৳ range. `

        // Suggest realistic alternatives based on price range
        if (maxPrice < 10000) {
          // Very low budget - probably looking for accessories
          suggestionMessage += `\n\nAt this price point, only accessories and parts are available. Would you like to see:\n`
          suggestionMessage += `• Computer accessories (keyboards, mice, cables)?\n`
          suggestionMessage += `• Budget options starting from ${(maxPrice * 3).toLocaleString()}৳?\n`
          suggestionMessage += `• Used/refurbished products in higher ranges?`
        } else if (maxPrice < 30000) {
          // Low budget - unlikely to find laptops, but might find basic items
          suggestionMessage += `\n\nComplete laptops typically start from 30,000৳. Would you like to see:\n`
          suggestionMessage += `• Budget laptops starting from 30,000-35,000৳?\n`
          suggestionMessage += `• Tablets or Chromebooks in your range?\n`
          suggestionMessage += `• Used/refurbished options?`
        } else {
          // Normal budget - products might be available slightly above
          suggestionMessage += `\n\nWould you like me to:\n`
          suggestionMessage += `• Show products in the ${(maxPrice * 1.2).toLocaleString()}৳ range (20% above budget)?\n`
          suggestionMessage += `• Search for alternative brands or categories?\n`
          suggestionMessage += `• Look for used/refurbished options in your range?`
        }
      } else if (minPrice > 0) {
        suggestionMessage += `\n\nYour minimum price is ${minPrice.toLocaleString()}৳. `
        suggestionMessage += `Would you like me to show lower-priced options as well?`
      } else {
        suggestionMessage += `\n\nTry:\n`
        suggestionMessage += `• Adjusting your filters (price range, brand, category)\n`
        suggestionMessage += `• Rephrasing your question with different keywords\n`
        suggestionMessage += `• Asking about a different product category`
      }

      return NextResponse.json(
        {
          message: {
            id: Date.now().toString(),
            role: 'assistant',
            content: suggestionMessage,
            products: [],
            timestamp: new Date(),
          },
          metadata: {
            provider: 'system',
            model: 'no-results',
            productsFound: 0,
          },
        },
        { headers }
      )
    }

    // Step 3: Build context for LLM
    console.log('[Chat API] Building context...')
    const productContext = buildContext(products)
    const conversationContext = formatConversationHistory(conversationHistory)

    // Add user intent information to help LLM respond appropriately
    let intentContext = ''
    if (parsedQuery.intent) {
      intentContext = `\n\nUser Intent:\n- Product count requested: ${parsedQuery.intent.productCount}\n- Action: ${parsedQuery.intent.action}\n`

      if (parsedQuery.intent.productCount === 'single') {
        intentContext += 'IMPORTANT: User wants only ONE product recommendation. Show only the best match.\n'
      } else if (parsedQuery.intent.productCount === 'multiple') {
        intentContext += 'IMPORTANT: User wants multiple options. Show 3-5 products.\n'
      } else if (parsedQuery.intent.productCount === 'comparison') {
        intentContext += 'IMPORTANT: User wants to compare products. Show 2-3 products with comparison.\n'
      } else if (parsedQuery.intent.productCount === 'any') {
        intentContext += 'IMPORTANT: User is asking for information. Answer their question without showing products unless necessary.\n'
      }
    }

    const fullContext = productContext + intentContext + conversationContext

    // Step 4: Query LLM
    console.log(`[Chat API] Querying LLM (${provider})...`)
    let llmResponse
    try {
      llmResponse = await queryLLM(SYSTEM_PROMPT, message, fullContext, provider as LLMProvider)
      console.log(`[Chat API] LLM response received from ${llmResponse.provider}`)
    } catch (error: any) {
      console.error('[Chat API] LLM error:', error)
      return NextResponse.json(
        { error: 'Failed to generate response', details: error.message },
        { status: 500, headers }
      )
    }

    // Step 5: Parse LLM response to extract selected product IDs
    let selectedProductIds: number[] = []
    let cleanedContent = llmResponse.content

    try {
      // Extract JSON block from LLM response (try multiple formats)
      let jsonMatch = llmResponse.content.match(/\{[\s\S]*?"selected_product_ids"[\s\S]*?\}/)

      // Also try to extract from markdown code blocks
      if (!jsonMatch) {
        const codeBlockMatch = llmResponse.content.match(/```json?\s*(\{[\s\S]*?"selected_product_ids"[\s\S]*?\})\s*```/)
        if (codeBlockMatch) {
          jsonMatch = [codeBlockMatch[1]]
        }
      }

      if (jsonMatch) {
        const selectionData = JSON.parse(jsonMatch[0])
        selectedProductIds = selectionData.selected_product_ids || []

        // Remove JSON block from display content (including code blocks)
        cleanedContent = llmResponse.content
          .replace(/\{[\s\S]*?"selected_product_ids"[\s\S]*?\}/, '')
          .replace(/```json?\s*\{[\s\S]*?"selected_product_ids"[\s\S]*?\}\s*```/, '')
          .trim()

        console.log(`[Chat API] ✅ LLM selected product IDs: [${selectedProductIds.join(', ')}]`)
      } else {
        console.warn('[Chat API] ⚠️ No product selection JSON found in LLM response')
        console.warn('[Chat API] LLM response preview:', llmResponse.content.substring(0, 300))
      }
    } catch (error) {
      console.error('[Chat API] ❌ Failed to parse product selection JSON:', error)
      console.error('[Chat API] Error details:', error)
      // Fall back to intent-based slicing if JSON parsing fails
    }

    // Step 6: Filter products based on LLM selection
    let displayProducts: Product[] = []

    if (selectedProductIds.length > 0) {
      // Use LLM-selected products (IDs are 1-indexed)
      displayProducts = selectedProductIds
        .map(id => products[id - 1])
        .filter(Boolean) // Remove any undefined products

      console.log(`[Chat API] ✅ Showing ${displayProducts.length} LLM-selected products`)
      console.log(`[Chat API] Selected product names:`, displayProducts.map(p => p.name).join(', '))
    } else {
      // Fallback: Use intent-based slicing if LLM didn't select products
      let productSliceCount = 5 // Default
      if (parsedQuery.intent?.productCount === 'single') {
        productSliceCount = 1
      } else if (parsedQuery.intent?.productCount === 'comparison') {
        productSliceCount = 3
      } else if (parsedQuery.intent?.productCount === 'multiple') {
        productSliceCount = 5
      }

      displayProducts = products.slice(0, productSliceCount)
      console.log(`[Chat API] ⚠️ Fallback: Showing ${displayProducts.length} products based on intent (${parsedQuery.intent?.productCount})`)
      console.log(`[Chat API] Fallback product names:`, displayProducts.map(p => p.name).join(', '))
    }

    const response = {
      message: {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: cleanedContent,
        products: displayProducts, // Show only LLM-selected products
        timestamp: new Date(),
      },
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        productsFound: products.length,
        tokensUsed: llmResponse.tokensUsed,
      },
    }

    console.log('[Chat API] Request complete')
    return NextResponse.json(response, { headers })
  } catch (error: any) {
    console.error('[Chat API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500, headers }
    )
  }
}
