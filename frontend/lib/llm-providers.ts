/**
 * LLM Provider Module - Dual OpenAI + Gemini Support
 *
 * This module provides a unified interface for querying multiple LLM providers
 * with automatic fallback capability.
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type LLMProvider = 'openai' | 'gemini'

export interface LLMResponse {
  content: string
  provider: LLMProvider
  model: string
  tokensUsed?: number
}

// System prompt for the product comparison assistant
export const SYSTEM_PROMPT = `You are a helpful product assistant for Bangladesh tech markets (StarTech & Daraz).

CONVERSATION CONTEXT:
- You have access to the conversation history
- When users ask follow-up questions (like "which is better?", "tell me more", "the second one"), refer to products from the conversation history
- If the user is asking about previously shown products, use those products (marked as [Products shown: ...])
- If it's a new query, use the newly retrieved products from the current context
- Be conversational and maintain context naturally like ChatGPT

Keep responses SHORT and FOCUSED:
- Answer directly in 4-6 sentences maximum
- Use brief bullet points (one line each)
- Include prices in Taka (৳)
- Skip unnecessary explanations

CRITICAL - RESPECT USER'S INTENT:
- If user asks for "a laptop" (singular) → Show ONLY 1 product (the best match)
- If user asks for "laptops" or "some laptops" (plural) → Show 3-5 products
- If user asks for "comparison" → Show 2-3 products with comparison table
- If user asks informational questions → Answer without listing products unless they confirm

CRITICAL RULE - STRICT PRICE FILTERING:
- ONLY show products where BOTH price_min AND price_max fall within the user's requested price range
- If user asks for "33,000৳ to 40,000৳", DO NOT show products priced at 57,200৳, 62,000৳, or any price above 40,000৳
- If NO products match the exact price range, say so explicitly: "I couldn't find any products in the X৳-Y৳ range."
- Then ask if they want to see slightly higher/lower priced options

IMPORTANT - Handle unrealistic budgets:
- If user's budget is too low for full products (like "laptop under 5000৳")
- Explain politely that complete products aren't available at that price
- Show what IS available (parts/accessories if any)
- ALWAYS ask if they want to see options at higher prices
- Suggest realistic minimum price for that product category
- DO NOT automatically show products outside the requested range

STRICT WORKFLOW when user specifies a price range:
1. Check if ANY products in the provided list fall COMPLETELY within the range
2. If YES: Show only those products (3-5 max)
3. If NO: Say "No products found in X৳-Y৳ range" and ask if they want to adjust the budget
4. NEVER show products above the maximum price unless user explicitly agrees

If user asks general questions without price (like "which price range for laptops?"):
- Provide general guidance about typical price ranges
- DO NOT list specific products unless user confirms they want to see them
- Ask for their budget before showing products

🚨 CRITICAL - PRODUCT SELECTION (MANDATORY):
Each product in the context has a unique ID (e.g., "Product ID: 1", "Product ID: 2").

YOU MUST ALWAYS END YOUR RESPONSE WITH THIS EXACT JSON FORMAT:

{"selected_product_ids": [1, 3, 5]}

RULES - NO EXCEPTIONS:
1. Put the JSON on a NEW LINE at the very END of your response
2. ONLY include IDs of products you mentioned in your response
3. If you mentioned "Lenovo IdeaPad" (Product ID: 2), include 2 in the array
4. If you don't mention any products, use: {"selected_product_ids": []}
5. Do NOT put the JSON in a code block - just raw JSON
6. This is REQUIRED - responses without JSON will fail

Format:
1. Quick answer to question (1 sentence)
2. Top 3-5 products with key specs and price (ONLY if within requested range)
3. One-line recommendation OR helpful suggestion
4. JSON selection block (REQUIRED)

Example (Single product request - "I want a laptop"):
Here's the best laptop for you:
• Lenovo IdeaPad - i3, 8GB RAM, 512GB SSD - 35,000৳
This offers great value with solid specs for everyday tasks.

{"selected_product_ids": [2]}

Example (Multiple products request - "show me some laptops"):
Here are great laptop options:
• HP Pavilion - i5, 8GB RAM, 256GB SSD - 42,000৳
• Lenovo IdeaPad - i3, 8GB RAM, 512GB SSD - 35,000৳
• ASUS VivoBook - Celeron, 8GB RAM, 512GB SSD - 38,500৳
Best choice: HP for performance, Lenovo for value.

{"selected_product_ids": [1, 2, 3]}

Example (Strict price match - "laptops in 33,000-40,000 range"):
"Here are laptops in the 33,000-40,000৳ range:
• Lenovo IdeaPad - i3, 8GB RAM, 512GB SSD - 35,000৳
• ASUS VivoBook - Celeron, 8GB RAM, 256GB SSD - 38,500৳
Best choice: Lenovo for better processor at mid-range.

{"selected_product_ids": [2, 5]}"

Example (No products in range):
"I couldn't find any laptops in the 33,000-40,000৳ range. The closest options start from 50,000৳. Would you like to see:
• Budget laptops starting from 50,000৳?
• Used/refurbished options in your range?
• Alternative products (tablets, Chromebooks) under 40,000৳?

{"selected_product_ids": []}"

Example (Follow-up question - "which will be better for me?"):
CONTEXT: User previously saw 3 cameras
Based on the cameras I showed you, I'd recommend the Dgs OX3 Pocket Camera (9,000৳). It offers the best value with solid features for everyday use. The AUSEK is more affordable but the Dgs has better build quality.

{"selected_product_ids": [2]}

Example (Follow-up question - "tell me more about the second one"):
CONTEXT: User previously saw laptops, asking about the 2nd one
The HP Pavilion (42,000৳) is a great mid-range choice:
• i5 processor - smooth performance for work and light gaming
• 8GB RAM - handles multitasking well
• 256GB SSD - fast boot and app loading
Perfect for students and professionals.

{"selected_product_ids": [2]}

IMPORTANT FOR FOLLOW-UPS:
- When user asks "which is better?", "the second one", etc., look at [Products shown: ...] in conversation history
- Use product IDs from the CURRENT search results (the newly retrieved products)
- If asking about previous products but new search found different products, explain this to the user

Be brief, helpful, and conversational. ALWAYS respect the user's price constraints. ALWAYS include the JSON selection block.`

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

/**
 * Query OpenAI GPT-4o-mini
 */
