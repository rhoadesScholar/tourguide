// Shim to expose neuroglancer functionality globally
// The beta version doesn't export properly, so we'll expose what we need
(function() {
    console.log('[SHIM] Initializing neuroglancer shim...');
    
    // For now, create a minimal shim that allows the app to work
    // TODO: This needs to be replaced with actual neuroglancer APIs
    window.neuroglancer = {
        Viewer: function(container) {
            console.log('[SHIM] Creating mock Viewer');
            this.state = {
                changed: {
                    add: function() {}
                },
                toJSON: function() {
                    return {
                        position: [0, 0, 0],
                        crossSectionScale: 1,
                        layers: []
                    };
                },
                restoreState: function(state) {
                    console.log('[SHIM] restoreState called with:', state);
                }
            };
        }
    };
    
    console.log('[SHIM] Neuroglancer shim initialized');
})();
