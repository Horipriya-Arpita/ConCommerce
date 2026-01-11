"""
Clear Pinecone Index - ConCommerce RAG Pipeline
================================================
This script deletes ALL vectors from the Pinecone index, including all namespaces.
Use this to start fresh when rebuilding your vector database.

⚠️  WARNING: This will permanently delete all vectors!

Environment Variables:
- PINECONE_API_KEY: Your Pinecone API key
"""

import os
from pinecone import Pinecone
from pathlib import Path
from dotenv import load_dotenv

def main():
    """Clear all vectors from Pinecone index."""
    # Load environment variables from frontend/.env.local
    env_path = Path(__file__).parent.parent / 'frontend' / '.env.local'
    load_dotenv(env_path)

    print("=" * 60)
    print("⚠️  CLEAR PINECONE INDEX")
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

    # Initialize Pinecone
    print("\n🔗 Connecting to Pinecone...")
    try:
        pc = Pinecone(api_key=api_key)
        print("✅ Connected to Pinecone")
    except Exception as e:
        print(f"❌ Error connecting to Pinecone: {e}")
        return

    # Index configuration
    index_name = 'concommerce-products'

    # Check if index exists
    print(f"\n🔍 Checking for index: {index_name}")
    existing_indexes = pc.list_indexes().names()

    if index_name not in existing_indexes:
        print(f"✅ Index '{index_name}' does not exist. Nothing to clear.")
        return

    # Connect to index
    print(f"\n🔗 Connecting to index: {index_name}")
    try:
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        total_count = stats['total_vector_count']
        namespaces = stats.get('namespaces', {})

        print(f"✅ Connected to index")
        print(f"\n📊 Current index stats:")
        print(f"   Total vectors: {total_count:,}")

        if namespaces:
            print(f"   Namespaces:")
            for ns_name, ns_data in namespaces.items():
                ns_display = 'DEFAULT' if ns_name == '' else ns_name
                print(f"      - {ns_display}: {ns_data.get('vector_count', 0):,} vectors")

        if total_count == 0:
            print("\n✅ Index is already empty. Nothing to clear.")
            return

    except Exception as e:
        print(f"❌ Error connecting to index: {e}")
        return

    # Confirm deletion
    print(f"\n⚠️  WARNING: This will delete ALL {total_count:,} vectors from the index!")
    print("   This action cannot be undone.")
    response = input("\n   Type 'DELETE' to confirm: ")

    if response != 'DELETE':
        print("❌ Operation cancelled. No vectors were deleted.")
        return

    # Delete all vectors from all namespaces
    print("\n🗑️  Deleting vectors...")

    try:
        # Delete from each namespace
        if namespaces:
            for ns_name in namespaces.keys():
                ns_display = 'DEFAULT' if ns_name == '' else ns_name
                print(f"   Deleting from {ns_display} namespace...")

                # Delete all vectors in this namespace
                index.delete(delete_all=True, namespace=ns_name)

        print(f"\n✅ All vectors deleted successfully!")

    except Exception as e:
        print(f"\n❌ Error deleting vectors: {e}")
        return

    # Verify deletion
    print("\n🔍 Verifying deletion...")
    try:
        import time
        time.sleep(2)  # Wait for deletion to propagate

        stats = index.describe_index_stats()
        total_count = stats['total_vector_count']

        print(f"✅ Verification complete!")
        print(f"   Total vectors remaining: {total_count:,}")

        if total_count == 0:
            print("\n✅ Index successfully cleared!")
        else:
            print(f"\n⚠️  Warning: {total_count:,} vectors still remain (may take a moment to propagate)")

    except Exception as e:
        print(f"❌ Error verifying deletion: {e}")
        return

    print("\n" + "=" * 60)
    print("✅ Pinecone index cleared!")
    print("=" * 60)
    print("\n💡 Next steps:")
    print("   1. Run 6_setup_dual_embeddings.py to rebuild both embedding models")
    print("   2. Or run individual scripts:")
    print("      - 2b_generate_openai_embeddings.py")
    print("      - 3_upload_openai_pinecone.py")
    print("      - 2_generate_embeddings.py")
    print("      - 5_upload_huggingface_namespace.py")


if __name__ == '__main__':
    main()
