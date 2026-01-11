import { Product, DemoConversation } from './types'

// Demo product data from StarTech and Daraz
export const demoProducts: Product[] = [
  {
    id: '1',
    name: 'AMD Ryzen 5 7500F Gaming PC',
    price_min: 93900,
    price_max: 97500,
    brand: 'AMD',
    category: 'Desktop > Star PC > Ryzen PC',
    source: 'StarTech',
    url: 'https://www.startech.com.bd/amd-ryzen-5-7500f-gaming-pc',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzNCODJGNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+QU1EIFJ5emVuIDU8L3RleHQ+PC9zdmc+',
    specs: {
      processor: 'AMD Ryzen 5 7500F',
      ram: '16GB DDR5',
      storage: '512GB NVMe SSD',
      graphics: 'RTX 3050 8GB',
    },
    warranty: '3 Years Warranty',
    availability: 'In Stock',
    rating: 4.8,
    reviews_count: 127,
  },
  {
    id: '2',
    name: 'Intel Core i5 13th Gen Gaming PC',
    price_min: 89500,
    price_max: 92000,
    brand: 'Intel',
    category: 'Desktop > Brand PC > Gaming',
    source: 'StarTech',
    url: 'https://www.startech.com.bd/intel-i5-13th-gen-gaming-pc',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzAwNzFDNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+SW50ZWwgaTU8L3RleHQ+PC9zdmc+',
    specs: {
      processor: 'Intel Core i5-13400F',
      ram: '16GB DDR4',
      storage: '500GB NVMe SSD',
      graphics: 'GTX 1660 Super 6GB',
    },
    warranty: '2 Years Warranty',
    availability: 'In Stock',
    rating: 4.6,
    reviews_count: 98,
  },
  {
    id: '3',
    name: 'AMD Ryzen 7 7700X Desktop PC',
    price_min: 125000,
    price_max: 130000,
    brand: 'AMD',
    category: 'Desktop > Star PC > Ryzen PC',
    source: 'Daraz',
    url: 'https://www.daraz.com.bd/amd-ryzen-7-7700x-pc',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI0VEODkzNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+QU1EIFJ5emVuIDc8L3RleHQ+PC9zdmc+',
    specs: {
      processor: 'AMD Ryzen 7 7700X',
      ram: '32GB DDR5',
      storage: '1TB NVMe SSD',
      graphics: 'RTX 4060 Ti 8GB',
    },
    warranty: '3 Years Warranty',
    availability: 'Limited Stock',
    rating: 4.9,
    reviews_count: 56,
  },
  {
    id: '4',
    name: 'Asus TUF Gaming Laptop F15',
    price_min: 68900,
    price_max: 72000,
    brand: 'Asus',
    category: 'Laptop > Gaming Laptop',
    source: 'StarTech',
    url: 'https://www.startech.com.bd/asus-tuf-gaming-f15',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzFBMUExQSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+QXN1cyBUVUY8L3RleHQ+PC9zdmc+',
    specs: {
      processor: 'Intel Core i5-11400H',
      ram: '8GB DDR4',
      storage: '512GB NVMe SSD',
      graphics: 'GTX 1650 4GB',
    },
    warranty: '2 Years International Warranty',
    availability: 'In Stock',
    rating: 4.5,
    reviews_count: 203,
  },
  {
    id: '5',
    name: 'HP Victus 15 Gaming Laptop',
    price_min: 65000,
    price_max: 69500,
    brand: 'HP',
    category: 'Laptop > Gaming Laptop',
    source: 'Daraz',
    url: 'https://www.daraz.com.bd/hp-victus-15',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzAwOTZENiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+SFAgVmljdHVzPC90ZXh0Pjwvc3ZnPg==',
    specs: {
      processor: 'Intel Core i5-12450H',
      ram: '8GB DDR4',
      storage: '512GB NVMe SSD',
      graphics: 'GTX 1650 4GB',
    },
    warranty: '2 Years Warranty',
    availability: 'In Stock',
    rating: 4.4,
    reviews_count: 145,
  },
]

