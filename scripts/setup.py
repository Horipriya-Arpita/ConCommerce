"""
Dual Embedding Setup Script - ConCommerce RAG Pipeline
=======================================================
This master script sets up BOTH embedding models (OpenAI + HuggingFace)
in Pinecone, creating a complete dual-model search system.

What this script does:
1. Generates OpenAI embeddings (text-embedding-3-small, 384-dim)
2. Uploads OpenAI embeddings to Pinecone DEFAULT namespace
3. Generates HuggingFace embeddings (all-MiniLM-L6-v2, 384-dim)
4. Uploads HuggingFace embeddings to Pinecone 'huggingface' namespace
5. Verifies both namespaces are working correctly

Requirements:
- OPENAI_API_KEY environment variable
- PINECONE_API_KEY environment variable
- products_clean.json exists (run 1_preprocess_csv.py first)

Estimated time: 5-10 minutes
Estimated cost: ~$0.10 for OpenAI embeddings
"""

import subprocess
import sys
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from frontend/.env.local
env_path = Path(__file__).parent.parent / 'frontend' / '.env.local'
load_dotenv(env_path)

def run_script(script_name, description):
    """Run a Python script and handle errors."""
    print("\n" + "=" * 60)
    print(f"📍 STEP: {description}")
    print("=" * 60)

    script_path = Path(__file__).parent / script_name

    if not script_path.exists():
        print(f"❌ Error: Script not found: {script_path}")
        return False

    try:
        # Run the script as a subprocess
        result = subprocess.run(
            [sys.executable, str(script_path)],
            check=True,
            capture_output=False,  # Show output in real-time
            text=True
        )

        print(f"\n✅ {description} completed successfully!")
        return True

    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} failed with error!")
        print(f"   Error code: {e.returncode}")
        return False

def check_prerequisites():
    """Check if all prerequisites are met."""
    print("=" * 60)
    print("🔍 Checking Prerequisites")
    print("=" * 60)

    all_good = True

    # Check environment variables
    print("\n📋 Environment Variables:")

    if os.getenv('OPENAI_API_KEY'):
        print("   ✅ OPENAI_API_KEY is set")
    else:
        print("   ❌ OPENAI_API_KEY is NOT set")
        all_good = False

    if os.getenv('PINECONE_API_KEY'):
        print("   ✅ PINECONE_API_KEY is set")
    else:
        print("   ❌ PINECONE_API_KEY is NOT set")
        all_good = False

    # Check input file
    print("\n📁 Input Files:")
    products_path = Path(__file__).parent.parent / 'data' / 'processed' / 'products_clean.json'

    if products_path.exists():
        print(f"   ✅ products_clean.json exists")
    else:
        print(f"   ❌ products_clean.json NOT found")
        print(f"      Please run 1_preprocess_csv.py first")
        all_good = False

    if not all_good:
        print("\n❌ Prerequisites not met. Please fix the issues above.")
        print("\n💡 Set environment variables with:")
        print("   export OPENAI_API_KEY='your-key'    # Linux/Mac")
        print("   export PINECONE_API_KEY='your-key'")
        print("\n   set OPENAI_API_KEY=your-key        # Windows CMD")
        print("   set PINECONE_API_KEY=your-key")
        print("\n   $env:OPENAI_API_KEY='your-key'     # Windows PowerShell")
        print("   $env:PINECONE_API_KEY='your-key'")
        return False

    print("\n✅ All prerequisites met!")
    return True

def main():
    """Main setup pipeline."""
    print("=" * 60)
    print("🚀 DUAL EMBEDDING SETUP - ConCommerce RAG")
    print("=" * 60)
    print("\nThis script will:")
    print("  1. Generate OpenAI embeddings (~$0.10 cost)")
    print("  2. Upload OpenAI to Pinecone DEFAULT namespace")
    print("  3. Generate HuggingFace embeddings (FREE)")
    print("  4. Upload HuggingFace to 'huggingface' namespace")
    print("\nEstimated time: 5-10 minutes")

    response = input("\nContinue? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Setup cancelled by user.")
        return

    # Check prerequisites
    if not check_prerequisites():
        return

    # Step 1: Generate OpenAI embeddings
    if not run_script('2_generate_openai_embeddings.py', 'Generate OpenAI Embeddings'):
        print("\n❌ Setup failed at step 1. Please check the errors above.")
        return

    # Step 2: Upload OpenAI embeddings
    if not run_script('4_upload_openai_pinecone.py', 'Upload OpenAI to Pinecone'):
        print("\n❌ Setup failed at step 2. Please check the errors above.")
        return

    # Step 3: Generate HuggingFace embeddings
    if not run_script('3_generate_huggingface_embeddings.py', 'Generate HuggingFace Embeddings'):
        print("\n❌ Setup failed at step 3. Please check the errors above.")
        return

    # Step 4: Upload HuggingFace embeddings
    if not run_script('5_upload_huggingface_pinecone.py', 'Upload HuggingFace to Pinecone'):
        print("\n❌ Setup failed at step 4. Please check the errors above.")
        return

    # Success!
    print("\n" + "=" * 60)
    print("🎉 DUAL EMBEDDING SETUP COMPLETE!")
    print("=" * 60)
    print("\n✅ Both embedding models are now ready!")
    print("\n📊 Your Pinecone index now has:")
    print("   - DEFAULT namespace: OpenAI embeddings (~10,800 vectors)")
    print("   - 'huggingface' namespace: HuggingFace embeddings (~10,800 vectors)")
    print("   - Total: ~21,600 vectors")
    print("\n💡 Next steps:")
    print("   1. Start the frontend: cd frontend && npm run dev")
    print("   2. Open http://localhost:3000")
    print("   3. Try searching with both embedding models:")
    print("      - OpenAI: Premium, accurate (costs $0.0002 per 1000 searches)")
    print("      - HuggingFace: FREE, fast")
    print("   4. Compare the results!")
    print("\n🧪 Test queries to try:")
    print("   - 'gaming pc under 100000'")
    print("   - 'laptop for programming'")
    print("   - 'budget phone'")
    print("\nEnjoy your dual-embedding RAG system! 🚀")


if __name__ == '__main__':
    main()
