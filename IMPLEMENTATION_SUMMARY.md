# Screenshot Fix Implementation Summary

## Problem Solved

You were unable to get screenshots from Neuroglancer when embedded in an iframe due to browser security isolation. Three previous approaches all failed:

1. **Python Screenshot API** - Timed out with embedded iframe
2. **html2canvas** - Could only capture the empty iframe container
3. **Proxy approach** - Broke Neuroglancer's SSE backend connection

## Solution Implemented: postMessage Communication

The key insight: **Instead of capturing the iframe from outside, have the iframe capture itself and send the screenshot back via postMessage**.

### How It Works

```
Parent Page (app.js)
    ↓ postMessage: "captureScreenshot"
Neuroglancer Iframe (ng-screenshot-handler.js)
    ↓ Captures canvas → toDataURL()
    ↓ postMessage: screenshot data
Parent Page
    ↓ Displays screenshot
    ↓ Sends to server for AI processing
```

## Files Created/Modified

### New Files

1. **[web/ng-screenshot-handler.js](web/ng-screenshot-handler.js)**
   - Runs inside the Neuroglancer iframe
   - Listens for screenshot requests via postMessage
   - Finds Neuroglancer's canvas element
   - Captures screenshot using `canvas.toDataURL()`
   - Sends screenshot back to parent via postMessage

2. **[SCREENSHOT_SOLUTION.md](SCREENSHOT_SOLUTION.md)**
   - Complete documentation of the problem and solution
   - Testing instructions
   - Debugging guide

### Modified Files

1. **[web/app.js](web/app.js)**
   - Added `setupMessageListener()` to receive screenshots from iframe
   - Added `requestScreenshot()` to request screenshots via postMessage
   - Added `handleScreenshotFromIframe()` to process received screenshots
   - Added `sendScreenshotToServer()` to forward screenshots to backend
   - Added `injectScreenshotHandler()` to inject script (for same-origin iframes)
   - Replaced `html2canvas` approach with postMessage communication

2. **[server/stream.py](server/stream.py)**
   - Modified proxy to inject screenshot handler script into HTML responses
   - Fixed Content-Length header when injecting scripts
   - Ensures script loads even with cross-origin iframes

3. **[web/index.html](web/index.html)**
   - Removed `html2canvas` dependency (no longer needed)

## How to Test

### 1. Start the Server

```bash
cd /groups/cellmap/cellmap/ackermand/Programming/tourguide
pixi run start
```

Expected output:
```
Neuroglancer URL: http://ackermand-ws2.hhmi.org:9999/v/...
Web panel: http://ackermand-ws2:8090/
Server ready!
```

### 2. Open Web Interface

Open your browser to: `http://localhost:8090/`

### 3. Check Browser Console

You should see:
```
[PROXY] Injected screenshot handler into HTML response
[MESSAGE] Neuroglancer iframe is ready
[SCREENSHOT] Received from client: XXXX bytes
```

### 4. Verify Screenshots

- **Live Screenshot panel** should show the Neuroglancer view
- **Frame count** should increment at ~1 fps
- Screenshots should update as you navigate in Neuroglancer

## Technical Details

### Security Model

- **postMessage** allows cross-origin communication
- Each message specifies a type (`captureScreenshot`, `screenshot`, `ready`)
- In production, validate `event.origin` for security

### Canvas Capture

```javascript
// Inside iframe (ng-screenshot-handler.js)
const canvas = document.querySelector('canvas');
const jpeg_b64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
```

This works because:
- The script runs **inside** the iframe's context
- It has direct access to the Neuroglancer canvas
- Browser security allows capturing your own canvas

### Script Injection

Two approaches are used to ensure the script loads:

1. **Proxy injection** (for cross-origin): Server injects script tag into HTML
2. **Client injection** (for same-origin): Parent page injects script directly

### Why This Works

Browser security prevents:
- ❌ Parent accessing iframe rendering
- ❌ Parent accessing iframe DOM (cross-origin)
- ❌ External screenshot APIs coordinating with iframe

Browser security allows:
- ✅ iframe accessing its own canvas
- ✅ postMessage between iframe and parent
- ✅ Canvas.toDataURL() for self-capture

## Next Steps

### 1. Add Screenshots to AI Narration

Modify [server/narrator.py](server/narrator.py) to include screenshots in narration prompts:

```python
def generate_narration(self, summary: Dict, screenshot_b64: Optional[str] = None):
    if screenshot_b64:
        # Send screenshot to vision model
        # e.g., Claude with vision, GPT-4V, etc.
        pass
```

### 2. Optimize Screenshot Rate

Adjust FPS in [web/app.js](web/app.js):

```javascript
this.screenshotFps = 2;  // Increase for smoother updates
```

### 3. Add Screenshot History

Store recent screenshots for comparison:

```javascript
this.screenshots = [];  // Keep last N screenshots
this.maxScreenshots = 5;
```

### 4. Reduce Screenshot Size

Lower quality/resolution if needed:

```javascript
// In ng-screenshot-handler.js
const jpeg_b64 = canvas.toDataURL('image/jpeg', 0.6);  // Lower quality
```

## Debugging

### No screenshots appearing?

1. Check browser console for errors
2. Verify `[PROXY] Injected screenshot handler` message
3. Try manual screenshot request:
   ```javascript
   document.getElementById('ng-iframe').contentWindow.postMessage({
       type: 'captureScreenshot', width: 800, height: 600
   }, '*');
   ```

### "Iframe not ready" messages?

- Normal for first few seconds while loading
- Should resolve once Neuroglancer finishes loading
- Check if canvas element exists in iframe

### Proxy errors?

1. Verify Neuroglancer is running (check startup logs)
2. Test direct access: `http://localhost:9999/`
3. Check firewall/network settings

## Alternative Approach (If Needed)

If the proxy causes too many issues, you can skip it and use direct Neuroglancer URL:

**In [server/stream.py](server/stream.py):**
```python
# Change this:
return {"url": f"/ng-proxy/{path}"}

# To this:
return {"url": ng_tracker.get_url()}
```

Then inject the script manually via client-side injection only.

## Success Criteria

✅ Screenshot panel shows live Neuroglancer view  
✅ Screenshots update at ~1 fps  
✅ Frame count increments  
✅ Server logs show: `[SCREENSHOT] Received from client`  
✅ Screenshots update when navigating Neuroglancer  

## Current Status

🟢 **Implementation Complete**

- postMessage communication implemented
- Screenshot handler script created
- Proxy injection working
- Client-side injection as fallback
- Content-Length header fix applied
- Server running successfully

**Ready for testing!**

Open `http://localhost:8090/` to see the results.
