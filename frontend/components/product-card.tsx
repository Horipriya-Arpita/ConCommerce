'use client'

import { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="flex gap-4 p-4">
        {/* Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {product.price_min.toLocaleString('en-BD')}৳
            </span>
            {product.price_max !== product.price_min && (
              <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                {product.price_max.toLocaleString('en-BD')}৳
              </span>
            )}
          </div>

          {/* Specifications */}
          <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-300 mb-2">
            {product.specs.processor && (
              <div className="truncate">
                <span className="font-medium">CPU:</span> {product.specs.processor}
              </div>
            )}
            {product.specs.ram && (
              <div className="truncate">
                <span className="font-medium">RAM:</span> {product.specs.ram}
              </div>
            )}
            {product.specs.graphics && (
              <div className="truncate">
                <span className="font-medium">GPU:</span> {product.specs.graphics}
              </div>
            )}
            {product.specs.storage && (
              <div className="truncate">
                <span className="font-medium">Storage:</span> {product.specs.storage}
              </div>
            )}
          </div>

          {/* Footer: Source and Link */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                product.source === 'StarTech'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
              }`}>
                {product.source}
              </span>
              {product.rating && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ⭐ {product.rating.toFixed(1)}
                </span>
              )}
            </div>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline"
            >
              View Details →
            </a>
          </div>

          {/* Warranty Info */}
          {product.warranty && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              📋 {product.warranty}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
