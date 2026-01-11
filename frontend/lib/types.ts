export interface Product {
  id: string
  name: string
  price_min: number
  price_max: number
  brand: string
  category: string
  source: 'StarTech' | 'Daraz'
  url: string
  image: string
  specs: {
    processor?: string
    ram?: string
    storage?: string
    graphics?: string
    [key: string]: string | undefined
  }
  warranty: string
  availability?: string
  rating?: number
  reviews_count?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
  timestamp: Date
}

export interface DemoConversation {
  query: string
  response: string
  products?: Product[]
}

export interface FilterState {
  priceRange: [number, number]
  categories: string[]
  brands: string[]
  source: string[]
}

export type EmbeddingModel = 'openai' | 'huggingface'

export interface ChatRequest {
  message: string
  provider?: 'openai' | 'gemini'
  embeddingModel?: EmbeddingModel
  filters?: FilterState
}

export interface ChatResponse {
  message: Message
  metadata?: {
    provider: string
    model: string
    productsFound: number
    tokensUsed?: number
  }
}
