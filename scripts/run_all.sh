#!/bin/bash
# Run all Phase 1 scripts in sequence
# Make sure to set PINECONE_API_KEY before running step 3

echo "======================================================"
echo "ConCommerce RAG Pipeline - Phase 1 Setup"
echo "======================================================"

# Set UTF-8 encoding for emoji support
export PYTHONIOENCODING=utf-8

echo ""
echo "Step 1: Preprocessing CSV data..."
echo "------------------------------------------------------"
python 1_preprocess_csv.py
if [ $? -ne 0 ]; then
    echo "ERROR: Preprocessing failed!"
    exit 1
fi

echo ""
echo "Step 2: Generating embeddings (this may take 2-5 minutes)..."
echo "------------------------------------------------------"
python 2_generate_embeddings.py
if [ $? -ne 0 ]; then
    echo "ERROR: Embedding generation failed!"
    exit 1
fi

echo ""
echo "Step 3: Uploading to Pinecone..."
echo "------------------------------------------------------"
if [ -z "$PINECONE_API_KEY" ]; then
    echo "WARNING: PINECONE_API_KEY not set!"
    echo ""
    echo "Please set your Pinecone API key:"
    echo "  export PINECONE_API_KEY='your-key-here'"
    echo ""
    echo "Get your free API key from: https://app.pinecone.io/"
    echo ""
    read -p "Enter your Pinecone API key now (or press Ctrl+C to exit): " api_key
    export PINECONE_API_KEY="$api_key"
fi

python 3_upload_pinecone.py
if [ $? -ne 0 ]; then
    echo "ERROR: Pinecone upload failed!"
    exit 1
fi

echo ""
echo "Step 4: Validating search quality..."
echo "------------------------------------------------------"
python 4_validate_search.py
if [ $? -ne 0 ]; then
    echo "ERROR: Search validation failed!"
    exit 1
fi

echo ""
echo "======================================================"
echo "Phase 1 Complete!"
echo "======================================================"
echo ""
echo "Next: Proceed to Phase 2 (Backend API Implementation)"
echo "See docs/rag-backend-implementation.md for details"
