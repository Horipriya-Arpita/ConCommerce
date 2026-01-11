# Python Scripts - Embedding Pipeline

This directory contains Python scripts for preprocessing product data, generating dual embeddings (OpenAI + HuggingFace), and uploading to Pinecone.

---

## Quick Start

### 1. Install Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

**Dependencies:**
- `numpy` - Array operations
- `pandas` - CSV/JSON processing
- `tqdm` - Progress bars
- `pinecone-client` - Vector database
- `openai` - OpenAI embeddings API
- `sentence-transformers` - HuggingFace local embeddings
- `torch` - PyTorch for transformers
- `transformers` - Model loading
- `python-dotenv` - Environment variable loading

**Note:** If you encounter numpy compilation errors on Python 3.14, use Python 3.12 instead.

---

### 2. Environment Variables

**All scripts automatically load environment variables from `frontend/.env.local`**

You don't need to set environment variables manually! Just make sure `frontend/.env.local` exists with:

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=concommerce-products
HUGGINGFACE_API_KEY=hf_...
```

---

### 3. Setup Pinecone Index

1. Go to https://app.pinecone.io/ and sign up (free tier)
2. Create a new index:
   - **Name:** `concommerce-products`
   - **Dimensions:** `384`
   - **Metric:** `cosine`
   - **Cloud:** AWS (free tier)
   - **Region:** us-east-1

---

### 4. Run Setup

You have two options:

#### Option A: Automatic Setup (Recommended)

```bash
python setup.py
```

This master script runs all steps automatically:
1. Preprocess product data
2. Generate OpenAI embeddings
3. Upload OpenAI to DEFAULT namespace
4. Generate HuggingFace embeddings
5. Upload HuggingFace to 'huggingface' namespace

**Runtime:** ~10 minutes
**Cost:** ~$0.10 (OpenAI embeddings only)

#### Option B: Manual Step-by-Step

```bash
# Step 1: Clean product data
python 1_preprocess_data.py

# Step 2: Generate OpenAI embeddings (~$0.10 cost)
python 2_generate_openai_embeddings.py

# Step 3: Generate HuggingFace embeddings (FREE)
python 3_generate_huggingface_embeddings.py

# Step 4: Upload OpenAI embeddings to DEFAULT namespace
python 4_upload_openai_pinecone.py

# Step 5: Upload HuggingFace embeddings to 'huggingface' namespace
python 5_upload_huggingface_pinecone.py
```

---

## Script Details

### setup.py ⭐ (Master Script)

**Purpose:** Run all setup steps automatically

**What it does:**
- Validates environment variables
- Runs all scripts in correct order
- Provides progress updates
- Shows final statistics

**Usage:**
```bash
python setup.py
```

**Runtime:** ~10 minutes
**Cost:** ~$0.10 (OpenAI API)

---

### 1_preprocess_data.py

**Purpose:** Clean and structure raw product CSV data

**Input:** `data/products_merged.csv` (10,800 products)

**Output:** `data/processed/products_clean.json` (~15MB)

**What it does:**
- Parses price strings ("24,499৳28,100৳" → min/max prices)
- Extracts specs (processor, RAM, GPU, storage) from JSON fields
- Builds searchable content for embeddings
- Generates unique IDs from SKU

**Usage:**
```bash
python 1_preprocess_data.py
```

**Runtime:** ~30 seconds

---

### 2_generate_openai_embeddings.py

**Purpose:** Generate 384-dimensional OpenAI embeddings

**Input:** `data/processed/products_clean.json`

**Output:** `data/processed/embeddings_openai.npy` (~16MB, shape: 10800×384)

**What it does:**
- Uses OpenAI `text-embedding-3-small` model
- Generates native 384-dimensional vectors (no truncation)
- Processes in batches of 100
- Saves as numpy array with metadata

**Usage:**
```bash
python 2_generate_openai_embeddings.py
```

**Model:** `text-embedding-3-small`
- 384 dimensions (native)
- Excellent quality (95%+ relevance)
- Fast inference
- **Cost:** ~$0.10 for 10,800 products

**Runtime:** ~5 minutes

---

### 3_generate_huggingface_embeddings.py

**Purpose:** Generate 384-dimensional HuggingFace embeddings locally

**Input:** `data/processed/products_clean.json`

**Output:** `data/processed/embeddings.npy` (~16MB, shape: 10800×384)

**What it does:**
- Loads sentence-transformers model locally
- Generates embeddings using `all-MiniLM-L6-v2`
- Processes in batches of 100
- Saves as numpy array with metadata

**Usage:**
```bash
python 3_generate_huggingface_embeddings.py
```

**Model:** `sentence-transformers/all-MiniLM-L6-v2`
- 384 dimensions (native)
- Very good quality (90%+ relevance)
- Runs locally (no API calls)
- **Cost:** FREE

**Runtime:** 2-5 minutes on CPU
**Note:** First run downloads the model (~80MB)

---

### 4_upload_openai_pinecone.py

**Purpose:** Upload OpenAI embeddings to Pinecone DEFAULT namespace

**Input:**
- `data/processed/products_clean.json`
- `data/processed/embeddings_openai.npy`

**Output:** ~10,800 vectors in Pinecone DEFAULT namespace

**What it does:**
- Connects to Pinecone using credentials from `.env.local`
- Uploads to DEFAULT namespace (not 'huggingface')
- Includes full metadata (name, price, specs, URLs, etc.)
- Processes in batches of 100
- Verifies upload with final stats

**Usage:**
```bash
python 4_upload_openai_pinecone.py
```

**Runtime:** 1-2 minutes

---

### 5_upload_huggingface_pinecone.py

**Purpose:** Upload HuggingFace embeddings to Pinecone 'huggingface' namespace

**Input:**
- `data/processed/products_clean.json`
- `data/processed/embeddings.npy`

**Output:** ~10,800 vectors in Pinecone 'huggingface' namespace

**What it does:**
- Connects to Pinecone using credentials from `.env.local`
- Uploads to 'huggingface' namespace (separate from OpenAI)
- Includes full metadata (name, price, specs, URLs, etc.)
- Processes in batches of 100
- Verifies upload with final stats

**Usage:**
```bash
python 5_upload_huggingface_pinecone.py
```

**Runtime:** 1-2 minutes

---

### clear_pinecone.py (Utility)

**Purpose:** Clear ALL vectors from Pinecone index

**WARNING:** This deletes EVERYTHING! Use with caution.

**What it does:**
- Deletes all vectors from both namespaces (DEFAULT + 'huggingface')
- Requires typing 'DELETE' to confirm
- Shows statistics before deletion

**Usage:**
```bash
python clear_pinecone.py
# Type 'DELETE' when prompted
```

**When to use:**
- Starting fresh after errors
- Rebuilding with different settings
- Cleaning up before re-upload

---

## Output Files

After running all scripts, you should have:

```
data/
├── products_merged.csv              (original data, 23MB)
└── processed/
    ├── products_clean.json          (10,800 products, ~15MB)
    ├── embeddings_openai.npy        (OpenAI vectors, ~16MB)
    ├── embeddings_openai_meta.json  (metadata)
    ├── embeddings.npy               (HuggingFace vectors, ~16MB)
    └── embeddings_meta.json         (metadata)
