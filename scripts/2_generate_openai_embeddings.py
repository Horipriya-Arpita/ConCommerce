"""
OpenAI Embedding Generation Script for ConCommerce RAG Pipeline
================================================================
This script generates 384-dimensional vector embeddings for all products
using OpenAI's text-embedding-3-small model.

Model: text-embedding-3-small
- Dimensions: 384 (native, not truncated)
- Speed: Moderate (~2-5 minutes for 10k products with API)
- Quality: Premium semantic understanding
- Cost: ~$0.02 per 1M tokens (~$0.10 for 10k products)

Input: data/processed/products_clean.json
Output: data/processed/embeddings_openai.npy (numpy array of shape [N, 384])
"""

import json
import numpy as np
import os
from openai import OpenAI
from tqdm import tqdm
from pathlib import Path
import time
from dotenv import load_dotenv

def main():
    """Main OpenAI embedding generation pipeline."""
    # Load environment variables from frontend/.env.local
    env_path = Path(__file__).parent.parent / 'frontend' / '.env.local'
    load_dotenv(env_path)

    print("=" * 60)
    print("ConCommerce OpenAI Embedding Generation")
    print("=" * 60)

    # Check environment variables
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("\n❌ Error: OPENAI_API_KEY environment variable not set!")
        print("\n💡 Set it with:")
        print("   export OPENAI_API_KEY='your-api-key'  # Linux/Mac")
        print("   set OPENAI_API_KEY=your-api-key       # Windows CMD")
        print("   $env:OPENAI_API_KEY='your-api-key'    # Windows PowerShell")
        print("\n   Get your API key from: https://platform.openai.com/api-keys")
        return

    # Paths
    input_path = Path(__file__).parent.parent / 'data' / 'processed' / 'products_clean.json'
    output_path = Path(__file__).parent.parent / 'data' / 'processed' / 'embeddings_openai.npy'
    metadata_path = Path(__file__).parent.parent / 'data' / 'processed' / 'embeddings_openai_meta.json'

    # Check input file exists
    if not input_path.exists():
        print(f"❌ Error: {input_path} not found!")
        print("   Please run 1_preprocess_csv.py first.")
        return

    # Load products
    print(f"\n📂 Loading products from: {input_path}")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        print(f"✅ Loaded {len(products):,} products")
    except Exception as e:
        print(f"❌ Error loading products: {e}")
        return

    # Extract search content
    print("\n📝 Extracting search content...")
    texts = [p['search_content'] for p in products]
    print(f"✅ Extracted {len(texts):,} text entries")

    # Calculate average text length
    avg_length = sum(len(t) for t in texts) / len(texts)
    print(f"   Average text length: {avg_length:.0f} characters")

    # Estimate cost
    total_chars = sum(len(t) for t in texts)
    estimated_tokens = total_chars / 4  # Rough estimate: 1 token ≈ 4 chars
    estimated_cost = (estimated_tokens / 1_000_000) * 0.02  # $0.02 per 1M tokens
    print(f"   Estimated tokens: {estimated_tokens:,.0f}")
    print(f"   Estimated cost: ${estimated_cost:.3f}")

    # Initialize OpenAI client
    print("\n🤖 Initializing OpenAI client...")
    try:
        client = OpenAI(api_key=api_key)
        print("✅ Client initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing OpenAI client: {e}")
        return

    # Generate embeddings in batches
    print("\n🔄 Generating embeddings...")
    print(f"   Model: text-embedding-3-small")
    print(f"   Dimensions: 384 (native)")
    print(f"   Batch size: 100")
    print(f"   Expected time: 2-5 minutes")

    embeddings_list = []
    batch_size = 100
    total_tokens = 0

    try:
        for i in tqdm(range(0, len(texts), batch_size), desc="Processing batches"):
            batch = texts[i:i+batch_size]

            # Call OpenAI API with retry logic
            max_retries = 3
            for retry in range(max_retries):
                try:
                    response = client.embeddings.create(
                        model='text-embedding-3-small',
                        input=batch,
                        dimensions=384,  # Native 384 dimensions
                    )

                    # Extract embeddings
                    batch_embeddings = [item.embedding for item in response.data]
                    embeddings_list.extend(batch_embeddings)

                    # Track usage
                    total_tokens += response.usage.total_tokens

                    break  # Success, exit retry loop

                except Exception as e:
                    if retry < max_retries - 1:
                        print(f"\n⚠️  Retry {retry + 1}/{max_retries} due to error: {e}")
                        time.sleep(2 ** retry)  # Exponential backoff
                    else:
                        raise  # Re-raise on final retry

            # Small delay to respect rate limits
            time.sleep(0.1)

        # Convert to numpy array
        embeddings = np.array(embeddings_list, dtype=np.float32)
        print(f"\n✅ Generated embeddings: {embeddings.shape}")
        print(f"   Total tokens used: {total_tokens:,}")
        print(f"   Actual cost: ${(total_tokens / 1_000_000) * 0.02:.3f}")

    except Exception as e:
        print(f"\n❌ Error generating embeddings: {e}")
        return

    # Validate embeddings
    print("\n🔍 Validating embeddings...")
    print(f"   Shape: {embeddings.shape}")
    print(f"   Dtype: {embeddings.dtype}")
    print(f"   Min value: {embeddings.min():.4f}")
    print(f"   Max value: {embeddings.max():.4f}")
    print(f"   Mean value: {embeddings.mean():.4f}")

    # Check for NaN or Inf
    if np.isnan(embeddings).any():
        print("⚠️  Warning: Embeddings contain NaN values!")
    if np.isinf(embeddings).any():
        print("⚠️  Warning: Embeddings contain Inf values!")

    # Save embeddings
    print(f"\n💾 Saving embeddings to: {output_path}")
    try:
        np.save(output_path, embeddings)
        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"✅ Saved embeddings ({file_size_mb:.2f} MB)")
    except Exception as e:
        print(f"❌ Error saving embeddings: {e}")
        return

    # Save metadata
    metadata = {
        'num_products': len(products),
        'embedding_dim': embeddings.shape[1],
        'model': 'openai/text-embedding-3-small',
        'dimensions': 384,
        'shape': list(embeddings.shape),
        'dtype': str(embeddings.dtype),
        'file_size_mb': file_size_mb,
        'total_tokens': total_tokens,
        'actual_cost_usd': round((total_tokens / 1_000_000) * 0.02, 4),
    }

    print(f"\n💾 Saving metadata to: {metadata_path}")
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print("✅ Metadata saved")

    # Show sample embeddings
    print("\n📊 Sample embedding (first product, first 10 dimensions):")
    print(f"   {embeddings[0][:10]}")

    print("\n" + "=" * 60)
    print("✅ OpenAI embedding generation complete!")
    print("=" * 60)
    print(f"\nOutput files:")
    print(f"  - {output_path} ({file_size_mb:.2f} MB)")
    print(f"  - {metadata_path}")
    print(f"\nNext step: Run 3_upload_openai_pinecone.py")


if __name__ == '__main__':
    main()
