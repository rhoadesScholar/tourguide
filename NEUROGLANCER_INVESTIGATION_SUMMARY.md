# Neuroglancer Loading Investigation - Summary

## Investigation Results

### Question: "Do we need to copy the neuroglancer repo here to be able to use the code?"

**Answer: NO, but YES for a working solution.**

You don't need to copy the entire neuroglancer repository, but you DO need a properly built neuroglancer bundle file because:

1. **CDN URLs are blocked** - The application cannot access external CDNs (unpkg.com, jsdelivr.net)
2. **NPM package doesn't provide browser bundles** - Modern versions use ES modules, not browser-ready bundles
3. **Beta version is incompatible** - The old beta (0.0.0-beta.0) has bundles but doesn't expose the API correctly

## What Was Done

### ✅ Completed
1. Identified the root cause: CDN URLs not accessible
2. Installed neuroglancer from npm (beta version)
3. Copied bundle files to `static-site/lib/` directory
4. Updated HTML to load from local files
5. Updated .gitignore to track the lib directory
6. Created comprehensive documentation

### ❌ Still Broken
The viewer still shows "Viewer Unavailable" because the beta version's bundle doesn't expose `window.neuroglancer` API that the app expects.

## The Real Solution

### Option A: Download Pre-built Bundle (FASTEST)
```bash
# From a machine with internet access:
curl https://unpkg.com/neuroglancer@2.38.0/dist/min/neuroglancer.js > static-site/lib/neuroglancer.js

# Update static-site/index.html:
<script src="lib/neuroglancer.js"></script>
```

### Option B: Build from Source (MOST CONTROL)
```bash
cd /tmp
git clone https://github.com/google/neuroglancer.git
cd neuroglancer
npm install
npm run build-min
# Copy dist/min/neuroglancer.js to your static-site/lib/
```

### Option C: Use Self-Hosted Neuroglancer Instance
Instead of embedding neuroglancer in the static site, use an iframe pointing to a self-hosted neuroglancer instance that's built separately.

## Technical Details

### Why CDN Loading Failed
```
curl: (6) Could not resolve host: unpkg.com
```
The environment blocks external CDN access, requiring local hosting.

### Why NPM Package Doesn't Work
The npm package `neuroglancer@0.0.0-beta.0`:
- Uses webpack bundles that don't expose globals
- Requires ES module imports, not window.* access
- The main.bundle.js auto-initializes but doesn't expose API

The application code expects:
```javascript
if (typeof neuroglancer === 'undefined') {
    // Show error
}
const viewer = new neuroglancer.Viewer(container);
```

But the bundle doesn't create `window.neuroglancer`.

### File Sizes
- main.bundle.js: 2.7MB
- Other bundles: ~4MB total
- Total lib directory: 6.3MB

These are already committed to the repository.

## Recommendations

1. **Short-term**: Download neuroglancer@2.38.0 from a machine with internet access and commit it
2. **Long-term**: Consider:
   - Building neuroglancer as part of your CI/CD pipeline
   - Using a different 3D visualization library with better npm support
   - Hosting neuroglancer separately and embedding via iframe

## Impact on Users

**Current State**: Application loads but viewer shows error message
**After Fix**: Application will work fully offline with local neuroglancer bundle

## Next Actions for Developer

1. Obtain neuroglancer.js v2.38.0 bundle from CDN (on a machine with internet access)
2. Replace `static-site/lib/main.bundle.js` with the single-file bundle
3. Update `static-site/index.html` to reference the correct file
4. Test locally with `python -m http.server 8080`
5. Commit and push the working version

## Files to Keep vs Remove

**Keep**:
- `static-site/lib/main.css` (neuroglancer styles)
- Space for `static-site/lib/neuroglancer.js` (to be added)

**Can Remove**:
- `static-site/lib/main.bundle.js` (doesn't work)
- `static-site/lib/chunk_worker.bundle.js` 
- `static-site/lib/async_computation.bundle.js`
- `static-site/lib/draco.bundle.js`
- `static-site/lib/tfjs-library.bundle.js`
- `static-site/lib/neuroglancer/` directory (not needed for single-file bundle)
- `static-site/lib/neuroglancer-shim.js` (temporary file)

**Add**:
- `static-site/lib/neuroglancer.js` from v2.38.0 CDN

This will reduce the size from 6.3MB to ~3MB (just neuroglancer.js + main.css).
