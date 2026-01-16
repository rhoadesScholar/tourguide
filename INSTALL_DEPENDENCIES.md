# Installing Dependencies

## Problem
The neuroglancer viewer was not loading because the required Python packages were not installed in the environment.

## Solution
Install all required Python dependencies using pip or pixi.

## Using pip (Manual Installation)

```bash
# Install all dependencies from requirements.txt
pip install -r server/requirements.txt

# Install additional dependencies
pip install zarr pandas ollama python-dotenv
```

## Using pixi (Recommended)

```bash
# Install dependencies with pixi (handles all dependencies automatically)
pixi install

# Start the server
pixi run start
```

## Verifying Installation

Test that neuroglancer imports correctly:

```bash
python -c "import neuroglancer; print('✓ neuroglancer installed')"
```

Test that the server starts:

```bash
python server/main.py --ng-port 9999 --web-port 8090
```

You should see output like:
```
============================================================
Neuroglancer Live Stream Server
============================================================

[1/4] Starting Neuroglancer viewer on 0.0.0.0:9999...
      Dataset: C. elegans comma stage
      Neuroglancer URL: http://...

[2/4] Initializing organelle database...
[3/4] Using client-side screenshot capture
[4/4] Starting web server on 0.0.0.0:8090...

Server ready!
```

## Required Dependencies

The key dependencies are:
- **neuroglancer** (2.40.1): Python bindings for the neuroglancer viewer
- **fastapi**: Web framework for the API server
- **uvicorn**: ASGI server
- **pillow**: Image processing
- **websockets**: WebSocket support
- **zarr**: Array storage format
- **pandas**: Data manipulation
- **ollama**: Local AI integration (optional)
- **python-dotenv**: Environment variable management

## Troubleshooting

### "ModuleNotFoundError: No module named 'neuroglancer'"

This means neuroglancer is not installed. Run:
```bash
pip install neuroglancer==2.40.1
```

### "ModuleNotFoundError: No module named 'zarr'" (or other modules)

Install the missing module:
```bash
pip install zarr pandas python-dotenv ollama
```

Or install all dependencies at once:
```bash
pip install -r server/requirements.txt
pip install zarr pandas ollama python-dotenv
```

### Using pixi for dependency management

Pixi manages all dependencies automatically. Just run:
```bash
pixi install
pixi run start
```
