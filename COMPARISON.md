# Static Site vs Python Backend: Feature Comparison

This document provides a detailed comparison between the static site version and the full Python backend version of Neuroglancer Tourguide.

## Overview

| Aspect | Static Site | Python Backend |
|--------|-------------|----------------|
| **Deployment** | Any static host | Requires Python server |
| **Setup Complexity** | Minimal | Moderate |
| **Cost** | Free or very low | Requires server |
| **AI Provider** | Cloud APIs only | Cloud + Local (Ollama) |
| **Data Access** | Public CORS data | Any data source |

## Detailed Comparison

### 🚀 Deployment & Hosting

#### Static Site ✅
- **Platforms**: GitHub Pages, Netlify, Vercel, S3, any web server
- **Setup Time**: < 5 minutes
- **Cost**: Free tier available on most platforms
- **Scaling**: Automatic (CDN)
- **Maintenance**: Minimal
- **HTTPS**: Automatic on most platforms
- **Custom Domain**: Easy to configure

#### Python Backend ⚠️
- **Platforms**: VPS, PaaS (Heroku, Railway), or self-hosted
- **Setup Time**: 30+ minutes
- **Cost**: $5-50/month depending on usage
- **Scaling**: Manual configuration required
- **Maintenance**: Regular updates, security patches
- **HTTPS**: Manual setup required
- **Custom Domain**: Requires DNS configuration

**Winner**: Static Site (for ease of deployment)

---

### 🤖 AI Integration

#### Static Site ⚠️
- **Providers**: Anthropic, OpenAI, Google
- **Configuration**: User provides API keys via UI
- **Storage**: Browser localStorage
- **Security**: Keys never leave user's browser
- **Local AI**: Not supported
- **Cost**: User pays for API calls

#### Python Backend ✅
- **Providers**: Anthropic, OpenAI, Google, Local (Ollama)
- **Configuration**: Environment variables (.env file)
- **Storage**: Server-side
- **Security**: Server manages keys
- **Local AI**: Full Ollama support
- **Cost**: Can be free with local models

**Winner**: Python Backend (more options, especially local AI)

---

### 📊 Data Sources

#### Static Site ⚠️
- **Neuroglancer Data**: Public S3/HTTPS with CORS
- **Organelle CSV**: Public URLs with CORS
- **Limitations**: Cannot access private data
- **Format**: Zarr, N5 (via public URLs)
- **Custom Data**: Must be publicly hosted

#### Python Backend ✅
- **Neuroglancer Data**: Any local or remote source
- **Organelle CSV**: Local files, databases, any source
- **Limitations**: None
- **Format**: Any format Python can read
- **Custom Data**: Full file system access

**Winner**: Python Backend (more flexibility)

---

### 🎥 Features

| Feature | Static Site | Python Backend |
|---------|-------------|----------------|
| Neuroglancer Viewer | ✅ (JS library) | ✅ (Python library) |
| Screenshot Capture | ✅ (client-side) | ✅ (server-side) |
| AI Narration | ✅ (cloud APIs) | ✅ (cloud + local) |
| State Tracking | ✅ | ✅ |
| Natural Language Query | ✅ (basic) | ✅ (full SQL) |
| Organelle Visualization | ✅ (CSV-based) | ✅ (database) |
| Data Analysis | ⚠️ (AI-explained) | ✅ (code execution) |
| Plot Generation | ❌ | ✅ |
| Video Recording | ❌ | ✅ |
| WebSocket Streaming | ❌ | ✅ |
| Voice Synthesis | ⚠️ (browser TTS) | ✅ (edge-tts) |
| Voice Cloning | ❌ | ✅ (Chatterbox) |
| Multiple Transitions | ❌ | ✅ |

**Winner**: Python Backend (more features)

---

### 💻 User Experience

#### Static Site ✅
- **Access**: Instant, works in browser
- **Installation**: None required
- **Updates**: Automatic (refresh page)
- **Offline**: Can be PWA-enabled
- **Speed**: Very fast (CDN)
- **Mobile**: Responsive, works on mobile
- **Sharing**: Easy (just share URL)

#### Python Backend ⚠️
- **Access**: Requires running server
- **Installation**: Python + dependencies
- **Updates**: Manual restart required
- **Offline**: Requires local setup
- **Speed**: Depends on server
- **Mobile**: Works but needs server access
- **Sharing**: Complex (share server URL)

**Winner**: Static Site (better UX for end users)

---

### 🔒 Security

