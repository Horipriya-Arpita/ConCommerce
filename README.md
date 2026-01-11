# 🛍️ ConCommerce - AI-Powered Product Search

> Smart product comparison chatbot with dual embedding models and RAG-powered search across 10,800+ products from StarTech and Daraz.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 Features

- 🔍 **Dual Embedding Models** - Choose between OpenAI (premium) or HuggingFace (free)
- 🤖 **Multi-LLM Support** - Gemini 2.5 Flash (free) or OpenAI GPT-4o-mini
- 📊 **10,800+ Products** - StarTech & Daraz product database
- ⚡ **Vector Search** - Pinecone-powered semantic search
- 🎨 **Modern UI** - Beautiful Next.js interface with real-time chat
- 💰 **Cost-Effective** - Free tier options available

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### API Keys Needed

1. **OpenAI API Key** - [Get it here](https://platform.openai.com/api-keys) (~$0.10 setup cost)
2. **Pinecone API Key** - [Get it here](https://app.pinecone.io/) (Free tier)
3. **Google Gemini API Key** - [Get it here](https://aistudio.google.com/apikey) (Free)
4. **HuggingFace API Key** - [Get it here](https://huggingface.co/settings/tokens) (Free)

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ConCommerce.git
cd ConCommerce
```

### 2. Set Up Environment Variables

Create `frontend/.env.local`:

```bash
cd frontend
```

Create a file named `.env.local` with:

```env
# OpenAI (for embeddings and LLM fallback)
OPENAI_API_KEY=sk-...

# Google Gemini (primary LLM - FREE)
GOOGLE_GEMINI_API_KEY=AIzaSy...

# Pinecone (vector database - FREE tier)
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=concommerce-products

# HuggingFace (for free embeddings - FREE)
HUGGINGFACE_API_KEY=hf_...
```

### 3. Install Python Dependencies

First, navigate to the scripts directory:

```bash
cd scripts
pip install -r requirements.txt
```

**If you encounter numpy compilation errors**, install packages individually:

```bash
pip install numpy pandas tqdm
pip install pinecone-client openai sentence-transformers python-dotenv
```

### 4. Generate & Upload Embeddings

You have two options:

#### Option A: Automatic Setup (Recommended)

Run the master setup script that does everything automatically:

```bash
# Run from scripts/ directory (~10 minutes, ~$0.10 cost)
python setup.py
```

The script will automatically:
1. ✅ Preprocess product data
2. ✅ Generate OpenAI embeddings (384-dim, ~$0.10)
3. ✅ Upload to Pinecone DEFAULT namespace
4. ✅ Generate HuggingFace embeddings (384-dim, FREE)
5. ✅ Upload to Pinecone 'huggingface' namespace

**Expected Output:**
```
✅ Dual embedding setup complete!
📊 Your Pinecone index now has:
   - DEFAULT namespace: OpenAI embeddings (~10,800 vectors)
   - 'huggingface' namespace: HuggingFace embeddings (~10,800 vectors)
   - Total: ~21,600 vectors
```

#### Option B: Manual Step-by-Step

If you prefer to run each step individually:

```bash
# 1. Clean the product data
python 1_preprocess_data.py

# 2. Generate OpenAI embeddings (~$0.10 cost)
python 2_generate_openai_embeddings.py

# 3. Generate HuggingFace embeddings (FREE)
python 3_generate_huggingface_embeddings.py

# 4. Upload OpenAI embeddings to Pinecone
python 4_upload_openai_pinecone.py

# 5. Upload HuggingFace embeddings to Pinecone
python 5_upload_huggingface_pinecone.py
```

See [scripts/README.md](scripts/README.md) for detailed documentation on each script.

### 5. Start the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🎨 Using the App

### Search Options

**Embedding Models:**
- **OpenAI Embeddings** - Premium quality ($0.0002/1K queries)
- **HuggingFace MiniLM** - Good quality (FREE, unlimited)

**LLM Providers:**
- **Gemini 2.5 Flash** - Fast, accurate (FREE, recommended)
- **OpenAI GPT-4o-mini** - Fallback option (paid)

### Try These Queries

- "gaming pc under 100000"
- "laptop for programming with 16GB RAM"
- "budget phone with good camera"
- "compare AMD Ryzen 5 laptops"

---

## 📁 Project Structure

```
ConCommerce/
├── frontend/              # Next.js app
│   ├── app/              # Pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Core logic
│   │   ├── embeddings.ts       # Dual embedding generation
│   │   ├── vector-search.ts    # Pinecone integration
│   │   └── llm-providers.ts    # Gemini + OpenAI
│   └── .env.local        # API keys (create this!)
│
├── scripts/              # Python embedding pipeline
│   ├── 1_preprocess_data.py                 # Clean product data
│   ├── 2_generate_openai_embeddings.py      # Generate OpenAI embeddings
│   ├── 3_generate_huggingface_embeddings.py # Generate HF embeddings
│   ├── 4_upload_openai_pinecone.py          # Upload OpenAI → DEFAULT namespace
│   ├── 5_upload_huggingface_pinecone.py     # Upload HF → 'huggingface' namespace
│   ├── setup.py                             # Master setup script ⭐
│   ├── clear_pinecone.py                    # Clear Pinecone index (utility)
│   ├── requirements.txt                     # Python dependencies
│   └── README.md                            # Detailed script docs
│
├── data/                 # Product data
│   └── processed/
│       ├── products_clean.json        # 10,800 products
│       ├── embeddings.npy             # HuggingFace embeddings
│       └── embeddings_openai.npy      # OpenAI embeddings
│
└── README.md            # This file
```

---

## 🏗️ Architecture

### Dual Embedding Strategy

```
Pinecone Index: concommerce-products
├── DEFAULT namespace
│   ├── Model: OpenAI text-embedding-3-small
│   ├── Dimensions: 384 (native)
│   ├── Vectors: ~10,800
│   └── Cost: $0.0002 per 1000 queries
│
└── 'huggingface' namespace
    ├── Model: sentence-transformers/all-MiniLM-L6-v2
    ├── Dimensions: 384 (native)
    ├── Vectors: ~10,800
    └── Cost: FREE (unlimited)
```

### Search Flow

```
User Query
    ↓
Generate Embedding (OpenAI or HuggingFace)
    ↓
Vector Search in Pinecone (correct namespace)
    ↓
Retrieve Top 10 Products (relevance filtered)
    ↓
LLM Processing (Gemini or OpenAI)
    ↓
AI-Generated Response + Product Cards
```

---

## 💰 Cost Breakdown

### One-Time Setup
- OpenAI embeddings generation: **~$0.10**
- HuggingFace embeddings: **FREE**
- Pinecone storage: **FREE** (free tier)

### Per-Query Costs
| Component | OpenAI | HuggingFace |
|-----------|--------|-------------|
| **Embedding** | $0.0002/1K | FREE |
| **LLM (Gemini)** | FREE | FREE |
| **Total/1K queries** | ~$0.0002 | FREE |

**Example:** 10,000 searches/month = **$2/month** (OpenAI) or **$0** (HuggingFace)

---

## 🛠️ Troubleshooting

### "PINECONE_API_KEY not set"
The scripts automatically load from `frontend/.env.local`. Make sure that file exists.

### "0 products found"
1. Check that embeddings were uploaded: `python scripts/clear_pinecone.py` (shows current stats before deleting)
2. Verify you're using the correct embedding model in the UI
3. Make sure Pinecone index is named `concommerce-products`

### HuggingFace API errors
The app now uses the new `router.huggingface.co` endpoint. Restart your dev server if you see old API errors.

### Python package installation fails
You're probably using Python 3.14 which is too new. Install Python 3.12 instead.

---

## 📚 Documentation

- **[Scripts Documentation](scripts/README.md)** - Detailed guide for data pipeline
- **[Frontend Setup](docs/FRONTEND_SETUP.md)** - UI development guide
- **[Implementation Plan](docs/rag-implementation-plan.md)** - Architecture details

---

## 🔄 Rebuilding from Scratch

If you want to start fresh:

```bash
# 1. Clear Pinecone (deletes ALL vectors)
python scripts/clear_pinecone.py
# Type 'DELETE' when prompted

# 2. Rebuild everything
python scripts/setup.py
```

---

## 🌟 Key Features Explained

### Why Dual Embeddings?

1. **Flexibility** - Switch between paid (quality) and free (cost-effective)
2. **A/B Testing** - Compare search quality between models
3. **Development** - Use free HuggingFace for dev, OpenAI for production
4. **Cost Optimization** - Choose based on your budget

### Model Comparison

| Metric | OpenAI | HuggingFace |
|--------|--------|-------------|
| **Quality** | Excellent (95%+) | Very Good (90%+) |
| **Speed** | ~200ms | ~130ms (faster!) |
| **Cost** | $0.0002/1K | FREE |
| **Setup Cost** | $0.10 | $0 |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 & text-embedding-3-small
- **Google** - Gemini 2.5 Flash
- **HuggingFace** - Sentence Transformers
- **Pinecone** - Vector database
- **StarTech & Daraz** - Product data sources

---

## 📞 Support

Having issues? Check:

1. **Troubleshooting section** above
2. **[Scripts README](scripts/README.md)** for detailed setup
3. **Console logs** in browser and terminal
4. **Pinecone dashboard** to verify vectors uploaded

---

**Built with ❤️ using Next.js, Python, and AI**

Happy searching! 🚀
