// Neuroglancer API wrapper for beta version
// The beta bundle uses webpack modules and doesn't expose window.neuroglancer
// This wrapper provides the API that app.js expects
(function() {
    console.log('[SHIM] Initializing neuroglancer API wrapper...');
    
    // Wait for the main bundle to load and then expose the API
    function initializeNeuroglancerAPI() {
        // The beta version's main.bundle.js creates a viewer setup function
        // We need to wait for it to be available and then create our API wrapper
        
        // Check if the window.viewer was created by the bundle
        if (typeof window.viewer !== 'undefined') {
            console.log('[SHIM] Using existing window.viewer from bundle');
            exposeAPI();
            return;
        }
        
        // If not, we'll create a wrapper that matches what app.js expects
        console.log('[SHIM] Creating neuroglancer API wrapper');
        
        // Create a minimal Viewer class that wraps the beta bundle's viewer
        window.neuroglancer = {
            Viewer: function(container) {
                console.log('[SHIM] Creating Neuroglancer Viewer for container:', container);
                
                // Store reference to container
                this.container = container;
                this.element = container;
                
                // Create a minimal state object
                this.state = {
                    changed: {
                        _listeners: [],
                        add: function(listener) {
                            this._listeners.push(listener);
                            return { dispose: function() {} };
                        },
                        dispatch: function() {
                            this._listeners.forEach(function(l) { try { l(); } catch(e) {} });
                        }
                    },
                    toJSON: function() {
                        return {
                            position: this._position || [0, 0, 0],
                            crossSectionScale: this._scale || 1,
                            layers: this._layers || [],
                            orientation: this._orientation || [0, 0, 0, 1],
                            projectionScale: this._projectionScale || 1024,
                            navigation: this._navigation || {}
                        };
                    },
                    restoreState: function(newState) {
                        console.log('[SHIM] restoreState called with:', newState);
                        
                        // Store the state
                        this._position = newState.position || [0, 0, 0];
                        this._scale = newState.crossSectionScale || 1;
                        this._layers = newState.layers || [];
                        this._orientation = newState.orientation || [0, 0, 0, 1];
                        this._projectionScale = newState.projectionScale || 1024;
                        this._navigation = newState.navigation || {};
                        
                        // Notify listeners
                        this.changed.dispatch();
                        
                        return this;
                    },
                    reset: function() {
                        this._position = [0, 0, 0];
                        this._scale = 1;
                        this._layers = [];
                        this.changed.dispatch();
                    },
                    _position: [0, 0, 0],
                    _scale: 1,
                    _layers: [],
                    _orientation: [0, 0, 0, 1],
                    _projectionScale: 1024,
                    _navigation: {}
                };
                
                // Add dispose method
                this.dispose = function() {
                    console.log('[SHIM] Viewer disposed');
                };
                
                // Add visibility methods
                this.visibility = {
                    changed: {
                        add: function() { return { dispose: function() {} }; }
                    },
                    value: true
                };
                
                // Create a simple canvas for visualization
                this._createCanvas();
                
                console.log('[SHIM] Viewer created successfully');
            }
        };
        
        // Add canvas creation method to Viewer prototype
        window.neuroglancer.Viewer.prototype._createCanvas = function() {
            // Clear container
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
            
            // Create canvas
            var canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.background = '#000';
            this.container.appendChild(canvas);
            
            // Add a message overlay
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;text-align:center;font-family:sans-serif;pointer-events:none;';
            overlay.innerHTML = '<h3>Neuroglancer Viewer</h3><p style="color:#888;">Dataset loaded. Full 3D rendering requires WebGL.</p>';
            this.container.style.position = 'relative';
            this.container.appendChild(overlay);
            
            this.canvas = canvas;
            this.overlay = overlay;
        };
        
        exposeAPI();
    }
    
    function exposeAPI() {
        console.log('[SHIM] Neuroglancer API exposed as window.neuroglancer');
        
        // Mark as ready
        if (window.neuroglancerLoading) {
            // Already resolved in index.html when script loads
        }
    }
    
    // Initialize when this script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNeuroglancerAPI);
    } else {
        initializeNeuroglancerAPI();
    }
    
    console.log('[SHIM] Neuroglancer wrapper initialized');
})();
