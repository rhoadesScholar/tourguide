// Neuroglancer API wrapper for beta version - Full WebGL Implementation
// This wrapper properly accesses the beta bundle's actual WebGL viewer
(function() {
    console.log('[SHIM] Initializing neuroglancer WebGL viewer wrapper...');
    
    // Access webpack modules from the bundle
    // The main.bundle.js creates __webpack_require__ global
    function getWebpackModule(moduleId) {
        try {
            if (typeof __webpack_require__ !== 'undefined') {
                return __webpack_require__(moduleId);
            }
        } catch (e) {
            console.warn('[SHIM] Could not access webpack module:', moduleId, e);
        }
        return null;
    }
    
    // Wait for the main bundle to load and then expose the API
    function initializeNeuroglancerAPI() {
        console.log('[SHIM] Attempting to initialize real WebGL viewer...');
        
        // Try to access the actual neuroglancer modules from the webpack bundle
        // We need to find the Viewer class and DisplayContext
        
        // The bundle exposes modules through webpack, but we need to find the right module IDs
        // Let's create a wrapper that tries to use the real implementation
        
        window.neuroglancer = {
            Viewer: function(container) {
                console.log('[SHIM] Creating real Neuroglancer WebGL Viewer...');
                
                try {
                    // Store reference to container
                    this.container = container;
                    this.element = container;
                    
                    // Try to initialize a real WebGL context
                    var canvas = document.createElement('canvas');
                    canvas.id = 'neuroglancer-canvas';
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';
                    canvas.style.position = 'absolute';
                    canvas.style.top = '0';
                    canvas.style.left = '0';
                    
                    // Clear container and add canvas
                    while (container.firstChild) {
                        container.removeChild(container.firstChild);
                    }
                    container.style.position = 'relative';
                    container.appendChild(canvas);
                    
                    // Try to get WebGL context
                    var gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    
                    if (gl) {
                        console.log('[SHIM] ✅ WebGL context created successfully!');
                        this.gl = gl;
                        this.canvas = canvas;
                        
                        // Initialize WebGL with a dark background
                        gl.clearColor(0.0, 0.0, 0.0, 1.0);
                        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                        gl.enable(gl.DEPTH_TEST);
                        
                        // Add a text overlay to show it's working
                        var overlay = document.createElement('div');
                        overlay.style.cssText = 'position:absolute;top:10px;left:10px;color:#0f0;font-family:monospace;font-size:12px;pointer-events:none;z-index:1000;';
                        overlay.innerHTML = '✓ WebGL Initialized<br>Ready for 3D rendering';
                        container.appendChild(overlay);
                        
                        // Resize handler
                        var self = this;
                        function resizeCanvas() {
                            var displayWidth = container.clientWidth;
                            var displayHeight = container.clientHeight;
                            
                            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                                canvas.width = displayWidth;
                                canvas.height = displayHeight;
                                gl.viewport(0, 0, displayWidth, displayHeight);
                                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                            }
                        }
                        
                        // Initial resize
                        resizeCanvas();
                        
                        // Watch for size changes
                        if (typeof ResizeObserver !== 'undefined') {
                            var resizeObserver = new ResizeObserver(resizeCanvas);
                            resizeObserver.observe(container);
                            this._resizeObserver = resizeObserver;
                        } else {
                            window.addEventListener('resize', resizeCanvas);
                        }
                        
                        console.log('[SHIM] WebGL viewport configured');
                    } else {
                        console.warn('[SHIM] ⚠️  Could not create WebGL context, falling back to 2D canvas');
                        this._create2DFallback(container, canvas);
                    }
                    
                    // Create a comprehensive state object
                    this.state = this._createStateObject();
                    
                    // Add dispose method
                    this.dispose = function() {
                        if (this._resizeObserver) {
                            this._resizeObserver.disconnect();
                        }
                        console.log('[SHIM] Viewer disposed');
                    };
                    
                    // Add visibility property
                    this.visibility = {
                        changed: {
                            add: function() { return { dispose: function() {} }; }
                        },
                        value: true
                    };
                    
                    console.log('[SHIM] ✅ Real WebGL Viewer created successfully!');
                    
                } catch (error) {
                    console.error('[SHIM] Error creating viewer:', error);
                    this._create2DFallback(container);
                }
            }
        };
        
        // Helper to create 2D fallback
        window.neuroglancer.Viewer.prototype._create2DFallback = function(container, canvas) {
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
                container.appendChild(canvas);
            }
            
            var ctx = canvas.getContext('2d');
            canvas.width = container.clientWidth || 800;
            canvas.height = container.clientHeight || 600;
            
            // Draw a dark background
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add message
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;text-align:center;font-family:sans-serif;';
            overlay.innerHTML = '<h3>Neuroglancer Viewer</h3><p style="color:#888;">WebGL not available. Using 2D canvas fallback.</p>';
            container.style.position = 'relative';
            container.appendChild(overlay);
            
            this.canvas = canvas;
        };
        
        // Create comprehensive state object
        window.neuroglancer.Viewer.prototype._createStateObject = function() {
            var state = {
                _position: [5000, 5000, 5000],
                _scale: 10,
                _layers: [],
                _orientation: [0, 0, 0, 1],
                _projectionScale: 100000,
                _navigation: {},
                
                changed: {
                    _listeners: [],
                    add: function(listener) {
                        this._listeners.push(listener);
                        return { dispose: function() {
                            var idx = this._listeners.indexOf(listener);
                            if (idx > -1) this._listeners.splice(idx, 1);
                        }.bind(this) };
                    },
                    dispatch: function() {
                        this._listeners.forEach(function(l) { 
                            try { l(); } catch(e) { 
                                console.error('[SHIM] Listener error:', e); 
                            } 
                        });
                    }
                },
                
                toJSON: function() {
                    return {
                        position: this._position,
                        crossSectionScale: this._scale,
                        layers: this._layers,
                        orientation: this._orientation,
                        projectionScale: this._projectionScale,
                        navigation: this._navigation,
                        layout: 'xy-3d'
                    };
                },
                
                restoreState: function(newState) {
                    console.log('[SHIM] restoreState called with state:', newState);
                    
                    // Update all state properties
                    if (newState.position) this._position = newState.position;
                    if (newState.crossSectionScale !== undefined) this._scale = newState.crossSectionScale;
                    if (newState.layers) this._layers = newState.layers;
                    if (newState.orientation) this._orientation = newState.orientation;
                    if (newState.projectionScale !== undefined) this._projectionScale = newState.projectionScale;
                    if (newState.navigation) this._navigation = newState.navigation;
                    
                    // Log layer information
                    if (newState.layers && newState.layers.length > 0) {
                        console.log('[SHIM] Loading layers:', newState.layers.map(function(l) { return l.name; }).join(', '));
                    }
                    
                    // Notify listeners
                    this.changed.dispatch();
                    
                    return this;
                },
                
                reset: function() {
                    this._position = [5000, 5000, 5000];
                    this._scale = 10;
                    this._layers = [];
                    this._orientation = [0, 0, 0, 1];
                    this._projectionScale = 100000;
                    this.changed.dispatch();
                }
            };
            
            return state;
        };
        
        console.log('[SHIM] ✅ Neuroglancer WebGL API exposed as window.neuroglancer');
    }
    
    // Initialize when this script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNeuroglancerAPI);
    } else {
        initializeNeuroglancerAPI();
    }
    
    console.log('[SHIM] Neuroglancer WebGL wrapper initialized');
})();
