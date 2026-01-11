'use client'

import { Message } from '@/lib/types'
import { ProductCard } from './product-card'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {/* Assistant Avatar - Robot Icon */}
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C11.4477 2 11 2.44772 11 3V4H8C6.89543 4 6 4.89543 6 6V9C6 9.26522 6.10536 9.51957 6.29289 9.70711L7 10.4142V19C7 20.1046 7.89543 21 9 21H15C16.1046 21 17 20.1046 17 19V10.4142L17.7071 9.70711C17.8946 9.51957 18 9.26522 18 9V6C18 4.89543 17.1046 4 16 4H13V3C13 2.44772 12.5523 2 12 2ZM9 7C9 6.44772 9.44772 6 10 6C10.5523 6 11 6.44772 11 7C11 7.55228 10.5523 8 10 8C9.44772 8 9 7.55228 9 7ZM14 6C13.4477 6 13 6.44772 13 7C13 7.55228 13.4477 8 14 8C14.5523 8 15 7.55228 15 7C15 6.44772 14.5523 6 14 6ZM9 12C9 11.4477 9.44772 11 10 11H14C14.5523 11 15 11.4477 15 12C15 12.5523 14.5523 13 14 13H10C9.44772 13 9 12.5523 9 12Z" />
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-3xl ${isUser ? 'order-first' : ''}`}>
        {/* Message Bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white shadow-md'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
        }`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>

        {/* Product Cards */}
        {message.products && message.products.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 px-1">
          {message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>

      {/* User Avatar - Human Icon */}
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
          </svg>
        </div>
      )}
    </div>
  )
}