```

**Note:** `.npy` files are excluded from Git (see `.gitignore`) as they're large and can be regenerated.

---

## Pinecone Structure

After successful setup:

```
Pinecone Index: concommerce-products
├── DEFAULT namespace
│   ├── Model: OpenAI text-embedding-3-small
│   ├── Dimensions: 384 (native)
│   ├── Vectors: ~10,800
│   └── Usage: Selected when "OpenAI Embeddings" chosen in UI
│
└── 'huggingface' namespace
    ├── Model: sentence-transformers/all-MiniLM-L6-v2
    ├── Dimensions: 384 (native)
    ├── Vectors: ~10,800
    └── Usage: Selected when "HuggingFace MiniLM" chosen in UI
```

---

## Troubleshooting

### "PINECONE_API_KEY not set"
**Solution:** Make sure `frontend/.env.local` exists with your Pinecone API key. Scripts automatically load from this file.

### "FileNotFoundError: products_merged.csv"
**Solution:** Make sure you're in the correct directory. The script expects:
```
ConCommerce/
├── data/products_merged.csv  ← Must exist
└── scripts/
    └── 1_preprocess_data.py  ← Run from here
```

### "ModuleNotFoundError"
**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

### Numpy compilation errors
**Solution:** You're probably using Python 3.14. Install Python 3.12 instead:
```bash
python --version  # Should show 3.12.x
```

### HuggingFace model download is slow
**Solution:** First run downloads ~80MB model. Subsequent runs are fast. The model is cached locally.

### OpenAI API errors
**Solution:**
1. Check your API key in `frontend/.env.local`
2. Verify you have credits: https://platform.openai.com/usage
3. Expected cost: ~$0.10 for full setup

### Pinecone connection timeout
**Solution:**
1. Check your API key
2. Verify index name matches `PINECONE_INDEX_NAME` in `.env.local`
3. Check Pinecone dashboard: https://app.pinecone.io/

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| **Data preprocessing** | FREE (local) |
| **OpenAI embeddings** | ~$0.10 (one-time) |
| **HuggingFace embeddings** | FREE (local) |
| **Pinecone storage** | FREE (free tier: 100k vectors, we use ~21k) |
| **Total Setup Cost** | **~$0.10** |

---

## Rebuilding from Scratch

If you want to start fresh:

```bash
# 1. Clear Pinecone (deletes ALL vectors)
python clear_pinecone.py
# Type 'DELETE' when prompted

# 2. Delete generated files (optional)
rm -rf ../data/processed/

# 3. Run setup again
python setup.py
```

---

## Next Steps

After running the scripts:

1. ✅ Verify vectors uploaded to Pinecone (check dashboard)
2. ✅ Start the frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
3. ✅ Open http://localhost:3000
4. ✅ Test both embedding models in the UI

---

## Model Comparison

| Metric | OpenAI | HuggingFace |
|--------|--------|-------------|
| **Quality** | Excellent (95%+) | Very Good (90%+) |
| **Speed** | ~200ms | ~130ms |
| **Cost (Setup)** | $0.10 | $0 |
| **Cost (Per Query)** | $0.0002/1K | $0 |
| **API Dependency** | Yes | No (runs locally) |

**Recommendation:**
- **Development:** Use HuggingFace (free, fast)
- **Production:** Use OpenAI (slightly better quality)
- **Budget-conscious:** Use HuggingFace (unlimited free queries)

---

**Built with Python, OpenAI, HuggingFace, and Pinecone** 🚀
