"""
Embedding Generation Script for ConCommerce RAG Pipeline
=========================================================
This script generates 384-dimensional vector embeddings for all products
using the sentence-transformers/all-MiniLM-L6-v2 model.

Model: all-MiniLM-L6-v2
- Dimensions: 384
- Speed: Fast (~5 minutes for 10k products on CPU)
- Quality: 90% of larger models for semantic search
- Cost: FREE (runs locally)

Input: data/processed/products_clean.json
Output: data/processed/embeddings.npy (numpy array of shape [N, 384])
"""

import json
import numpy as np
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from pathlib import Path

def main():
    """Main embedding generation pipeline."""
    print("=" * 60)
    print("ConCommerce Embedding Generation")
    print("=" * 60)

    # Paths
    input_path = Path(__file__).parent.parent / 'data' / 'processed' / 'products_clean.json'
    output_path = Path(__file__).parent.parent / 'data' / 'processed' / 'embeddings.npy'
    metadata_path = Path(__file__).parent.parent / 'data' / 'processed' / 'embeddings_meta.json'

    # Check input file exists
    if not input_path.exists():
        print(f"ERROR Error: {input_path} not found!")
        print("   Please run 1_preprocess_csv.py first.")
        return

    # Load products
    print(f"\n📂 Loading products from: {input_path}")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        print(f"OK Loaded {len(products):,} products")
    except Exception as e:
        print(f"ERROR Error loading products: {e}")
        return

    # Extract search content
    print("\n📝 Extracting search content...")
    texts = [p['search_content'] for p in products]
    print(f"OK Extracted {len(texts):,} text entries")

    # Calculate average text length
    avg_length = sum(len(t) for t in texts) / len(texts)
    print(f"   Average text length: {avg_length:.0f} characters")

    # Load model
    print("\n🤖 Loading sentence-transformers model...")
    print("   Model: all-MiniLM-L6-v2")
    print("   (This may take a minute on first run - model will be downloaded)")

    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("OK Model loaded successfully")
    except Exception as e:
        print(f"ERROR Error loading model: {e}")
        print("\n💡 Tip: Install sentence-transformers with:")
        print("   pip install sentence-transformers")
        return

    # Generate embeddings in batches
    print("\n🔄 Generating embeddings...")
    print(f"   Batch size: 100")
    print(f"   Expected time: 2-5 minutes (depends on CPU)")

    embeddings_list = []
    batch_size = 100

    try:
        for i in tqdm(range(0, len(texts), batch_size), desc="Processing batches"):
            batch = texts[i:i+batch_size]
            batch_embeddings = model.encode(
                batch,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=False  # Pinecone handles normalization
            )
            embeddings_list.append(batch_embeddings)

        # Combine all batches
        embeddings = np.vstack(embeddings_list)
        print(f"\nOK Generated embeddings: {embeddings.shape}")

    except Exception as e:
        print(f"\nERROR Error generating embeddings: {e}")
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
        print("ERROR Warning: Embeddings contain NaN values!")
    if np.isinf(embeddings).any():
        print("ERROR Warning: Embeddings contain Inf values!")

    # Save embeddings
    print(f"\n💾 Saving embeddings to: {output_path}")
    try:
        np.save(output_path, embeddings)
        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"OK Saved embeddings ({file_size_mb:.2f} MB)")
    except Exception as e:
        print(f"ERROR Error saving embeddings: {e}")
        return

    # Save metadata
    metadata = {
        'num_products': len(products),
        'embedding_dim': embeddings.shape[1],
        'model': 'sentence-transformers/all-MiniLM-L6-v2',
        'shape': list(embeddings.shape),
        'dtype': str(embeddings.dtype),
        'file_size_mb': file_size_mb,
    }

    print(f"\n💾 Saving metadata to: {metadata_path}")
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print("OK Metadata saved")

    # Show sample embeddings
    print("\n📊 Sample embedding (first product, first 10 dimensions):")
    print(f"   {embeddings[0][:10]}")

    print("\n" + "=" * 60)
    print("OK Embedding generation complete!")
    print("=" * 60)
    print(f"\nOutput files:")
    print(f"  - {output_path} ({file_size_mb:.2f} MB)")
    print(f"  - {metadata_path}")
    print(f"\nNext step: Run 3_upload_pinecone.py")


if __name__ == '__main__':
    main()