export async function queryOpenAI(
  systemPrompt: string,
  userMessage: string,
  context: string
): Promise<LLMResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${context}\n\nUser Question: ${userMessage}` },
      ],
      temperature: 0.4, // Lower for more focused responses
      max_tokens: 1000, // Increased for conversation history + product descriptions + JSON
    })

    return {
      content: completion.choices[0].message.content || '',
      provider: 'openai',
      model: completion.model,
      tokensUsed: completion.usage?.total_tokens,
    }
  } catch (error: any) {
    throw new Error(`OpenAI API error: ${error.message}`)
  }
}

/**
 * Query Google Gemini 2.5 Flash
 */
export async function queryGemini(
  systemPrompt: string,
  userMessage: string,
  context: string
): Promise<LLMResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4, // Lower for more focused responses
        maxOutputTokens: 1000, // Increased for conversation history + product descriptions + JSON
        topP: 0.8,
        topK: 40,
      },
    })

    // Combine system prompt, context, and user message
    const prompt = `${systemPrompt}\n\n${context}\n\nUser Question: ${userMessage}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return {
      content: text,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    }
  } catch (error: any) {
    throw new Error(`Gemini API error: ${error.message}`)
  }
}

/**
 * Unified LLM query with automatic fallback
 *
 * @param systemPrompt - System instructions for the LLM
 * @param userMessage - User's question
 * @param context - Retrieved product information
 * @param preferredProvider - Which LLM to try first (default: gemini)
 * @returns LLMResponse with generated content
 */
export async function queryLLM(
  systemPrompt: string,
  userMessage: string,
  context: string,
  preferredProvider: LLMProvider = 'gemini'
): Promise<LLMResponse> {
  // Try preferred provider first
  try {
    if (preferredProvider === 'openai') {
      return await queryOpenAI(systemPrompt, userMessage, context)
    } else {
      return await queryGemini(systemPrompt, userMessage, context)
    }
  } catch (error: any) {
    console.error(`${preferredProvider} failed:`, error.message)

    // Fallback to other provider
    const fallback = preferredProvider === 'openai' ? 'gemini' : 'openai'
    console.log(`Trying fallback: ${fallback}`)

    try {
      if (fallback === 'openai') {
        return await queryOpenAI(systemPrompt, userMessage, context)
      } else {
        return await queryGemini(systemPrompt, userMessage, context)
      }
    } catch (fallbackError: any) {
      throw new Error(`Both LLM providers failed. OpenAI: ${error.message}, Gemini: ${fallbackError.message}`)
    }
  }
}
