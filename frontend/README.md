# ConCommerce Frontend

AI-powered product comparison chatbot for StarTech and Daraz products.

## Features

- **Chat Interface**: Natural language product queries
- **Product Cards**: Visual product information with images, specs, and prices
- **Demo Mode**: Pre-loaded conversations to showcase functionality
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Typing Indicator**: Shows when AI is thinking
- **Suggested Questions**: Quick-start questions for users

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Hooks (useState, useEffect)
- **Images**: Next.js Image Optimization

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main chat interface
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── chat-message.tsx    # Message bubble component
│   ├── product-card.tsx    # Product display card
│   ├── typing-indicator.tsx # Typing animation
│   └── suggested-questions.tsx # Quick question buttons
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   └── demo-data.ts        # Demo products & conversations
├── public/                 # Static assets
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.ts         # Next.js configuration
```

## Demo Data

The frontend includes 5 demo products and 4 pre-loaded conversations:

1. "Show me AMD Ryzen 5 gaming PCs under 100k"
2. "Compare AMD vs Intel for gaming under 100k"
3. "What's the best gaming PC if I can stretch to 130k?"
4. "Find gaming laptops with best warranty under 70k"

Try these questions to see the full demo functionality!

## Customization

### Adding More Demo Products

Edit `lib/demo-data.ts`:

```typescript
export const demoProducts: Product[] = [
  {
    id: 'unique-id',
    name: 'Product Name',
    price_min: 50000,
    price_max: 55000,
    // ... other fields
  },
]
```

### Adding More Demo Conversations

Edit `lib/demo-data.ts`:

```typescript
export const demoConversations: DemoConversation[] = [
  {
    query: 'Your question here',
    response: 'AI response here...',
    products: [demoProducts[0]], // Optional
  },
]
```

## Next Steps: Backend Integration

To connect this frontend to a real RAG pipeline:

1. **Create API Route**: `app/api/chat/route.ts`
2. **Install Dependencies**:
   ```bash
   npm install ai openai @pinecone-database/pinecone
   ```
3. **Replace Demo Logic**: In `app/page.tsx`, replace `getDemoResponse()` with API call
4. **Environment Variables**: Create `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   PINECONE_API_KEY=...
   ```

See `docs/rag-implementation-plan.md` for full backend implementation guide.

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Other Platforms

- **Netlify**: Connect GitHub repo
- **Railway**: Deploy from Git
- **Docker**: Build and deploy container

## Contributing

This is a demo project. For production use, implement:

- [ ] Backend API integration
- [ ] Real-time streaming responses
- [ ] User authentication
- [ ] Product database
- [ ] Vector search with RAG pipeline

## License

MIT
