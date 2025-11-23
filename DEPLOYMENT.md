# Vercel Deployment Guide

## Quick Deploy (Automatic - Recommended)

### Option 1: Deploy via Vercel Dashboard

1. **Go to Vercel:**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select `bencousins22/Agent-OS`
   - Click "Import"

3. **Configure Build Settings:**
   Vercel will auto-detect the settings from `vercel.json`, but verify:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   RENDER_API_KEY=your_render_key (optional)
   VERCEL_API_KEY=your_vercel_key (optional)
   NETLIFY_API_KEY=your_netlify_key (optional)
   GITHUB_PAT=your_github_token (optional)
   BROWSERLESS_API_KEY=your_browserless_key (optional)
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Your app will be live at: `https://agent-os-xxx.vercel.app`

---

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to project
cd "/home/bencousins/Downloads/aussie-os (10)"

# Deploy to production
vercel --prod

# Follow prompts to link to your GitHub repo
```

---

## Manual Deploy (One-Click)

Click the button below to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbencousins22%2FAgent-OS&env=GEMINI_API_KEY&envDescription=Required%20API%20keys%20for%20Aussie%20OS&envLink=https%3A%2F%2Fgithub.com%2Fbencousins22%2FAgent-OS%23environment-configuration)

---

## Configuration Details

### vercel.json
The `vercel.json` file configures:
- **Build Command:** Uses `npm run build` (TypeScript compilation + Vite build)
- **Output:** `dist/` folder
- **Rewrites:** SPA routing (all routes → index.html)
- **Headers:** Cache optimization for static assets (1 year)
- **Node Version:** 18

### Environment Variables

**Required:**
- `GEMINI_API_KEY` - Google Gemini API key (get from https://aistudio.google.com/app/apikey)

**Optional (for full features):**
- `RENDER_API_KEY` - Render.com deployment
- `VERCEL_API_KEY` - Programmatic Vercel deploys
- `NETLIFY_API_KEY` - Netlify deployment
- `GITHUB_PAT` - GitHub integration
- `BROWSERLESS_API_KEY` - Screenshot functionality

### Adding Environment Variables in Vercel:

1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - **Key:** Variable name (e.g., `GEMINI_API_KEY`)
   - **Value:** Your actual API key
   - **Environment:** Check "Production", "Preview", "Development"
4. Click "Save"
5. Redeploy if needed: Deployments → ⋯ → Redeploy

---

## Build Optimization

The project is pre-configured for optimal Vercel deployment:

✅ **Code Splitting** - Separate chunks for react, monaco, ai
✅ **Minification** - Terser with console removal
✅ **Tree Shaking** - Dead code elimination
✅ **Gzip Compression** - Automatic by Vercel
✅ **Edge Caching** - Static assets cached at edge locations
✅ **TypeScript** - Type-checked before build

### Build Output
```
dist/
├── index.html (3 KB)
└── assets/
    ├── react-vendor.[hash].js (~150 KB)
    ├── editor.[hash].js (~800 KB - Monaco)
    ├── ai.[hash].js (~100 KB)
    ├── markdown.[hash].js (~50 KB)
    └── index.[hash].js (~200 KB)
```

---

## Custom Domain

### Add Custom Domain:

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Add"
   - Enter your domain (e.g., `aussie-os.com`)

2. **Update DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers for full management

3. **SSL Certificate:**
   - Automatically provisioned by Vercel
   - HTTPS enabled by default

---

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to `main` branch** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull Requests** → Preview deployment with unique URL

### Disable Auto-Deploy (Optional):
```bash
# In Vercel dashboard:
Settings → Git → Auto-Deploy → Toggle Off
```

---

## Monitoring & Analytics

### Built-in Vercel Features:

1. **Analytics:**
   - Go to project → "Analytics"
   - View page views, visitors, top pages

2. **Speed Insights:**
   - Real User Monitoring (RUM)
   - Core Web Vitals tracking

3. **Logs:**
   - Runtime logs available in dashboard
   - Filter by deployment, time, severity

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module 'tailwindcss'"**
```bash
# Solution: Vercel should auto-install, but if not:
# Check package.json devDependencies includes tailwindcss
```

**Error: "Type errors"**
```bash
# Run locally first:
npm run lint
npm run build

# Fix TypeScript errors before pushing
```

### Environment Variables Not Working

1. Verify variables are set in Vercel dashboard
2. Check spelling matches code exactly
3. Redeploy after adding variables
4. Check browser console for errors

### API Key Errors

- Make sure `GEMINI_API_KEY` is set in Vercel dashboard
- Verify the key is valid at https://aistudio.google.com
- Check browser DevTools → Console for specific errors

---

## Performance Tips

1. **Enable Edge Caching:**
   - Vercel automatically caches static assets
   - Cache headers set in `vercel.json`

2. **Use Preview Deployments:**
   - Test changes before production
   - Each PR gets a unique preview URL

3. **Monitor Bundle Size:**
   ```bash
   npm run build:analyze
   # Check dist/ folder size
   ```

4. **Lighthouse Scores:**
   - Run Lighthouse in Chrome DevTools
   - Target: 90+ performance score

---

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured in Vercel
- [ ] `.env.local` NOT committed to GitHub (check `.gitignore`)
- [ ] Build passes locally: `npm run build`
- [ ] TypeScript checks pass: `npm run lint`
- [ ] API keys are valid and have proper permissions
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled in Vercel dashboard

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Aussie OS Issues:** https://github.com/bencousins22/Agent-OS/issues
- **Vercel Support:** https://vercel.com/support

---

**Your Aussie OS will be live in ~2 minutes after deployment!** 🚀