#### Static Site ✅
- **API Keys**: User-managed, stored in browser
- **Data**: No server-side storage
- **HTTPS**: Standard
- **CORS**: Required for data sources
- **Attack Surface**: Minimal
- **Updates**: Immediate (CDN cache)

#### Python Backend ⚠️
- **API Keys**: Server-managed, in .env
- **Data**: Server-side storage
- **HTTPS**: Manual configuration
- **CORS**: Not required
- **Attack Surface**: Larger (server + dependencies)
- **Updates**: Manual deployment

**Winner**: Tie (different security models)

---

### 🛠️ Development

#### Static Site ✅
- **Languages**: HTML, CSS, JavaScript
- **Build**: None required
- **Testing**: Simple (open in browser)
- **Debugging**: Browser dev tools
- **Dependencies**: Neuroglancer JS CDN
- **Hot Reload**: Instant (F5)
- **Version Control**: Simple

#### Python Backend ⚠️
- **Languages**: Python, JavaScript, HTML, CSS
- **Build**: Package installation
- **Testing**: Requires running server
- **Debugging**: Python + browser tools
- **Dependencies**: Many (pip + npm)
- **Hot Reload**: uvicorn --reload
- **Version Control**: More complex

**Winner**: Static Site (simpler development)

---

### 💰 Cost Analysis

#### Static Site (Monthly)
- **Hosting**: $0 (GitHub Pages, Netlify free tier)
- **CDN**: $0 (included)
- **SSL**: $0 (automatic)
- **AI API**: $0.001-0.10 per narration (user pays)
- **Total**: ~$0-5/month (depending on AI usage)

#### Python Backend (Monthly)
- **Hosting**: $5-50 (VPS, PaaS)
- **CDN**: $0-10 (optional)
- **SSL**: $0 (Let's Encrypt) or $10-50 (commercial)
- **AI API**: $0 (Ollama) or $10-100 (cloud)
- **Total**: ~$5-100/month

**Winner**: Static Site (much lower cost)

---

## Use Case Recommendations

### Choose Static Site When:

✅ You want quick deployment  
✅ You have limited budget  
✅ Users can use cloud AI APIs  
✅ Data sources are public  
✅ Basic features are sufficient  
✅ You want minimal maintenance  
✅ You're sharing with non-technical users  
✅ You want instant access  

### Choose Python Backend When:

✅ You need local AI (Ollama)  
✅ You need private data access  
✅ You need video recording  
✅ You need code execution for analysis  
✅ You need advanced query features  
✅ You need custom data pipelines  
✅ You have server infrastructure  
✅ You need WebSocket features  

---

## Migration Path

### Static → Backend

If you start with static and need more features:

1. Keep static site for public access
2. Deploy backend for advanced features
3. Use backend for development/analysis
4. Use static for production/sharing

### Backend → Static

If you have backend and want to simplify:

1. Export organelle data to public CSVs
2. Configure static site with CSV URLs
3. Migrate users to client-side API keys
4. Deploy static site
5. Deprecate backend

---

## Hybrid Approach

Best of both worlds:

1. **Static site** for public access and demos
2. **Python backend** for development and analysis
3. **Share static site URL** with collaborators
4. **Use backend locally** for advanced work

Example workflow:
```
Developer: Uses Python backend for full features
↓ Generates public CSV data
↓ Deploys static site
↓
End Users: Access static site with AI narration
```

---

## Performance Comparison

| Metric | Static Site | Python Backend |
|--------|-------------|----------------|
| Initial Load | ~1-2s | ~2-4s |
| Screenshot Capture | <100ms | ~500ms |
| AI Narration | 1-5s | 1-5s (cloud) / 5-15s (local) |
| Query Response | 1-3s | 0.5-2s |
| Data Loading | Instant (CDN) | Depends on server |

---

## Conclusion

### Best Overall: It Depends!

- **For most users**: Static Site (easier, cheaper, faster to deploy)
- **For researchers**: Python Backend (more features, local AI, private data)
- **For production**: Static Site (scalable, low maintenance)
- **For development**: Python Backend (full-featured, flexible)

### Recommendation

Start with **Static Site** for:
- Public demos
- Sharing with collaborators
- Teaching/presentations

Upgrade to **Python Backend** when you need:
- Local AI models
- Private data analysis
- Video recording
- Advanced features

### Future Development

Ideally, maintain both:
- Static site for broad accessibility
- Python backend for power users
- Both sharing the same UI design
- Clear migration path between them
