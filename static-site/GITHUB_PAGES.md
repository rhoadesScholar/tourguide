# GitHub Pages Automatic Deployment

## Overview

This repository includes a GitHub Actions workflow that automatically deploys the static site to GitHub Pages.

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes to main branch                            │
│  (changes to static-site/ directory)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow Triggered                          │
│  (.github/workflows/deploy-static-site.yml)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  Build Job                                                   │
│  1. Checkout repository                                      │
│  2. Setup GitHub Pages                                       │
│  3. Upload static-site/ directory as artifact                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  Deploy Job                                                  │
│  1. Deploy artifact to GitHub Pages                          │
│  2. Site available at:                                       │
│     https://rhoadesscholar.github.io/tourguide/             │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### One-Time Setup (Required)

1. **Enable GitHub Pages with Actions:**
   - Go to repository **Settings**
   - Click **Pages** in the left sidebar
   - Under **Source**, select **GitHub Actions**
   - Save

2. **Verify Workflow:**
   - Go to **Actions** tab
   - You should see the "Deploy Static Site to GitHub Pages" workflow
   - It will run automatically on push to main

### Accessing the Site

Once deployed, the site will be available at:
```
https://rhoadesscholar.github.io/tourguide/
```

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab
2. Click "Deploy Static Site to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select branch and run

## Workflow Features

- ✅ **Automatic deployment** on push to main branch
- ✅ **Path filtering** - only triggers when `static-site/` or workflow file changes
- ✅ **Manual trigger** - can run workflow on demand
- ✅ **Proper permissions** - configured for GitHub Pages deployment
- ✅ **Concurrency control** - prevents overlapping deployments

## Workflow Configuration

The workflow is defined in `.github/workflows/deploy-static-site.yml`:

```yaml
name: Deploy Static Site to GitHub Pages

on:
  push:
    branches: ["main"]
    paths:
      - 'static-site/**'
      - '.github/workflows/deploy-static-site.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write
```

## Troubleshooting

### Deployment fails

1. Check that GitHub Pages is enabled in Settings → Pages
2. Ensure "GitHub Actions" is selected as the source
3. Check Actions tab for error messages
4. Verify workflow file syntax

### Site not updating

1. Wait 1-2 minutes for deployment to complete
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Actions tab to see if workflow ran
4. Verify changes were pushed to main branch

### 404 errors

1. Ensure the workflow completed successfully
2. Check that the site URL is correct: `https://rhoadesscholar.github.io/tourguide/`
3. Wait a few minutes - GitHub Pages can take time to propagate

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `static-site/` directory with your domain
2. Configure DNS settings at your domain registrar
3. Enable custom domain in Settings → Pages
4. Enable "Enforce HTTPS"

## Cost

GitHub Pages deployment is **free** for public repositories with:
- 100 GB bandwidth per month
- 1 GB storage
- 10 builds per hour

## Security

The workflow uses GitHub's built-in tokens and permissions:
- No secrets need to be configured
- Automatic permission management
- Secure artifact handling