// Demo conversations with pre-loaded responses
export const demoConversations: DemoConversation[] = [
  {
    query: 'Show me AMD Ryzen 5 gaming PCs under 100k',
    response: `I found some great AMD Ryzen 5 gaming PCs under 100,000৳ for you. Here are the top options:

**Best Value Pick: AMD Ryzen 5 7500F Gaming PC**
- **Price:** 93,900৳ (discounted from 97,500৳)
- **Processor:** AMD Ryzen 5 7500F (6-core, 12-thread)
- **Memory:** 16GB DDR5 RAM
- **Storage:** 512GB NVMe SSD
- **Graphics:** RTX 3050 8GB
- **Warranty:** 3 Years
- **Source:** StarTech
- **Rating:** ⭐ 4.8/5 (127 reviews)

This is an excellent choice for 1080p gaming with modern DDR5 support and a capable RTX 3050 GPU. The 7500F offers great gaming performance at this price point.

**Key Highlights:**
✅ Latest AM5 platform with upgrade path to Ryzen 9
✅ RTX 3050 supports DLSS 2.0 for better FPS
✅ Fast DDR5 memory for future-proofing
✅ 3-year warranty vs standard 2 years
✅ Highly rated by users (4.8/5)

**Gaming Performance Estimate:**
- Valorant/CS2: 200+ FPS (High settings)
- GTA V: 80-100 FPS (Very High settings)
- Cyberpunk 2077: 45-55 FPS (Medium settings with DLSS)
- Call of Duty: 70-85 FPS (High settings)

**Recommendation:** This is the best AMD Ryzen 5 option under 100k. The combination of latest-gen CPU, DDR5, and RTX 3050 makes it great value for money!`,
    products: [demoProducts[0]],
  },
  {
    query: 'Compare AMD vs Intel for gaming under 100k',
    response: `Great question! Let me compare AMD and Intel gaming options under 100,000৳:

## Head-to-Head Comparison

| Feature | AMD Ryzen 5 7500F | Intel Core i5-13400F |
|---------|-------------------|----------------------|
| **Price** | 93,900৳ | 89,500৳ |
| **Cores/Threads** | 6C/12T | 10C/16T (6P+4E) |
| **Architecture** | Zen 4 (2022) | Raptor Lake (2023) |
| **Memory** | DDR5 | DDR4 |
| **GPU** | RTX 3050 8GB | GTX 1660 Super 6GB |
| **Storage** | 512GB NVMe | 500GB NVMe |
| **Warranty** | 3 Years | 2 Years |
| **Rating** | ⭐ 4.8/5 | ⭐ 4.6/5 |

### AMD Ryzen 5 7500F (93,900৳)

✅ **Pros:**
- Latest AM5 platform with DDR5 support
- Better upgrade path (can upgrade to Ryzen 7/9)
- More efficient (65W TDP vs 154W)
- **Better RTX 3050 GPU for gaming**
- 3 years warranty
- Newer Zen 4 architecture
- Higher user rating

❌ **Cons:**
- Slightly more expensive (+4,400৳)
- Fewer cores (6C vs 10C)

### Intel Core i5-13400F (89,500৳)

✅ **Pros:**
- More cores (10-core: 6P + 4E)
- Better multi-threaded performance
- **Lower price** (saves 4,400৳)
- Proven Raptor Lake platform

❌ **Cons:**
- Older DDR4 RAM (no upgrade path)
- **Weaker GTX 1660 Super GPU**
- Limited future upgrade options
- Only 2 years warranty
- Higher power consumption

## Gaming Performance Comparison

**1080p AAA Games:**
- AMD: **~60 FPS** (RTX 3050 advantage)
- Intel: ~50 FPS

**Esports (Valorant, CS2):**
- Both: **200+ FPS** (both excellent)

**Productivity/Streaming:**
- Intel: Better (more cores)
- AMD: Good enough for casual use

## My Recommendation

### Choose AMD Ryzen 5 7500F if:
✅ Gaming is your **primary use**
✅ You want **future-proof DDR5**
✅ You play modern AAA titles
✅ You value longer warranty
✅ You want better upgrade options

### Choose Intel i5-13400F if:
✅ You need to **save money** (~4,400৳)
✅ You do **heavy multitasking**
✅ You mainly play esports titles
✅ You do content creation/streaming
✅ You don't care about future upgrades

## Final Verdict

**🏆 Winner for Gaming: AMD Ryzen 5 7500F**

The RTX 3050 gives you 15-20% better FPS in modern games, DDR5 future-proofs your build, and the longer warranty adds peace of mind. The 4,400৳ price difference is worth it for better gaming performance!`,
    products: [demoProducts[0], demoProducts[1]],
  },
  {
    query: "What's the best gaming PC if I can stretch to 130k?",
    response: `If you can stretch your budget to 130,000৳, I **highly recommend** the AMD Ryzen 7 7700X Desktop PC! Here's why:

## AMD Ryzen 7 7700X Gaming PC - 125,000৳

**🔥 Massive Performance Upgrade from 100k Options**

### Core Specifications
- **CPU:** AMD Ryzen 7 7700X (8-core, 16-thread) - **33% more cores than Ryzen 5**
- **GPU:** RTX 4060 Ti 8GB - **60% faster** than RTX 3050!
- **RAM:** 32GB DDR5 - **Double the memory**
- **Storage:** 1TB NVMe SSD - **Double the storage**
- **Warranty:** 3 Years
- **Rating:** ⭐ 4.9/5 (56 reviews) - **Highest rated!**

### Gaming Performance (1440p)
- **Cyberpunk 2077:** 75-85 FPS (High + Ray Tracing)
- **Red Dead Redemption 2:** 80-90 FPS (Ultra settings)
- **Call of Duty MW3:** 120-140 FPS (High settings)
- **Valorant/CS2:** 300+ FPS (Competitive settings)
- **Fortnite:** 120+ FPS (Epic settings with ray tracing)

### 4K Gaming Capability
- Medium-High settings: 50-60 FPS in most AAA games
- With DLSS 3: 70-80 FPS
- Esports: 100+ FPS easily

## Comparison vs 100k Options

| Feature | Ryzen 5 (94k) | **Ryzen 7 (125k)** | Improvement |
|---------|---------------|-------------------|-------------|
| **CPU Cores** | 6-core | **8-core** | +33% cores |
| **GPU** | RTX 3050 | **RTX 4060 Ti** | +60% faster |
| **RAM** | 16GB | **32GB** | 2x more |
| **Storage** | 512GB | **1TB** | 2x more |
| **1080p FPS** | ~60 FPS | **~100 FPS** | +67% |
| **1440p FPS** | ~45 FPS | **~85 FPS** | +89% |
| **Ray Tracing** | Basic | **Excellent** | DLSS 3 support |

## Is the 31,000৳ Extra Worth It?

### Absolutely YES if you want:

✅ **1440p Gaming** - The sweet spot for modern gaming
✅ **Future-Proofing** - RTX 4060 Ti will stay relevant for 4-5 years
✅ **Content Creation** - 32GB RAM is perfect for video editing, 3D work
✅ **Multitasking** - Stream while gaming without performance loss
✅ **Ray Tracing** - Enjoy modern graphics features at playable FPS
✅ **Longer Lifespan** - Won't need upgrade for much longer

### Cost Per Performance
- **Ryzen 5:** 94k ÷ 60 FPS = **1,567৳ per FPS**
- **Ryzen 7:** 125k ÷ 100 FPS = **1,250৳ per FPS**

**You get better value per taka at the higher budget!**

## What You Get for the Extra Money

**+31,000৳ investment gives you:**
- 2 extra CPU cores (+8 threads)
- **60% faster GPU** (game-changer!)
- +16GB RAM
- +500GB storage
- Better cooling (handles higher performance)
- Premium motherboard
- Source: Daraz (sometimes has flash sales!)

## My Verdict

**🏆 Best Overall Value: AMD Ryzen 7 7700X at 125k**

This PC hits the **perfect sweet spot** where you get:
- True 1440p gaming capability
- Excellent 1080p performance (100+ FPS)
- Professional-grade multitasking
- Room to grow for years

**Skip the 100k builds if you can afford this.** The performance jump is substantial and you won't regret the investment!

**Pro Tip:** Check Daraz during flash sales - I've seen this drop to 120k! 🎉`,
    products: [demoProducts[2]],
  },
  {
    query: 'Find gaming laptops with best warranty under 70k',
    response: `I found excellent gaming laptops under 70,000৳ with solid warranty coverage:

## Top Picks with Best Warranty

### 1. Asus TUF Gaming F15 - 68,900৳ ⭐ **Best Warranty**

**Why This is the Winner:**
- **Warranty:** 2 Years **International Warranty** (works globally!)
- **Build Quality:** Military-grade MIL-STD-810H durability
- **Rating:** ⭐ 4.5/5 (203 reviews) - **Most reviewed**

**Specifications:**
- Processor: Intel Core i5-11400H (6-core)
- RAM: 8GB DDR4 (upgradeable to 32GB)
- Storage: 512GB NVMe SSD
- GPU: GTX 1650 4GB
- Display: 15.6" FHD 144Hz
- Source: StarTech

**Gaming Performance:**
- Valorant: 180+ FPS
- GTA V: 70-80 FPS (High)
- Fortnite: 80-90 FPS (Medium-High)
- CS2: 120-140 FPS

**Warranty Highlights:**
✅ 2 years international coverage
✅ Works in any country
✅ Asus service centers nationwide
✅ Strong build reduces failure risk

---

### 2. HP Victus 15 - 65,000৳ 💰 **Best Value**

**Price Advantage:**
- **3,900৳ cheaper** than Asus
- **Warranty:** 2 Years local warranty
- **Rating:** ⭐ 4.4/5 (145 reviews)

**Specifications:**
- Processor: Intel Core i5-12450H (newer 12th gen!)
- RAM: 8GB DDR4 (upgradeable)
- Storage: 512GB NVMe SSD
- GPU: GTX 1650 4GB
- Display: 15.6" FHD 144Hz
- Source: Daraz

**Gaming Performance:**
- Similar to Asus (same GPU)
- Slightly better CPU (newer generation)

**Warranty Comparison:**
✅ 2 years coverage
❌ Local warranty only (BD)
✅ HP authorized service centers
⚠️ Not international coverage

---

## Head-to-Head Comparison

| Feature | Asus TUF F15 | HP Victus 15 |
|---------|-------------|--------------|
| **Price** | 68,900৳ | **65,000৳** (-3,900৳) |
| **Warranty** | **2Y International** | 2Y Local |
| **CPU** | i5-11400H | **i5-12450H** (newer) |
| **GPU** | GTX 1650 | GTX 1650 |
| **Build** | **Military-grade** | Standard gaming |
| **Reviews** | **203 reviews** | 145 reviews |
| **Rating** | 4.5/5 | 4.4/5 |
| **Source** | StarTech | Daraz |

## My Recommendation

### Choose Asus TUF Gaming F15 if:
✅ You want **international warranty** (travel/study abroad)
✅ You prioritize **build quality** & durability
✅ You want **proven reliability** (203 positive reviews)
✅ You trust StarTech service
✅ You don't mind paying 3,900৳ extra

### Choose HP Victus 15 if:
✅ You want to **save money** (3,900৳)
✅ You prefer **newer processor** (12th gen)
✅ Local warranty is enough
✅ You like Daraz deals/offers

## Winner: 🏆 Asus TUF Gaming F15

**Why?**
The **international warranty** is a game-changer if you:
- Travel frequently
- Plan to study/work abroad
- Want global support coverage

The military-grade build means it'll last longer, and 203 reviews show it's battle-tested. Worth the extra 3,900৳ for peace of mind!

**Pro Tip:** StarTech often has EMI options - you can pay in installments! 💳`,
    products: [demoProducts[3], demoProducts[4]],
  },
]

// Helper function to get demo response
export function getDemoResponse(query: string): DemoConversation | null {
  const normalized = query.toLowerCase().trim()
  return demoConversations.find(
    convo => convo.query.toLowerCase() === normalized
  ) || null
}

// Suggested questions for users
export const suggestedQuestions = [
  'Show me AMD Ryzen 5 gaming PCs under 100k',
  'Compare AMD vs Intel for gaming under 100k',
  "What's the best gaming PC if I can stretch to 130k?",
  'Find gaming laptops with best warranty under 70k',
  'Compare RTX 3050 vs GTX 1660 Super for 1080p gaming',
]
