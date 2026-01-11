"""
CSV Preprocessing Script for ConCommerce RAG Pipeline
======================================================
This script transforms the raw products_merged.csv into clean, structured JSON
suitable for embedding generation and vector database storage.

Key Operations:
1. Parse price strings (e.g., "24,499৳28,100৳" → {min: 24499, max: 28100})
2. Extract JSON fields (key_features, specifications, additional_images)
3. Parse key specs (processor, RAM, GPU, storage) from specifications
4. Build searchable content for embeddings
5. Generate unique IDs from SKU

Output: data/processed/products_clean.json
"""

import pandas as pd
import json
import re
from pathlib import Path

def parse_price(price_str):
    """
    Extract min and max prices from price string.

    Examples:
        "24,499৳28,100৳" → (24499, 28100)
        "93,900৳" → (93900, 93900)
        "50,000" → (50000, 50000)

    Returns:
        tuple: (price_min, price_max) or (None, None) if parsing fails
    """
    if pd.isna(price_str):
        return None, None

    # Extract all numbers (remove commas)
    prices = re.findall(r'[\d,]+', str(price_str))
    prices = [int(p.replace(',', '')) for p in prices if p.replace(',', '').isdigit()]

    if len(prices) == 0:
        return None, None
    elif len(prices) == 1:
        return prices[0], prices[0]
    else:
        return min(prices), max(prices)


def safe_json_parse(json_str, default=None):
    """Safely parse JSON string, return default if parsing fails."""
    if pd.isna(json_str):
        return default
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default


def extract_key_specs(row):
    """
    Extract processor, RAM, GPU, and storage from specifications JSON.

    Args:
        row: DataFrame row with 'specifications' column

    Returns:
        dict: {'processor': str, 'ram': str, 'gpu': str, 'storage': str}
    """
    specs = {}
    spec_dict = safe_json_parse(row['specifications'], {})

    if not spec_dict:
        return {'processor': None, 'ram': None, 'gpu': None, 'storage': None}

    # Extract Processor (first line only to avoid warranty text)
    if 'Processor' in spec_dict:
        processor_text = spec_dict['Processor']
        specs['processor'] = processor_text.split('\n')[0] if processor_text else None
    else:
        specs['processor'] = None

    # Extract RAM (look for patterns like "16GB DDR5")
    ram_value = None
    for key in ['RAM', 'Memory', 'Ram']:
        if key in spec_dict:
            ram_text = spec_dict[key]
            if ram_text:
                # Extract size pattern (e.g., "16GB DDR5" from full text)
                ram_match = re.search(r'(\d+GB\s*(?:DDR\d+)?)', ram_text, re.IGNORECASE)
                if ram_match:
                    ram_value = ram_match.group(1)
                    break
    specs['ram'] = ram_value

    # Extract GPU/Graphics Card
    gpu_value = None
    for key in ['Graphics Card', 'Graphics', 'GPU', 'Display']:
        if key in spec_dict:
            gpu_text = spec_dict[key]
            if gpu_text:
                # First line only, avoid warranty text
                gpu_value = gpu_text.split('\n')[0]
                break
    specs['gpu'] = gpu_value

    # Extract Storage (look for GB/TB patterns)
    storage_value = None
    for key in ['Storage', 'SSD', 'Hard Drive', 'HDD']:
        if key in spec_dict:
            storage_text = spec_dict[key]
            if storage_text:
                # Extract storage size (e.g., "512GB NVMe SSD")
                storage_match = re.search(r'(\d+(?:GB|TB)\s*(?:NVMe|SSD|HDD)?)', storage_text, re.IGNORECASE)
                if storage_match:
                    storage_value = storage_match.group(1)
                    break
    specs['storage'] = storage_value

    return specs


def build_searchable_content(row, specs):
    """
    Build rich text content for embedding generation.
    Combines all relevant product information into a single searchable text.

    Args:
        row: DataFrame row with product data
        specs: dict with extracted specs

    Returns:
        str: Comprehensive searchable content
    """
    parts = []

    # Product name (most important)
    if pd.notna(row.get('name')):
        parts.append(f"Product: {row['name']}")

    # Category
    if pd.notna(row.get('category')):
        parts.append(f"Category: {row['category']}")

    # Brand
    if pd.notna(row.get('brand')):
        parts.append(f"Brand: {row['brand']}")

    # Source (StarTech or Daraz)
    if pd.notna(row.get('source')):
        parts.append(f"Source: {row['source']}")

    # Price
    price_min = row.get('price_min')
    price_max = row.get('price_max')
    if price_min and price_max:
        if price_min == price_max:
            parts.append(f"Price: {price_min:,} Taka")
        else:
            parts.append(f"Price Range: {price_min:,} to {price_max:,} Taka")

    # Description (first 500 characters to avoid token bloat)
    if pd.notna(row.get('description')):
        desc = str(row['description'])[:500]
        parts.append(f"Description: {desc}")

    # Key Features
    key_features = safe_json_parse(row.get('key_features'), [])
    if key_features and isinstance(key_features, list):
        features_text = ' | '.join(key_features[:5])  # First 5 features
        parts.append(f"Key Features: {features_text}")

    # Extracted Specs
    if specs.get('processor'):
        parts.append(f"Processor: {specs['processor']}")

    if specs.get('ram'):
        parts.append(f"RAM: {specs['ram']}")

    if specs.get('gpu'):
        parts.append(f"Graphics: {specs['gpu']}")

    if specs.get('storage'):
        parts.append(f"Storage: {specs['storage']}")

    # Warranty
    if pd.notna(row.get('warranty_info')):
        warranty = str(row['warranty_info'])[:200]  # Limit warranty text
        parts.append(f"Warranty: {warranty}")

    return "\n".join(parts)


