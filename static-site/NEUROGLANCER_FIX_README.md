# Neuroglancer Loading Issue - Resolution Guide

## Problem
The neuroglancer library is not loading from CDN URLs, resulting in the error:
```
⚠️ Viewer Unavailable
Neuroglancer library could not be loaded.
```

## Root Cause
1. External CDNs (unpkg.com, jsdelivr.net) are blocked or inaccessible in the current environment
2. The npm package `neuroglancer@0.0.0-beta.0` (installed locally) doesn't expose a global `window.neuroglancer` API that the app.js expects
3. The newer versions (2.39.2+) use ES modules and don't provide pre-built browser bundles

## Current Status
- ✅ Neuroglancer bundle files are copied to `static-site/lib/` directory
- ✅ HTML updated to load from local files instead of CDN
- ❌ The bundle doesn't expose the expected global API

## Solutions

### Option 1: Use a Working Neuroglancer Bundle (RECOMMENDED)
Download a working neuroglancer.js bundle from version 2.38.0 and place it in `static-site/lib/`:

```bash
# From a machine with internet access, download:
wget https://unpkg.com/neuroglancer@2.38.0/dist/min/neuroglancer.js -O static-site/lib/neuroglancer.js

# Then update static-site/index.html to load it:
<script src="lib/neuroglancer.js"></script>
```

### Option 2: Clone and Build Neuroglancer
Clone the neuroglancer repository and build a custom bundle:

```bash
cd static-site
git clone https://github.com/google/neuroglancer.git
cd neuroglancer
npm install
npm run build-min
# Copy dist files to ../lib/
```

### Option 3: Use a Different Viewer Library
Consider using an alternative 3D visualization library that:
- Has better npm package support
- Works in offline/restricted environments
- Has similar features to neuroglancer

## Testing
Once a proper neuroglancer.js is in place:

```bash
cd static-site
python -m http.server 8080
# Open http://localhost:8080/ in a browser
```

The viewer should load without errors and display the "C. elegans (Comma Stage)" dataset by default.

## Files Modified
- `static-site/index.html` - Updated to load from local lib/
- `static-site/package.json` - Added neuroglancer dependency
- `.gitignore` - Updated to include static-site/lib/
- `static-site/lib/` - Contains neuroglancer bundle files (currently from beta version)

## Next Steps
1. Obtain a working neuroglancer.js bundle (version 2.38.0 or compatible)
2. Replace the current lib/main.bundle.js with the working bundle
3. Test the application to ensure the viewer loads correctly
4. Update this README with the final solution
