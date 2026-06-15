# Project Summary: Cryptocurrencies  

## 1. Project Overview  
- **Name**: Cryptocurrencies  
- **Type**: Vue.js Web Application with Supabase Backend  
- **Purpose**: A cryptocurrency-related application with rich text editing, authentication, and data visualization capabilities.  
- **Tech Stack**:  
  - **Frontend**: Vue 3, Vue Router, Tiptap (rich text editor), Bootstrap  
  - **Backend**: Supabase (PostgreSQL, Auth, Storage)  
  - **Build Tool**: Vite  
  - **Other**: Bcrypt.js (password hashing), Lightweight Charts (data visualization)  

## 2. File Structure  
```  
d:\Cryptocurrencies  
├── .env.example # Environment variables template  
├── .gitignore # Git ignore rules  
├── index.html # Entry point  
├── package.json # Project metadata and dependencies  
├── public/ # Static assets  
│   ├── favicon.svg  
│   ├── hero.jpg  
│   ├── icons.svg  
│   └── site-logo.png  
├── src/ # Source code  
│   ├── App.vue # Main Vue component  
│   ├── main.js # Entry point for Vue app  
│   ├── assets/ # Static assets  
│   ├── components/ # Reusable Vue components  
│   ├── composables/ # Vue composables  
│   ├── data/ # Data models/services  
│   ├── router/ # Vue Router configuration  
│   ├── services/ # API/services for Supabase  
│   ├── utils/ # Utility functions  
│   ├── supabase/ # Supabase configuration  
│   │   ├── complete_schema.sql # Full database schema  
│   │   ├── rag_setup.sql # RAG (Retrieval-Augmented Generation) setup  
│   │   ├── supabase.js # Supabase client initialization  
│   │   └── functions/ # Serverless functions  
│   │       └── chat/index.ts # Chat functionality  
│   ├── vite.config.js # Vite configuration  
│   └── README.md # Project documentation  
```  

## 3. Key Dependencies  
- **Supabase**: `@supabase/supabase-js` (v2.106.1) for database, auth, and storage  
- **Tiptap**: `@tiptap/extension-*` (v3.26.0) for rich text editing  
- **Vue**: `@tiptap/vue-3` (v3.26.0) for Vue integration  
- **Authentication**: `bcryptjs` for password hashing  
- **Data Visualization**: `lightweight-charts` for charting  

## 4. Supabase Integration  
- **Database**: `complete_schema.sql` defines the full database structure  
- **RAG Setup**: `rag_setup.sql` configures vector search for AI-powered search  
- **Client**: `supabase.js` initializes the Supabase client with environment variables  
- **Functions**: `chat/index.ts` implements serverless chat functionality  

## 5. Development Setup  
- **Build Scripts**:  
  - `npm run dev`: Start development server  
  - `npm run build`: Build production-ready app  
  - `npm run preview`: Preview production build locally  
- **Environment Variables**: Configured via `.env` (not shown in current files)  

## 6. Notable Features  
- **Rich Text Editor**: Tiptap-based editor with image/link/placeholder support  
- **Authentication**: Secure user authentication with bcrypt  
- **Data Visualization**: Lightweight Charts for cryptocurrency price tracking  
- **Serverless Functions**: Supabase functions for backend logic (e.g., chat)  

## 7. Component Breakdown  
### **Components**  
- **AiAssistant.vue**:  
  - Chat interface powered by Gemini and live prices.  
  - Integrates with `livePrices` service and Supabase functions.  
  - Displays user messages, assistant responses, and sources.  
- **BinanceSparkline.vue**:  
  - Displays Binance price data using Sparkline charts.  
- **CoinCard.vue**:  
  - Displays cryptocurrency details (price, market cap, etc.).  
- **CoinDashboard.vue**:  
  - Overview of market data and trends.  
- **CoinTable.vue**:  
  - Table view of cryptocurrency listings.  
- **EmptyState.vue**:  
  - UI for empty states (e.g., no data).  
- **FavoriteButton.vue**:  
  - Toggle for favoriting coins.  
- **Footer.vue**:  
  - Footer section with links and copyright.  
- **HeroSection.vue**:  
  - Hero section with headline and call-to-action.  
- **LiveBadge.vue**:  
  - Displays live price updates.  
- **LoadingSpinner.vue**:  
  - Loading indicator for async operations.  
- **MarketOverviewCards.vue**:  
  - Cards for market statistics (e.g., total volume, market cap).  
- **Navbar.vue**:  
  - Navigation bar with links and user profile.  
- **NewsLikeButton.vue**:  
  - Button to like news articles.  
- **Pagination.vue**:  
  - Pagination controls for lists.  
- **PriceWithArrow.vue**:  
  - Displays price with up/down arrow.  
- **RichTextEditor.vue**:  
  - Custom rich text editor using Tiptap.  
- **SearchBar.vue**:  
  - Search functionality for coins and news.  
- **SortSelect.vue**:  
  - Dropdown for sorting data (e.g., by price, market cap).  
- **StatCard.vue**:  
  - Displays key statistics (e.g., 24h change).  
- **ThemeToggle.vue**:  
  - Toggle for light/dark theme.  
- **VoteButtons.vue**:  
  - Buttons for voting on content.  

### **Composables**  
- **useAdmin.js**:  
  - Manages admin-specific logic (e.g., permissions).  
- **useAuth.js**:  
  - Handles user authentication (login, register, profile).  
- **useComments.js**:  
  - Manages comments for news articles.  
- **useLivePrices.js**:  
  - Fetches live cryptocurrency prices.  
- **useReactions.js**:  
  - Manages reactions (e.g., likes, dislikes).  
- **useTheme.js**:  
  - Manages theme state (light/dark).  
- **useWatchlist.js**:  
  - Manages user watchlist of coins.  

### **Services**  
- **api.js**:  
  - General API calls to Supabase.  
- **binance.js**:  
  - Fetches data from Binance API.  
- **coingecko.js**:  
  - Fetches data from CoinGecko API.  
- **livePrices.js**:  
  - Retrieves live price data for cryptocurrencies.  
- **news.js**:  
  - Fetches and manages news articles.  
- **websocket.js**:  
  - Handles real-time updates via WebSocket.  

## 8. Supabase Functions  
- **chat/index.ts**:  
  - Serverless function for chat interactions.  
  - Accepts user queries, live prices, and user role.  
  - Returns AI-generated responses with sources.  

## 9. Development Workflow  
- **Initialization**:  
  - `npm install` to install dependencies.  
- **Development**:  
  - `npm run dev` for local development.  
- **Production**:  
  - `npm run build` for production build.  

## 10. Next Steps  
- [ ] Review `.env.example` for required environment variables.  
- [ ] Examine `supabase/complete_schema.sql` for database structure.  
- [ ] Analyze `src/services/` for API implementations.  
- [ ] Explore `src/components/` for UI components.  
- [ ] Test Supabase functions (e.g., `chat/index.ts`).  
- [ ] Verify Supabase RAG setup for AI search.  

## 11. Additional Notes  
- **Theme Management**:  
  - `useTheme.js` initializes the theme and applies it globally.  
- **Permissions**:  
  - `togglePerm` function in `main.js` controls UI elements based on user role.  
- **Real-Time Updates**:  
  - WebSocket integration for live price updates.  
- **Error Handling**:  
  - Error messages are displayed in the chat interface.  

This summary provides a comprehensive overview of the project's structure, dependencies, components, and functionality. It is designed to help AI systems understand the codebase and its purpose.