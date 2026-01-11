'use client'

import { useState } from 'react'

interface SidebarProps {
  onFilterChange: (filters: FilterState) => void
  provider: 'openai' | 'gemini'
  onProviderChange: (provider: 'openai' | 'gemini') => void
  embeddingModel: 'openai' | 'huggingface'
  onEmbeddingModelChange: (model: 'openai' | 'huggingface') => void
}

export interface FilterState {
  priceRange: [number, number]
  categories: string[]
  brands: string[]
  source: string[]
}

const categories = ['Desktop', 'Laptop', 'Gaming PC', 'Office PC']
const brands = ['AMD', 'Intel', 'Asus', 'HP', 'MSI']
const sources = ['StarTech', 'Daraz']

export function Sidebar({ onFilterChange, provider, onProviderChange, embeddingModel, onEmbeddingModelChange }: SidebarProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])

  const handlePriceChange = (value: number, index: 0 | 1) => {
    const newRange: [number, number] = [...priceRange] as [number, number]
    newRange[index] = value
    setPriceRange(newRange)
    emitFilters(newRange, selectedCategories, selectedBrands, selectedSources)
  }

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(newCategories)
    emitFilters(priceRange, newCategories, selectedBrands, selectedSources)
  }

  const toggleBrand = (brand: string) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand]
    setSelectedBrands(newBrands)
    emitFilters(priceRange, selectedCategories, newBrands, selectedSources)
  }

  const toggleSource = (source: string) => {
    const newSources = selectedSources.includes(source)
      ? selectedSources.filter(s => s !== source)
      : [...selectedSources, source]
    setSelectedSources(newSources)
    emitFilters(priceRange, selectedCategories, selectedBrands, newSources)
  }

  const emitFilters = (
    price: [number, number],
    cats: string[],
    brds: string[],
    srcs: string[]
  ) => {
    onFilterChange({
      priceRange: price,
      categories: cats,
      brands: brds,
      source: srcs,
    })
  }

  const clearFilters = () => {
    setPriceRange([0, 200000])
    setSelectedCategories([])
    setSelectedBrands([])
    setSelectedSources([])
    onFilterChange({
      priceRange: [0, 200000],
      categories: [],
      brands: [],
      source: [],
    })
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* LLM Provider Selection */}
      <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Model</h3>
        <div className="space-y-2">
          {/* Option 1: Gemini Primary */}
          <button
            onClick={() => onProviderChange('gemini')}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              provider === 'gemini'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Gemini 2.5 Flash</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">FREE • Fast • Fallback: OpenAI</div>
              </div>
              {provider === 'gemini' && (
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              )}
            </div>
          </button>

          {/* Option 2: OpenAI Primary */}
          <button
            onClick={() => onProviderChange('openai')}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              provider === 'openai'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">OpenAI GPT-4o-mini</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Better Quality • Fallback: Gemini</div>
              </div>
              {provider === 'openai' && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Embedding Model Selection */}
      <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Search Engine</h3>
        <div className="space-y-2">
          {/* Option 1: OpenAI Embeddings */}
          <button
            onClick={() => onEmbeddingModelChange('openai')}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              embeddingModel === 'openai'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">OpenAI Embeddings</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Premium • More Accurate</div>
              </div>
              {embeddingModel === 'openai' && (
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              )}
            </div>
          </button>

          {/* Option 2: HuggingFace Embeddings */}
          <button
            onClick={() => onEmbeddingModelChange('huggingface')}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              embeddingModel === 'huggingface'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">HuggingFace MiniLM</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">FREE • Fast</div>
              </div>
              {embeddingModel === 'huggingface' && (
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              )}
            </div>
          </button>
        </div>

        {/* Info message about database compatibility */}
        <div className={`mt-3 p-3 border rounded-lg ${
          embeddingModel === 'openai'
            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
        }`}>
          <div className="flex gap-2">
            <span className={`text-xs ${
              embeddingModel === 'openai'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}>ℹ️</span>
            <p className={`text-xs ${
              embeddingModel === 'openai'
                ? 'text-purple-700 dark:text-purple-300'
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {embeddingModel === 'openai'
                ? 'Searching with OpenAI embeddings (premium, more accurate)'
                : 'Searching with HuggingFace embeddings (free, fast)'}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        <button
          onClick={clearFilters}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Clear All
        </button>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Price Range (৳)</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange(Number(e.target.value), 0)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Min"
            />
            <span className="text-gray-500 dark:text-gray-400">-</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => handlePriceChange(Number(e.target.value), 1)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Max"
            />
          </div>
          <input
            type="range"
            min="0"
            max="200000"
            step="5000"
            value={priceRange[1]}
            onChange={(e) => handlePriceChange(Number(e.target.value), 1)}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {priceRange[0].toLocaleString('en-BD')}৳ - {priceRange[1].toLocaleString('en-BD')}৳
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                {category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Brands</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Source */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Source</h3>
        <div className="space-y-2">
          {sources.map((source) => (
            <label key={source} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedSources.includes(source)}
                onChange={() => toggleSource(source)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                {source}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
