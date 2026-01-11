"""
Pinecone Upload Script for OpenAI Embeddings - ConCommerce RAG Pipeline
========================================================================
This script uploads OpenAI product embeddings and metadata to Pinecone
vector database in the DEFAULT namespace.

Requirements:
- Pinecone account (free tier at https://app.pinecone.io/)
- Index created with:
  - Name: concommerce-products
  - Dimensions: 384
  - Metric: cosine
  - Cloud: AWS (free tier)
  - Region: us-east-1

Environment Variables:
- PINECONE_API_KEY: Your Pinecone API key

Input:
- data/processed/products_clean.json
- data/processed/embeddings_openai.npy

Output: ~10,800 OpenAI vectors in Pinecone default namespace
"""

import json
import numpy as np
import os
from pinecone import Pinecone, ServerlessSpec
from tqdm import tqdm
from pathlib import Path
from dotenv import load_dotenv

def main():
    """Main Pinecone upload pipeline for OpenAI embeddings."""
    # Load environment variables from frontend/.env.local
    env_path = Path(__file__).parent.parent / 'frontend' / '.env.local'
    load_dotenv(env_path)

    print("=" * 60)
    print("ConCommerce Pinecone Upload - OpenAI Embeddings")
    print("=" * 60)

    # Check environment variables
    api_key = os.getenv('PINECONE_API_KEY')
    if not api_key:
        print("\n❌ Error: PINECONE_API_KEY environment variable not set!")
        print("\n💡 Set it with:")
        print("   export PINECONE_API_KEY='your-api-key'  # Linux/Mac")
        print("   set PINECONE_API_KEY=your-api-key       # Windows CMD")
        print("   $env:PINECONE_API_KEY='your-api-key'    # Windows PowerShell")
        print("\n   Get your API key from: https://app.pinecone.io/")
        return

    # Paths
    products_path = Path(__file__).parent.parent / 'data' / 'processed' / 'products_clean.json'
    embeddings_path = Path(__file__).parent.parent / 'data' / 'processed' / 'embeddings_openai.npy'

    # Check input files exist
    if not products_path.exists():
        print(f"❌ Error: {products_path} not found!")
        print("   Please run 1_preprocess_csv.py first.")
        return

    if not embeddings_path.exists():
        print(f"❌ Error: {embeddings_path} not found!")
        print("   Please run 2b_generate_openai_embeddings.py first.")
        return

    # Load products
    print(f"\n📂 Loading products from: {products_path}")
    try:
        with open(products_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        print(f"✅ Loaded {len(products):,} products")
    except Exception as e:
        print(f"❌ Error loading products: {e}")
        return

    # Load embeddings
    print(f"\n📂 Loading OpenAI embeddings from: {embeddings_path}")
    try:
        embeddings = np.load(embeddings_path)
        print(f"✅ Loaded embeddings: {embeddings.shape}")
    except Exception as e:
        print(f"❌ Error loading embeddings: {e}")
        return

    # Validate dimensions match
    if len(products) != embeddings.shape[0]:
        print(f"❌ Error: Mismatch between products ({len(products)}) and embeddings ({embeddings.shape[0]})")
        return

    # Initialize Pinecone
    print("\n🔗 Connecting to Pinecone...")
    try:
        pc = Pinecone(api_key=api_key)
        print("✅ Connected to Pinecone")
    except Exception as e:
        print(f"❌ Error connecting to Pinecone: {e}")
        print("\n💡 Check your API key is correct")
        return

    # Index configuration
    index_name = 'concommerce-products'
    dimension = 384
    metric = 'cosine'

    # Check if index exists, create if not
    print(f"\n🔍 Checking for index: {index_name}")
    existing_indexes = pc.list_indexes().names()

    if index_name not in existing_indexes:
        print(f"⚠️  Index '{index_name}' not found. Creating...")
        try:
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud='aws',
                    region='us-east-1'
                )
            )
            print(f"✅ Index '{index_name}' created successfully")
            print("   Waiting for index to be ready...")
            import time
            time.sleep(10)  # Wait for index to initialize
        except Exception as e:
            print(f"❌ Error creating index: {e}")
            print("\n💡 You can create the index manually at: https://app.pinecone.io/")
            print(f"   Settings: Dimensions={dimension}, Metric={metric}")
            return
    else:
        print(f"✅ Index '{index_name}' found")

    # Connect to index
    print(f"\n🔗 Connecting to index: {index_name}")
    try:
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"✅ Connected to index")
        print(f"   Current vector count: {stats['total_vector_count']:,}")

        # Check if default namespace exists
        default_namespace_count = stats.get('namespaces', {}).get('', {}).get('vector_count', 0)
        print(f"   Default namespace vectors: {default_namespace_count:,}")

        if default_namespace_count > 0:
            print(f"\n⚠️  WARNING: Default namespace already has {default_namespace_count:,} vectors!")
            print("   This upload will OVERWRITE/UPDATE existing vectors with same IDs.")
            response = input("   Continue? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("❌ Upload cancelled by user.")
                return
    except Exception as e:
        print(f"❌ Error connecting to index: {e}")
        return

    # Prepare vectors for upload
    print("\n📦 Preparing vectors for upload to DEFAULT namespace...")
    vectors_to_upload = []

    for i, product in enumerate(tqdm(products, desc="Processing products")):
        # Prepare metadata (Pinecone has size limits, keep it concise)
        metadata = {
            'name': product['name'][:200],  # Limit length
            'price_min': product['price_min'] or 0,
            'price_max': product['price_max'] or 0,
            'category': product['category'][:100],
            'brand': product['brand'][:50],
            'source': product['source'],
            'url': product['url'][:200],
            'image': product['image'][:200],
            'warranty': product['warranty'][:150],
        }

        # Add specs if available
        if product['specs'].get('processor'):
            metadata['processor'] = product['specs']['processor'][:80]

        if product['specs'].get('ram'):
            metadata['ram'] = product['specs']['ram'][:30]

        if product['specs'].get('storage'):
            metadata['storage'] = product['specs']['storage'][:30]

        if product['specs'].get('graphics'):
            metadata['graphics'] = product['specs']['graphics'][:80]

        # Create vector tuple: (id, values, metadata)
        vector = (
            product['id'],
            embeddings[i].tolist(),
            metadata
        )

        vectors_to_upload.append(vector)

    print(f"✅ Prepared {len(vectors_to_upload):,} vectors")

    # Upload in batches to DEFAULT namespace (no namespace parameter = default)
    print(f"\n⬆️  Uploading to Pinecone DEFAULT namespace...")
    print(f"   Batch size: 100 vectors")
    print(f"   Total batches: {(len(vectors_to_upload) + 99) // 100}")
    print(f"   Note: Uploading to DEFAULT namespace (for OpenAI embeddings)")

    batch_size = 100
    uploaded_count = 0

    try:
        for i in tqdm(range(0, len(vectors_to_upload), batch_size), desc="Uploading batches"):
            batch = vectors_to_upload[i:i+batch_size]
            # Upload to default namespace (no namespace parameter)
            index.upsert(vectors=batch)
            uploaded_count += len(batch)

        print(f"\n✅ Upload complete! Uploaded {uploaded_count:,} vectors to DEFAULT namespace")

    except Exception as e:
        print(f"\n❌ Error during upload: {e}")
        print(f"   Uploaded {uploaded_count:,} vectors before error")
        return

    # Verify upload
    print("\n🔍 Verifying upload...")
    try:
        stats = index.describe_index_stats()
        total_count = stats['total_vector_count']
        default_namespace_count = stats.get('namespaces', {}).get('', {}).get('vector_count', 0)

        print(f"✅ Verification complete!")
        print(f"   Total vectors in index: {total_count:,}")
        print(f"   Vectors in DEFAULT namespace: {default_namespace_count:,}")

        # Show all namespaces
        namespaces = stats.get('namespaces', {})
        if len(namespaces) > 1:
            print(f"\n📊 All namespaces in index:")
            for ns_name, ns_data in namespaces.items():
                ns_display = 'DEFAULT' if ns_name == '' else ns_name
                print(f"   - {ns_display}: {ns_data.get('vector_count', 0):,} vectors")

    except Exception as e:
        print(f"❌ Error verifying upload: {e}")
        return

    print("\n" + "=" * 60)
    print("✅ OpenAI embeddings uploaded successfully!")
    print("=" * 60)
    print(f"\nNamespace: DEFAULT (OpenAI embeddings)")
    print(f"Vectors: {uploaded_count:,}")
    print(f"\n💡 Next steps:")
    print(f"   1. Run 5_upload_huggingface_namespace.py to add HuggingFace embeddings")
    print(f"   2. Test search in frontend at http://localhost:3000")
    print(f"   3. Try both OpenAI and HuggingFace models in the UI")


if __name__ == '__main__':
    main()
