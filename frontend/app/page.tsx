'use client'

import { useState, useEffect, useRef } from 'react'
import { Message } from '@/lib/types'
import { ChatMessage } from '@/components/chat-message'
import { TypingIndicator } from '@/components/typing-indicator'
import { SuggestedQuestions } from '@/components/suggested-questions'
import { Sidebar, FilterState } from '@/components/sidebar'
import {
  createConversation,
  getConversation,
  saveConversation,
  getCurrentConversationId,
  setCurrentConversationId,
  type Conversation,
} from '@/lib/conversation-storage'

const WELCOME_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: "Hi! 👋 I'm your AI product assistant for StarTech and Daraz. I can help you compare products, find the best deals, and answer questions about specs and pricing.\n\nWhat are you looking for today?",
  timestamp: new Date(),
}

export default function Home() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [provider, setProvider] = useState<'openai' | 'gemini'>('gemini')
  const [embeddingModel, setEmbeddingModel] = useState<'openai' | 'huggingface'>('openai')
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200000],
    categories: [],
    brands: [],
    source: [],
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Toggle dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Load or create conversation on mount
  useEffect(() => {
    const currentId = getCurrentConversationId()

    if (currentId) {
      // Load existing conversation
      const conversation = getConversation(currentId)
      if (conversation && conversation.messages.length > 0) {
        setConversationId(currentId)
        setMessages(conversation.messages)
      } else {
        // Create new if not found
        const newConversation = createConversation()
        newConversation.messages = [WELCOME_MESSAGE]
        saveConversation(newConversation)
        setConversationId(newConversation.id)
      }
    } else {
      // Create new conversation
      const newConversation = createConversation()
      newConversation.messages = [WELCOME_MESSAGE]
      saveConversation(newConversation)
      setConversationId(newConversation.id)
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const conversation = getConversation(conversationId)
      if (conversation) {
        conversation.messages = messages
        saveConversation(conversation)
      }
    }
  }, [messages, conversationId])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async (queryText?: string) => {
    const messageText = queryText || input
    if (!messageText.trim() || isTyping) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Call real API
    setIsTyping(true)
    try {
      // Get conversation history (exclude welcome message and current user message)
      // Increased to 20 messages to support longer conversations and follow-up questions
      const conversationHistory = messages
        .filter(m => m.id !== '1') // Exclude welcome message
        .slice(-20) // Last 20 messages for context (10 exchanges)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          provider: provider,
          embeddingModel: embeddingModel,
          filters: filters,
          conversationHistory: conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message.content,
        products: data.message.products || [],
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please make sure all API keys are configured in .env.local and try again.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    console.log('Filters updated:', newFilters)
    // In production, this would trigger a new query with filters
  }

  const handleNewChat = () => {
    // Create a new conversation
    const newConversation = createConversation()
    newConversation.messages = [WELCOME_MESSAGE]
    saveConversation(newConversation)
    setConversationId(newConversation.id)
    setMessages([WELCOME_MESSAGE])
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0`}
      >
        <Sidebar
          onFilterChange={handleFilterChange}
          provider={provider}
          onProviderChange={setProvider}
          embeddingModel={embeddingModel}
          onEmbeddingModelChange={setEmbeddingModel}
        />
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  ConCommerce AI Assistant
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  10,800+ Products • StarTech & Daraz
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                aria-label="New chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto messages-scroll px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shadow-lg flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Suggested Questions */}
            <SuggestedQuestions onSelect={handleSend} disabled={isTyping} />

            {/* Input Field */}
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about products, prices, comparisons..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-full font-medium hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
              >
                {isTyping ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
