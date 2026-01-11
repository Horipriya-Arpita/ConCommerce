"""
Upload HuggingFace Embeddings to Pinecone Namespace
====================================================
This script uploads the HuggingFace (all-MiniLM-L6-v2) embeddings to a separate
Pinecone namespace to enable dual embedding model support.

Namespace Strategy:
- Default namespace (empty string): OpenAI embeddings
- 'huggingface' namespace: HuggingFace embeddings

This allows users to switch between embedding models in the UI while querying
the correct vector database.
"""

import json
import numpy as np
from pinecone import Pinecone, ServerlessSpec
from tqdm import tqdm
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent / 'frontend' / '.env.local')

def main():
    """Main upload pipeline for HuggingFace embeddings."""
    print("=" * 60)
    print("Upload HuggingFace Embeddings to Pinecone Namespace")
    print("=" * 60)

    # Paths
    products_path = Path(__file__).parent.parent / 'data' / 'processed' / 'products_clean.json'
    embeddings_path = Path(__file__).parent.parent / 'data' / 'processed' / 'embeddings.npy'

    # Check files exist
    if not products_path.exists():
        print(f"[ERROR] File not found: {products_path}")
        print("   Please run 1_preprocess_csv.py first.")
        return

    if not embeddings_path.exists():
        print(f"[ERROR] File not found: {embeddings_path}")
        print("   Please run 2_generate_embeddings.py first.")
        return

    # Load products
    print(f"\n[*] Loading products from: {products_path}")
    try:
        with open(products_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        print(f"[OK] Loaded {len(products):,} products")
    except Exception as e:
        print(f"[ERROR] Error loading products: {e}")
        return

    # Load embeddings
    print(f"\n[*] Loading HuggingFace embeddings from: {embeddings_path}")
    try:
        embeddings = np.load(embeddings_path)
        print(f"[OK] Loaded embeddings: {embeddings.shape}")
    except Exception as e:
        print(f"[ERROR] Error loading embeddings: {e}")
        return

    # Validate dimensions
    if embeddings.shape[0] != len(products):
        print(f"[ERROR] Mismatch between products ({len(products)}) and embeddings ({embeddings.shape[0]})")
        return

    if embeddings.shape[1] != 384:
        print(f"[ERROR] Expected 384 dimensions, got {embeddings.shape[1]}")
        return

    # Initialize Pinecone
    print("\n[*] Connecting to Pinecone...")
    api_key = os.getenv('PINECONE_API_KEY')
    index_name = os.getenv('PINECONE_INDEX_NAME', 'concommerce-products')

    if not api_key:
        print("[ERROR] PINECONE_API_KEY not found in environment variables")
        print("   Please set it in frontend/.env.local")
        return

    try:
        pc = Pinecone(api_key=api_key)
        print(f"[OK] Connected to Pinecone")
    except Exception as e:
        print(f"[ERROR] Error connecting to Pinecone: {e}")
        return

    # Check if index exists
    print(f"\n[*] Checking for index: {index_name}")
    try:
        if index_name not in pc.list_indexes().names():
            print(f"[ERROR] Index '{index_name}' not found!")
            print("   Please run 3_upload_pinecone.py to create the index first.")
            return
        else:
            print(f"[OK] Index '{index_name}' exists")
    except Exception as e:
        print(f"[ERROR] Error checking index: {e}")
        return

    # Get index reference
    try:
        index = pc.Index(index_name)
        print(f"[OK] Connected to index: {index_name}")
    except Exception as e:
        print(f"[ERROR] Error getting index: {e}")
        return

    # Prepare vectors for upload
    print("\n[*] Preparing vectors for 'huggingface' namespace...")
    vectors = []
    for i, (product, embedding) in enumerate(zip(products, embeddings)):
        vector_id = product['id']

        # Prepare metadata (same as OpenAI namespace)
        metadata = {
            'name': product['name'],
            'price_min': float(product.get('price_min', 0) or 0),
            'price_max': float(product.get('price_max', 0) or 0),
            'brand': product.get('brand', 'Unknown'),
            'category': product.get('category', ''),
            'source': product.get('source', 'Unknown'),
            'url': product.get('url', ''),
            'image': product.get('image', ''),
            'processor': product.get('specs', {}).get('processor', ''),
            'ram': product.get('specs', {}).get('ram', ''),
            'storage': product.get('specs', {}).get('storage', ''),
            'graphics': product.get('specs', {}).get('graphics', ''),
            'warranty': product.get('warranty', ''),
        }

        # Remove empty strings and None values to save space
        metadata = {k: v for k, v in metadata.items() if v not in ('', None, 0)}

        vectors.append({
            'id': vector_id,
            'values': embedding.tolist(),
            'metadata': metadata
        })

    print(f"[OK] Prepared {len(vectors):,} vectors")

    # Upload in batches to huggingface namespace
    print("\n[*] Uploading to 'huggingface' namespace...")
    batch_size = 100
    successful_uploads = 0

    try:
        for i in tqdm(range(0, len(vectors), batch_size), desc="Uploading batches"):
            batch = vectors[i:i+batch_size]

            # Upload to 'huggingface' namespace
            index.upsert(
                vectors=batch,
                namespace='huggingface'
            )
            successful_uploads += len(batch)

        print(f"\n[OK] Successfully uploaded {successful_uploads:,} vectors to 'huggingface' namespace!")

    except Exception as e:
        print(f"\n[ERROR] Error uploading vectors: {e}")
        return

    # Verify namespace stats
    print("\n[*] Verifying namespace stats...")
    try:
        stats = index.describe_index_stats()
        print(f"\nIndex: {index_name}")
        print(f"  Total vectors: {stats.total_vector_count:,}")
        print(f"  Dimension: {stats.dimension}")

        if stats.namespaces:
            print(f"\nNamespaces:")
            for ns, ns_stats in stats.namespaces.items():
                ns_name = ns if ns else 'default (OpenAI)'
                print(f"  - {ns_name}: {ns_stats.vector_count:,} vectors")

        print("\n[OK] Upload complete!")
        print("\n[NEXT] Next steps:")
        print("   1. The HuggingFace namespace is now ready")
        print("   2. Users can select 'HuggingFace MiniLM' in the UI")
        print("   3. Searches will automatically use the correct namespace")

    except Exception as e:
        print(f"[ERROR] Error getting stats: {e}")

if __name__ == '__main__':
    main()