def main():
    """Main preprocessing pipeline."""
    print("=" * 60)
    print("ConCommerce CSV Preprocessing")
    print("=" * 60)

    # Paths
    input_path = Path(__file__).parent.parent / 'data' / 'products_merged.csv'
    output_path = Path(__file__).parent.parent / 'data' / 'processed' / 'products_clean.json'

    print(f"\n📂 Reading CSV from: {input_path}")

    # Read CSV
    try:
        df = pd.read_csv(input_path)
        print(f"OK Loaded {len(df):,} products")
    except FileNotFoundError:
        print(f"ERROR Error: File not found at {input_path}")
        return
    except Exception as e:
        print(f"ERROR Error reading CSV: {e}")
        return

    print("\n🔄 Processing products...")

    # Parse prices
    print("   - Parsing prices...")
    df[['price_min', 'price_max']] = df['price'].apply(
        lambda x: pd.Series(parse_price(x))
    )

    # Extract specs
    print("   - Extracting specifications...")
    df['extracted_specs'] = df.apply(extract_key_specs, axis=1)

    # Build searchable content
    print("   - Building searchable content...")
    df['search_content'] = df.apply(
        lambda row: build_searchable_content(row, row['extracted_specs']),
        axis=1
    )

    # Convert to list of dictionaries
    print("\n📦 Creating output JSON...")
    products = []
    skipped = 0

    for idx, row in df.iterrows():
        specs = row['extracted_specs']

        # Generate unique ID from SKU or index
        product_id = f"prod_{row['sku']}" if pd.notna(row.get('sku')) else f"prod_{idx}"

        # Skip products without name or price
        if pd.isna(row.get('name')) or (row['price_min'] is None):
            skipped += 1
            continue

        product = {
            'id': product_id,
            'name': str(row['name']),
            'price_min': int(row['price_min']) if pd.notna(row['price_min']) else None,
            'price_max': int(row['price_max']) if pd.notna(row['price_max']) else None,
            'category': str(row['category']) if pd.notna(row.get('category')) else '',
            'brand': str(row['brand']) if pd.notna(row.get('brand')) else '',
            'source': str(row['source']) if pd.notna(row.get('source')) else '',
            'url': str(row['url']) if pd.notna(row.get('url')) else '',
            'image': str(row['image']) if pd.notna(row.get('image')) else '',
            'specs': {
                'processor': specs.get('processor'),
                'ram': specs.get('ram'),
                'storage': specs.get('storage'),
                'graphics': specs.get('gpu'),
            },
            'warranty': str(row['warranty_info'])[:200] if pd.notna(row.get('warranty_info')) else '',
            'search_content': row['search_content'],
        }

        products.append(product)

    print(f"OK Processed {len(products):,} products")
    if skipped > 0:
        print(f"WARNING  Skipped {skipped} products (missing name or price)")

    # Save to JSON
    print(f"\n💾 Saving to: {output_path}")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    # Calculate file size
    file_size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"OK Saved {len(products):,} products ({file_size_mb:.2f} MB)")

    # Show sample product
    if products:
        print("\n📝 Sample product (first entry):")
        sample = products[0]
        print(f"   ID: {sample['id']}")
        print(f"   Name: {sample['name']}")
        print(f"   Price: {sample['price_min']:,}৳ - {sample['price_max']:,}৳")
        print(f"   Category: {sample['category']}")
        print(f"   Source: {sample['source']}")
        if sample['specs']['processor']:
            print(f"   Processor: {sample['specs']['processor']}")
        if sample['specs']['ram']:
            print(f"   RAM: {sample['specs']['ram']}")
        print(f"   Search content length: {len(sample['search_content'])} chars")

    print("\n" + "=" * 60)
    print("OK Preprocessing complete!")
    print("=" * 60)
    print(f"\nNext step: Run 2_generate_embeddings.py")


if __name__ == '__main__':
    main()
