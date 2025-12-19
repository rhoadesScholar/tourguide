# Quick Start: Screenshot Testing

## Start Server

```bash
cd /groups/cellmap/cellmap/ackermand/Programming/tourguide
pixi run start
```

## Access Web Interface

Open browser: **http://localhost:8090/**

Or from your hostname: **http://ackermand-ws2:8090/**

## What You Should See

### Browser Console (F12)
```
Neuroglancer URL loaded: /ng-proxy/v/...
[MESSAGE] Neuroglancer iframe is ready
[SCREENSHOT] Iframe not ready     ← Will appear briefly while loading
[MESSAGE] Received screenshot from iframe
[SCREENSHOT] Sent to server
```

### Server Console
```
[PROXY] Injected screenshot handler into HTML response
[SCREENSHOT] Received from client: 12345 bytes
```

### Web Interface

1. **Neuroglancer Viewer** (left panel)
   - Shows embedded Neuroglancer
   - Should load brain EM data

2. **Live Screenshot** (top right)
   - Shows captured screenshot
   - Updates ~1 time per second
   - Frame count increments

3. **AI Narration** (middle right)
   - Shows "Navigate around to trigger..."
   - Will show narrations after significant movement

4. **Viewer State** (bottom right)
   - Shows position, scale, orientation
   - Shows visible layers
   - Updates on navigation

## Test Steps

1. ✅ **Wait for load** (5-10 seconds)
   - Neuroglancer should render
   - Screenshot should appear in right panel

2. ✅ **Navigate in Neuroglancer**
   - Click and drag to pan
   - Scroll to zoom
   - Screenshots should update

3. ✅ **Check frame count**
   - Should increment at bottom
   - Should show ~1 fps

## Common Issues

### Screenshots not appearing?

**Check 1:** Browser console for errors

**Check 2:** Manually trigger screenshot
```javascript
// In browser console (F12)
const iframe = document.getElementById('ng-iframe');
iframe.contentWindow.postMessage({
    type: 'captureScreenshot',
    width: 800,
    height: 600
}, '*');
```

**Check 3:** Verify script loaded
```javascript
// In browser console
const iframe = document.getElementById('ng-iframe');
console.log(iframe.contentDocument);  // Should show document or null (cross-origin)
```

### Server errors?

**Kill and restart:**
```bash
lsof -ti:9999 | xargs -r kill -9
lsof -ti:8090 | xargs -r kill -9
pixi run start
```

## Expected Performance

- **Screenshot rate**: ~1 fps
- **Screenshot size**: ~10-50 KB (JPEG base64)
- **Latency**: ~200-500ms from capture to display
- **CPU usage**: Low (only captures on change)

## File Locations

- Web interface: `web/index.html`
- Client JavaScript: `web/app.js`
- Screenshot handler: `web/ng-screenshot-handler.js`
- Server: `server/stream.py`

## Documentation

- [SCREENSHOT_SOLUTION.md](SCREENSHOT_SOLUTION.md) - Technical details
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete summary
- [README.md](README.md) - Project overview

## Debug Mode

Enable more logging in browser console:

```javascript
// In browser console
NGLiveStream.prototype.requestScreenshot = function() {
    console.log('[DEBUG] Requesting screenshot, ready:', this.iframeReady);
    // ... rest of function
};
```

## Success!

When working correctly, you should see:
- ✅ Live Neuroglancer view in iframe
- ✅ Screenshots updating in right panel
- ✅ Frame count incrementing
- ✅ No errors in console
- ✅ Server logs showing screenshot receipts

**Your screenshots are now working! 🎉**

The iframe isolation problem is solved using postMessage communication.
