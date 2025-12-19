#!/usr/bin/env python
"""Quick test script to verify the server starts correctly."""

import sys
sys.path.insert(0, 'server')

from ng import NG_StateTracker

print("Testing Neuroglancer tracker...")
tracker = NG_StateTracker()
print(f"✓ Tracker created successfully")
print(f"✓ Neuroglancer URL: {tracker.get_url()}")

tracker.start_screenshot_loop(max_fps=2)
print(f"✓ Screenshot loop started")

print("\nAll basic components working!")
print("Now try: pixi run start")
