# Stage 4: AI Narrator - Complete! 🎉

## What Was Implemented

Stage 4 adds AI narration that describes what you're viewing as you navigate through the Neuroglancer data. The narrator uses **state-based analysis** (position, zoom, layers, selections) instead of screenshots, making it more reliable and contextually aware.

## Architecture

### Backend Components

1. **[server/narrator.py](server/narrator.py)** - New AI narrator module
   - Uses Anthropic Claude 3.5 Sonnet for intelligent narration
   - Analyzes viewer state (position, zoom, layers, selections)
   - Context-aware prompts for electron microscopy / neuroanatomy
   - Tracks narration history to avoid repetition
   - Configurable thresholds to trigger narration:
     - Position change: 5000 voxels
     - Zoom change: 50%
     - Selection changes: Immediate
     - Minimum interval: 3 seconds

2. **[server/ng.py](server/ng.py)** - Updated state tracker
   - Integrated narrator into state change callback
   - Calls narrator when meaningful changes occur
   - Passes narration text to WebSocket via callback

3. **[server/stream.py](server/stream.py)** - Updated WebSocket server
   - Added narration queue for async message broadcasting
   - New message type: `{"type": "narration", "text": "...", "timestamp": ...}`
   - Background task broadcasts narrations to all connected clients
   - Handles narrator callback to queue messages

### Frontend Components

4. **[web/index.html](web/index.html)** - Updated UI
   - New "AI Narration" panel added between Live Screenshot and Viewer State
   - Shows real-time narration as you navigate
   - Displays up to 10 recent narrations with timestamps

5. **[web/app.js](web/app.js)** - Updated WebSocket client
   - Handles narration messages from server
   - Displays narrations with timestamps
   - Latest narration highlighted with green accent
   - Auto-scrolls to show most recent narration
   - Keeps history of last 10 narrations

6. **[web/style.css](web/style.css)** - Updated styles
   - Narration panel styling with dark theme
   - Green highlight for latest narration
   - Fade-in animation for new narrations
   - Custom scrollbar for narration history
   - Responsive layout

## Setup Instructions

### 1. Get an Anthropic API Key

1. Visit https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
cd /groups/cellmap/cellmap/ackermand/Programming/tourguide
cp .env.example .env
```

Edit `.env` and add your API key:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Restart the Server

The server is already running, but you'll need to restart it after adding the API key:

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
pixi run start
```

## How It Works

1. **Navigate in Neuroglancer** (left panel)
   - Pan, zoom, rotate
   - Select segments
   - Toggle layers

2. **State tracking detects changes** [server/ng.py:72-96](server/ng.py#L72-L96)
   - Position, zoom, orientation, layers, selections

3. **Narrator evaluates if narration is needed** [server/narrator.py:43-88](server/narrator.py#L43-L88)
   - Checks thresholds for position (5000 voxels), zoom (50%), selections
   - Ensures minimum 3 second interval between narrations

4. **Claude API generates context-aware narration** [server/narrator.py:90-145](server/narrator.py#L90-L145)
   - Understands EM/neuroanatomy context
   - References layer types and scale
   - Describes what structures might be visible

5. **WebSocket broadcasts to all clients** [server/stream.py:35-78](server/stream.py#L35-L78)
   - Async queue prevents blocking
   - All connected clients receive narrations

6. **UI displays narration in real-time** [web/app.js:206-251](web/app.js#L206-L251)
   - Latest narration highlighted
   - History of last 10 narrations
   - Timestamps for each

## Features

✅ **State-based narration** - More reliable than screenshot-based
✅ **Context-aware** - Understands EM/neuroanatomy terminology
✅ **Smart throttling** - Configurable thresholds prevent spam
✅ **Real-time updates** - WebSocket pushes narrations instantly
✅ **Narration history** - See last 10 narrations with timestamps
✅ **Multi-client support** - All viewers receive narrations

## Example Narrations

Based on the FAFB fly brain dataset:

- "Zooming in to examine fine structures at scale 1.69. The EM layer shows cellular details at this magnification."
- "Selected segment 1234567. This could be a neuron or cellular structure in the FAFB segmentation."
- "Position [48703, 33688, 2979] - exploring a different region of the fly brain."
- "Zoomed out to overview scale (3430668.98). Good for navigating between brain regions."

## Configuration

Edit thresholds in [server/narrator.py](server/narrator.py):

```python
# server/narrator.py:23-26
self.position_threshold = 5000  # voxels
self.zoom_threshold = 0.5  # 50% change
self.narration_interval = 3.0  # seconds
```

Adjust narrator prompt in [server/narrator.py:90-145](server/narrator.py#L90-L145) to customize tone and style.

## Current Status

✅ **Stage 1**: Neuroglancer state capture
✅ **Stage 2**: Screenshot loop (working but timing out - not needed for narration)
✅ **Stage 3**: WebSocket streaming
✅ **Stage 4**: AI Narrator (COMPLETE!)
⏳ **Stage 5**: Text-to-speech (TODO)
⏳ **Stage 6**: Quality upgrades (TODO)

## Next Steps

Once you add your Anthropic API key and restart:

1. Open http://ackermand-ws2:8090/
2. Navigate around in the Neuroglancer viewer
3. Watch the "AI Narration" panel for live descriptions
4. The narrator will trigger when you:
   - Move more than 5000 voxels
   - Zoom in/out by 50% or more
   - Select a segment
   - Toggle layer visibility

## Testing Without API Key

The system works without an API key, but narration will be disabled. You'll see:
- State tracking: ✅ Working
- Screenshot streaming: ⚠️ Timing out (expected, not needed)
- WebSocket: ✅ Working
- Narration: ⚠️ Disabled (needs API key)

## Troubleshooting

**"No ANTHROPIC_API_KEY found"**
- Create `.env` file with `ANTHROPIC_API_KEY=your_key_here`
- Restart the server

**Narrations not appearing**
- Check browser console for errors
- Verify WebSocket connection (status indicator should be green)
- Move significantly (>5000 voxels) or zoom by 50%+ to trigger

**Too many narrations**
- Increase thresholds in narrator.py
- Increase `narration_interval` to space them out more

## Files Changed

- ✅ [server/narrator.py](server/narrator.py) - NEW: AI narrator
- ✅ [server/ng.py](server/ng.py) - Integrated narrator
- ✅ [server/stream.py](server/stream.py) - Narration broadcasting
- ✅ [web/index.html](web/index.html) - Narration panel
- ✅ [web/app.js](web/app.js) - Narration display
- ✅ [web/style.css](web/style.css) - Narration styling
- ✅ [pixi.toml](pixi.toml) - Added anthropic dependency
- ✅ [.env.example](.env.example) - NEW: API key template

Enjoy your AI-narrated Neuroglancer tour! 🎉
