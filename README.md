# Aussie OS

**Production-grade AI-powered browser-based operating system with advanced agent capabilities**

Version 2.2.1 | Built with React 19, TypeScript, Vite, and Google Gemini AI

---

## Features

### Core Capabilities
- **AI Agent Integration** - Powered by Google Gemini 3 Pro with real-time chat and Live audio mode
- **Virtual File System** - IndexedDB-backed persistent storage with full POSIX-like operations
- **Code Editor** - Monaco Editor integration with multi-language support and auto-save
- **Terminal** - Full bash-like shell with package management (APM)
- **Browser Automation** - Real browser control with screenshot capabilities
- **Cloud Deployment** - Real API integration with Render, Vercel, Netlify
- **Media Generation** - Veo3 video, Imagen4 images, procedural audio generation
- **Agent Swarm** - Multi-agent task coordination with consensus-based execution
- **Task Scheduler** - Cron-like scheduling for automated workflows
- **GitHub Integration** - Real GitHub API for repos, issues, PRs, commits

### Technical Highlights
- **Ultra-fast Performance** - React 19 with lazy loading and code splitting
- **Production Optimized** - Minified builds with tree-shaking and chunk splitting
- **Mobile Responsive** - Touch-optimized UI with drawer navigation
- **Secure** - Environment-based API key management, no hardcoded secrets
- **Scalable Storage** - IndexedDB with migration from localStorage

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm/bun
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Install dependencies
npm install
# or
bun install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### Development

```bash
# Start development server (with hot reload)
npm run dev

# Access at http://localhost:3000
```

### Production Build

```bash
# Type check
npm run lint

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Analyze bundle size
npm run build:analyze
```

---

## Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for deployment features)
RENDER_API_KEY=your_render_api_key
VERCEL_API_KEY=your_vercel_api_key
NETLIFY_API_KEY=your_netlify_api_key
REPLIT_API_KEY=your_replit_api_key

# Optional (for GitHub integration)
GITHUB_PAT=your_github_personal_access_token

# Optional (for browser automation screenshots)
BROWSERLESS_API_KEY=your_browserless_api_key
```

**Security Note:** Never commit `.env.local` to version control. API keys are injected at build time via Vite's `define` config.

---

## Architecture

### Technology Stack
- **Frontend:** React 19.2 with TypeScript 5.8
- **Build Tool:** Vite 6.2 with Terser minification
- **UI Framework:** Tailwind CSS 3 (CDN)
- **State Management:** React Hooks + Custom Services
- **Storage:** IndexedDB (primary), localStorage (fallback)
- **AI:** Google Generative AI SDK (@google/genai)
- **Code Editor:** Monaco Editor
- **Version Control:** isomorphic-git (in-browser Git)

### Service Layer

| Service | Purpose | Status |
|---------|---------|--------|
| `useAgent.ts` | Gemini AI chat & Live audio | ✅ Real API |
| `deployment.ts` | Multi-cloud deployment | ✅ Real APIs (Render/Vercel/Netlify) |
| `browserAutomation.ts` | Browser control | ✅ Real (iframe + Browserless.io) |
| `orchestrator.ts` | Media generation | ✅ Real (Veo3/Imagen4/Web Audio) |
| `github.ts` | GitHub integration | ✅ Real GitHub REST API |
| `fileSystem.ts` | Virtual FS | ✅ IndexedDB-backed |
| `swarm.ts` | Agent coordination | ✅ Real multi-agent execution |
| `scheduler.ts` | Task automation | ✅ Real cron-like scheduling |
| `shell.ts` | Command execution | ✅ Real bash-like interpreter |
| `config.ts` | API key management | ✅ Secure env-based config |

---

## Usage Guide

### 1. AI Chat & Commands
- **Text Chat:** Type messages in the chat panel
- **Voice Mode:** Click microphone icon for live audio interaction
- **Quick Actions:** Use suggested actions for common tasks
- **File Upload:** Attach images for multimodal understanding

### 2. Code Development
- **Open Files:** Navigate via file explorer or use `code <path>` command
- **Multi-Tab Editing:** Monaco editor with syntax highlighting
- **Auto-Save:** Changes persist to virtual file system
- **Terminal:** Run commands, execute scripts

### 3. Deployment
```bash
# Deploy to Render
deploy render https://github.com/user/repo

# Deploy to Vercel
deploy vercel https://github.com/user/repo

# Deploy to Netlify
deploy netlify https://github.com/user/repo
```

### 4. Media Generation
```bash
# Generate video
gemini-flow veo3 "A serene ocean sunset"

# Generate image
gemini-flow imagen4 "Cyberpunk cityscape at night"

# Generate audio
gemini-flow lyria "Upbeat electronic music"
```

### 5. Agent Swarm
```bash
# Execute task with multi-agent consensus
gemini-flow hive-mind spawn --objective "Calculate fibonacci(20)"

# Quantum swarm (5 agents)
gemini-flow hive-mind spawn --quantum --objective "Analyze code complexity"
```

---

## Performance Optimizations

### Implemented
✅ **Code Splitting** - React.lazy() for all major components
✅ **Chunk Optimization** - Manual chunks for vendors (react, monaco, ai)
✅ **Minification** - Terser with console/debugger removal
✅ **Tree Shaking** - Dead code elimination via Vite
✅ **IndexedDB Storage** - Scalable file system (replaces localStorage)
✅ **Lazy Loading** - Suspense boundaries for deferred component rendering
✅ **Asset Optimization** - Gzip/Brotli compression for production builds

---

## Mobile Support

Responsive design with:
- Touch-optimized controls
- Drawer-based navigation (< 768px)
- Bottom activity bar
- Full-screen chat overlay
- Safe area insets for notched devices

---

## Production Deployment

### Static Hosting (Recommended)
1. Build: `npm run build`
2. Upload `dist/` folder to:
   - **Vercel:** `vercel deploy dist`
   - **Netlify:** Drag & drop `dist/` folder
   - **GitHub Pages:** Push to `gh-pages` branch
   - **Cloudflare Pages:** Connect repository

### Environment Variables in Production
Most static hosts support injecting environment variables at build time:
- **Vercel:** Project Settings > Environment Variables
- **Netlify:** Site Settings > Build & Deploy > Environment
- **Cloudflare:** Settings > Environment Variables

---

## Troubleshooting

### "API Key Missing" Error
- Ensure `.env.local` exists with `GEMINI_API_KEY=...`
- Restart dev server after changing `.env.local`

### File System Not Persisting
- Check browser storage quota (Settings > Privacy > Site Data)
- IndexedDB may be disabled in private/incognito mode
- Run migration: IndexedDB service auto-migrates from localStorage

### Build Failures
```bash
# Clean build artifacts
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run lint
```

---

## License

MIT License

---

## Credits

- **Google Gemini AI** for powering intelligent agent capabilities
- **Monaco Editor** for VS Code-quality code editing
- **Tailwind CSS** for beautiful, responsive design
- **Vite** for lightning-fast builds and HMR

---

**Built with ❤️ by the Aussie OS team**
