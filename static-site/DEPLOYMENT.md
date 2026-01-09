# Deployment Guide for Neuroglancer Tourguide Static Site

This guide provides step-by-step instructions for deploying the static site to various hosting platforms.

## Prerequisites

- All files in the `static-site/` directory
- (Optional) A custom domain
- (Optional) API keys for AI narration features

## Deployment Options

### 1. GitHub Pages (Recommended for Personal Projects)

**Advantages**: Free, automatic HTTPS, easy version control

**Steps**:

1. **Prepare Repository**:
```bash
# Ensure your code is in a GitHub repository
git add static-site/
git commit -m "Add static site"
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/static-site`
   - Click Save

3. **Access Your Site**:
   - URL: `https://yourusername.github.io/tourguide/`
   - May take a few minutes to deploy

4. **Custom Domain** (Optional):
   - Add a CNAME record pointing to `yourusername.github.io`
   - Add custom domain in Pages settings
   - Enable HTTPS enforcement

### 2. Netlify (Recommended for Production)

**Advantages**: Continuous deployment, instant cache invalidation, form handling, redirects

**Steps**:

1. **Via Netlify Drop**:
   - Go to [netlify.com/drop](https://app.netlify.com/drop)
   - Drag and drop the `static-site/` folder
   - Site deploys immediately with generated URL

2. **Via Git Integration**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy from static-site directory
   cd static-site
   netlify deploy --prod
   ```

3. **Via Netlify Dashboard**:
   - New site from Git → Connect repository
   - Build settings:
     - Base directory: `static-site`
     - Build command: (leave empty)
     - Publish directory: `.` (current directory)
   - Deploy site

4. **Configuration** (`netlify.toml`):
   ```toml
   [build]
     publish = "static-site"
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       X-Content-Type-Options = "nosniff"
   ```

### 3. Vercel (Great for Next.js Integration)

**Advantages**: Edge network, serverless functions, analytics

**Steps**:

1. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   cd static-site
   vercel deploy --prod
   ```

2. **Via Vercel Dashboard**:
   - Import Git repository
   - Root directory: `static-site`
   - Framework preset: Other
   - Build command: (leave empty)
   - Output directory: `.`
   - Deploy

3. **Configuration** (`vercel.json`):
   ```json
   {
     "cleanUrls": true,
     "trailingSlash": false,
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           }
         ]
       }
     ]
   }
   ```

### 4. Amazon S3 + CloudFront

**Advantages**: Highly scalable, low cost, CDN included with CloudFront

**Steps**:

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. **Configure Static Website Hosting**:
   ```bash
   aws s3 website s3://your-bucket-name \
     --index-document index.html \
     --error-document index.html
   ```

3. **Upload Files**:
   ```bash
   cd static-site
   aws s3 sync . s3://your-bucket-name \
     --acl public-read \
     --exclude ".git/*"
   ```

4. **Create CloudFront Distribution**:
   - Origin: your S3 bucket website endpoint
   - Enable HTTPS
   - Set default root object: `index.html`
   - Create distribution

5. **CORS Configuration** (if using custom data):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### 5. Google Cloud Storage + Load Balancer

**Advantages**: Google infrastructure, serverless

**Steps**:

1. **Create Bucket**:
   ```bash
   gsutil mb gs://your-bucket-name
   ```

2. **Configure Website**:
   ```bash
   gsutil web set -m index.html -e index.html gs://your-bucket-name
   ```

3. **Upload Files**:
   ```bash
   cd static-site
   gsutil -m rsync -r . gs://your-bucket-name
   ```

4. **Make Public**:
   ```bash
   gsutil iam ch allUsers:objectViewer gs://your-bucket-name
   ```

5. **Setup Load Balancer** (for HTTPS):
   - Create load balancer
   - Backend: your bucket
   - Frontend: HTTPS with certificate
   - Done

### 6. Firebase Hosting

**Advantages**: Free SSL, global CDN, easy deployment

**Steps**:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize**:
   ```bash
   cd static-site
   firebase login
   firebase init hosting
   ```

3. **Configure** (`firebase.json`):
   ```json
   {
     "hosting": {
       "public": ".",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

4. **Deploy**:
   ```bash
   firebase deploy
   ```

### 7. Cloudflare Pages

**Advantages**: Fast global network, automatic optimizations

**Steps**:

1. **Via Dashboard**:
   - Connect Git repository
   - Build settings:
     - Build command: (none)
     - Build output directory: `static-site`
   - Deploy

2. **Via Wrangler CLI**:
   ```bash
   npm install -g wrangler
   cd static-site
   wrangler pages publish .
   ```

## Post-Deployment Configuration

### 1. Configure API Keys

After deployment, users need to:
1. Open the deployed site
2. Click **⚙️ API Settings**
3. Add their API keys (Anthropic, OpenAI, or Google)
4. Keys are stored locally in browser

### 2. Custom Organelle Data

To use custom organelle CSV data:

1. **Host CSV Files**:
   - Upload to same hosting platform
   - Or use a separate service (S3, GCS, etc.)
   - Ensure CORS is enabled

2. **Update Configuration**:
   Edit `organelle-data.js`:
   ```javascript
   this.csvSources = {
       celegans: {
           mito: 'https://your-cdn.com/data/celegans_mito.csv',
           nucleus: 'https://your-cdn.com/data/celegans_nucleus.csv'
       }
   };
   ```

### 3. Enable HTTPS

Most platforms enable HTTPS automatically. For custom domains:

1. **Let's Encrypt** (free):
   - Most platforms handle this automatically
   - For manual: Use Certbot

2. **Custom Certificate**:
   - Upload to your hosting provider
   - Configure in platform settings

### 4. Performance Optimization

**Enable Caching**:
```
Cache-Control: public, max-age=31536000, immutable  # For static assets
Cache-Control: no-cache  # For HTML
```

**Enable Compression**:
- Gzip or Brotli compression
- Most platforms enable automatically

**CDN Configuration**:
- Use platform's CDN
- Or configure custom CDN (Cloudflare, Fastly)

## Troubleshooting

### CORS Issues

If data loading fails:
1. Check CORS configuration on data source
2. Use browser dev tools to see exact error
3. Ensure `Access-Control-Allow-Origin: *` header

### API Key Not Saving

1. Check if browser allows localStorage
2. Try different browser
3. Check for browser extensions blocking storage

### Neuroglancer Not Loading

1. Check browser console for WebGL errors
2. Ensure serving over HTTP/HTTPS (not file://)
3. Try clearing browser cache
4. Check if CDN link to Neuroglancer is accessible

### Build/Deploy Failures

1. Ensure all files are included
2. Check file permissions
3. Verify directory structure
4. Check platform-specific logs

## Monitoring and Analytics

### Add Google Analytics

Add to `index.html` before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Platform-Specific Analytics

- **Netlify**: Built-in analytics (paid)
- **Vercel**: Built-in analytics
- **Cloudflare**: Web analytics (free)

## Cost Estimates

- **GitHub Pages**: Free (100 GB bandwidth/month)
- **Netlify**: Free tier: 100 GB bandwidth/month
- **Vercel**: Free tier: 100 GB bandwidth/month
- **S3 + CloudFront**: ~$1-5/month for low traffic
- **Firebase**: Free tier: 10 GB/month
- **Cloudflare Pages**: Free: Unlimited bandwidth

## Security Best Practices

1. **API Keys**: Never commit to repository
2. **HTTPS**: Always use HTTPS in production
3. **Headers**: Set security headers (CSP, X-Frame-Options)
4. **CORS**: Restrict origins in production
5. **Rate Limiting**: Implement on API calls if possible

## Continuous Deployment

### GitHub Actions Example

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./static-site
```

## Support

For issues or questions:
- Check the [main README](README.md)
- Open an issue on GitHub
- Consult platform-specific documentation

## Next Steps

After deployment:
1. Test all features (screenshot, narration, query)
2. Configure custom domain if desired
3. Add custom organelle data if available
4. Share your deployment!
