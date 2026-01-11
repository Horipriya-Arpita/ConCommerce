'use client'

import { suggestedQuestions } from '@/lib/demo-data'

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void
  disabled?: boolean
}

export function SuggestedQuestions({ onSelect, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="mb-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2.5 px-1 font-medium">
        Try asking:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestedQuestions.map((question, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(question)}
            disabled={disabled}
            className="text-xs px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
