/**
 * Neuroglancer Tourguide - Static Site Application
 * 
 * This is a standalone static site version that uses:
 * - Neuroglancer JS library (standalone)
 * - Public S3 Zarr datasets (CORS-enabled)
 * - Client-side LLM API calls (Anthropic, OpenAI, Google)
 * - Public CSV files for organelle data
 */

// Configuration Constants
const CONFIG = {
    datasets: {
        celegans: {
            name: 'C. elegans (Comma Stage)',
            baseUrl: 'zarr://https://cellmap-vm1.int.janelia.org/nrs/data/jrc_c-elegans-op50-1/jrc_c-elegans-op50-1.zarr/recon-1',
            dimensions: {
                x: [8e-9, 'm'],
                y: [8e-9, 'm'],
                z: [8e-9, 'm']
            },
            initialPosition: [5000, 5000, 5000],
            organelles: ['mito', 'nuc', 'er']
        },
        hela: {
            name: 'HeLa Cell',
            baseUrl: 's3://janelia-cosem-datasets/jrc_hela-2/jrc_hela-2',
            dimensions: {
                x: [4e-9, 'm'],
                y: [4e-9, 'm'],
                z: [4e-9, 'm']
            },
            initialPosition: [5000, 5000, 2500],
            organelles: ['mito_seg', 'nucleus_seg', 'er_seg']
        }
    },
    security: {
        storageKey: 'ng-tourguide-api-config',
        storageWarning: '⚠️ API keys are stored in browser localStorage. Do not use this on shared computers. Keys are only sent to their respective API providers.'
    },
    neuroglancer: {
        loadTimeoutMs: 10000 // 10 seconds timeout for loading Neuroglancer library
    }
};

class NeuroglancerTourguide {
    constructor() {
        this.viewer = null;
        this.currentMode = 'explore';
        this.apiConfig = this.loadAPIConfig();
        this.screenshots = [];
        this.narrations = [];
        this.currentDataset = 'celegans';
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Neuroglancer Tourguide...');
        
        // Setup UI event listeners first (so UI works even if viewer fails)
        this.setupEventListeners();
        
        // Load API configuration UI state
        this.updateAPIStatus();
        
        // Initialize Neuroglancer viewer (with error handling)
        this.initViewer();
        
        console.log('✅ Initialization complete');
    }

    initViewer() {
        console.log('🧠 Initializing Neuroglancer viewer...');
        
        try {
            const container = document.getElementById('neuroglancer-container');
            
            // Check if Neuroglancer is available
            if (typeof neuroglancer === 'undefined') {
                console.warn('⚠️ Neuroglancer library not available. Running in mock mode.');
                this.showViewerError(
                    'Neuroglancer library could not be loaded.',
                    'This may be due to a network issue, content blocker, or CDN availability. ' +
                    'Please check your internet connection and try refreshing the page.'
                );
                return;
            }
            
            // Create Neuroglancer viewer
            this.viewer = new neuroglancer.Viewer(container);
            
            // Load initial dataset by setting state
            this.loadDataset(this.currentDataset);
            
            // Setup state change listener using Neuroglancer's state management
            this.viewer.state.changed.add(() => {
                this.onViewerStateChanged();
            });
            
            console.log('✅ Neuroglancer viewer initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Neuroglancer:', error);
            this.showViewerError(
                `Failed to initialize viewer: ${error.message}`,
                'There was an error creating the Neuroglancer viewer. Please try refreshing the page.'
            );
        }
    }

    showViewerError(message, details = null) {
        const container = document.getElementById('neuroglancer-container');
        if (container) {
            // Create elements safely to avoid XSS
            container.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 2rem;';
            
            const content = document.createElement('div');
            
            const title = document.createElement('p');
            title.style.cssText = 'font-size: 1.2rem; margin-bottom: 1rem;';
            title.textContent = '⚠️ Viewer Unavailable';
            
            const messageEl = document.createElement('p');
            messageEl.style.cssText = 'margin-bottom: 0.5rem;';
            messageEl.textContent = message;
            
            if (details) {
                const detailsEl = document.createElement('p');
                detailsEl.style.cssText = 'font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;';
                detailsEl.textContent = details;
                content.appendChild(title);
                content.appendChild(messageEl);
                content.appendChild(detailsEl);
            } else {
                content.appendChild(title);
                content.appendChild(messageEl);
            }
            
            const footer = document.createElement('p');
            footer.style.cssText = 'margin-top: 1rem; font-size: 0.9rem;';
            footer.textContent = 'The rest of the application is still functional.';
            
            content.appendChild(footer);
            wrapper.appendChild(content);
            container.appendChild(wrapper);
        }
    }

    loadDataset(datasetName) {
        console.log(`📊 Loading dataset: ${datasetName}`);
        
        this.currentDataset = datasetName;
        
        // Check if viewer is available
        if (!this.viewer) {
            console.warn('⚠️ Viewer not initialized, cannot load dataset');
            return;
        }
        
        try {
            // Build state object based on dataset
            let state;
            if (datasetName === 'celegans') {
                state = this.getCelegansState();
            } else if (datasetName === 'hela') {
                state = this.getHelaState();
            }
            
            // Set the viewer state
            this.viewer.state.restoreState(state);
            
            console.log(`✅ Dataset loaded: ${datasetName}`);
        } catch (error) {
            console.error(`❌ Failed to load dataset ${datasetName}:`, error);
            this.showViewerError(`Failed to load dataset: ${error.message}`);
        }
    }

    getCelegansState() {
        // C. elegans comma stage embryo EM data
        const config = CONFIG.datasets.celegans;
        const baseUrl = config.baseUrl;
        
        return {
            dimensions: config.dimensions,
            position: config.initialPosition,
            crossSectionScale: 10,
            projectionScale: 100000,
            layers: [
                {
                    type: 'image',
                    source: `${baseUrl}/em/fibsem-int16/`,
                    name: 'fibsem-int16',
                    shader: '#uicontrol invlerp normalized\nvoid main() { emitGrayscale(normalized()); }'
                },
                {
                    type: 'segmentation',
                    source: `${baseUrl}/labels/inference/segmentations/mito/`,
                    name: 'mito',
                    visible: false
                },
                {
                    type: 'segmentation',
                    source: `${baseUrl}/labels/inference/segmentations/nuc/`,
                    name: 'nuc',
                    visible: false
                },
                {
                    type: 'segmentation',
                    source: `${baseUrl}/labels/inference/segmentations/er/`,
                    name: 'er',
                    visible: false
                }
            ],
            layout: 'xy-3d'
        };
    }

    getHelaState() {
        // HeLa-2 cell EM data from public S3 bucket
        const config = CONFIG.datasets.hela;
        const baseUrl = config.baseUrl;
        
        return {
            dimensions: config.dimensions,
            position: config.initialPosition,
            crossSectionScale: 10,
            projectionScale: 50000,
            layers: [
                {
                    type: 'image',
                    source: `zarr://${baseUrl}.zarr/recon-1/em/fibsem-uint8/`,
                    name: 'fibsem-uint8',
                    shader: '#uicontrol invlerp normalized\nvoid main() { emitGrayscale(normalized()); }'
                },
                {
                    type: 'segmentation',
                    source: `n5://${baseUrl}.n5/labels/mito_seg`,
                    name: 'mito_seg',
                    visible: false
                },
                {
                    type: 'segmentation',
                    source: `n5://${baseUrl}.n5/labels/nucleus_seg`,
                    name: 'nucleus_seg',
                    visible: false
                },
                {
                    type: 'segmentation',
                    source: `n5://${baseUrl}.n5/labels/er_seg`,
                    name: 'er_seg',
                    visible: false
                }
            ],
            layout: 'xy-3d'
        };
    }

    onViewerStateChanged() {
        // Update state display
        this.updateStateDisplay();
    }

    updateStateDisplay() {
        const stateInfo = document.getElementById('state-info');
        
        if (!this.viewer || !this.viewer.state) {
            stateInfo.innerHTML = '<p>Loading viewer...</p>';
            return;
        }
        
        try {
            // Get current viewer state
            const state = this.viewer.state.toJSON();
            const position = state.position || [0, 0, 0];
            const scale = state.crossSectionScale || 1;
            const layers = state.layers || [];
            
            // Update display
            stateInfo.innerHTML = `
                <div class="state-section">
                    <h3>Position</h3>
                    <p>X: ${position[0].toFixed(0)}, Y: ${position[1].toFixed(0)}, Z: ${position[2].toFixed(0)}</p>
                </div>
                <div class="state-section">
                    <h3>Scale</h3>
                    <p>${scale.toFixed(2)}x</p>
                </div>
                <div class="state-section">
                    <h3>Layers (${layers.length})</h3>
                    <ul>
                        ${layers.map(l => {
                            const visible = l.visible !== false;
                            return `<li>${l.name || 'unnamed'} ${visible ? '✓' : '✗'}</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        } catch (error) {
            console.error('Error updating state display:', error);
            stateInfo.innerHTML = '<p>Error reading state</p>';
        }
    }

    setupEventListeners() {
        // Mode switching
        document.getElementById('mode-explore').addEventListener('click', () => this.switchMode('explore'));
        document.getElementById('mode-query').addEventListener('click', () => this.switchMode('query'));
        document.getElementById('mode-analysis').addEventListener('click', () => this.switchMode('analysis'));
        
        // API settings modal
        const modal = document.getElementById('api-modal');
        const btn = document.getElementById('api-settings-btn');
        const span = document.getElementsByClassName('close')[0];
        
        btn.onclick = () => modal.style.display = 'block';
        span.onclick = () => modal.style.display = 'none';
        // Close modal when clicking outside of it
        modal.addEventListener('click', (event) => {
            if (event.target === event.currentTarget) {
                modal.style.display = 'none';
            }
        });
        
        // API provider tabs
        document.querySelectorAll('.api-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.target.dataset.provider;
                this.switchAPIProvider(provider);
            });
        });
        
        // API configuration actions
        document.getElementById('save-api-config').addEventListener('click', () => this.saveAPIConfig());
        document.getElementById('test-api-connection').addEventListener('click', () => this.testAPIConnection());
        
        // Dataset selector
        document.getElementById('dataset-selector').addEventListener('change', (e) => {
            this.loadDataset(e.target.value);
        });
        
        // Screenshot capture
        document.getElementById('screenshot-btn').addEventListener('click', () => this.captureScreenshot());
        
        // Explore tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Query submit
        document.getElementById('query-submit').addEventListener('click', () => this.submitQuery());
        document.getElementById('query-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitQuery();
            }
        });
        
        // Analysis submit
        document.getElementById('analysis-submit').addEventListener('click', () => this.submitAnalysis());
        document.getElementById('analysis-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitAnalysis();
            }
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`mode-${mode}`).classList.add('active');
        
        // Show/hide panels
        document.getElementById('explore-panel').style.display = mode === 'explore' ? 'flex' : 'none';
        document.getElementById('query-panel').style.display = mode === 'query' ? 'flex' : 'none';
        document.getElementById('analysis-panel').style.display = mode === 'analysis' ? 'flex' : 'none';
        
        console.log(`📍 Switched to ${mode} mode`);
    }

    switchAPIProvider(provider) {
        // Update tab states
        document.querySelectorAll('.api-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-provider="${provider}"]`).classList.add('active');
        
        // Show/hide config sections
        document.querySelectorAll('.api-config-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(`${provider}-config`).style.display = 'block';
    }

    switchTab(tab) {
        // Update tab button states
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    loadAPIConfig() {
        // Load from localStorage
        const saved = localStorage.getItem('ng-tourguide-api-config');
        return saved ? JSON.parse(saved) : {
            anthropic: '',
            openai: '',
            google: ''
        };
    }

    saveAPIConfig() {
        // Save to localStorage
        this.apiConfig = {
            anthropic: document.getElementById('anthropic-key').value,
            openai: document.getElementById('openai-key').value,
            google: document.getElementById('google-key').value
        };
        
        localStorage.setItem('ng-tourguide-api-config', JSON.stringify(this.apiConfig));
        this.updateAPIStatus();
        
        // Show success message
        const result = document.getElementById('api-test-result');
        result.className = 'api-test-result success';
        result.textContent = '✅ API configuration saved successfully!';
        
        setTimeout(() => {
            document.getElementById('api-modal').style.display = 'none';
            result.style.display = 'none';
        }, 2000);
        
        console.log('💾 API configuration saved');
    }

    updateAPIStatus() {
        const indicator = document.getElementById('api-indicator');
        const hasAnyKey = Object.values(this.apiConfig).some(key => key.length > 0);
        
        if (hasAnyKey) {
            indicator.textContent = '🟢';
            indicator.classList.add('connected');
            indicator.classList.remove('disconnected');
        } else {
            indicator.textContent = '⚪';
            indicator.classList.add('disconnected');
            indicator.classList.remove('connected');
        }
        
        // Populate input fields
        document.getElementById('anthropic-key').value = this.apiConfig.anthropic || '';
        document.getElementById('openai-key').value = this.apiConfig.openai || '';
        document.getElementById('google-key').value = this.apiConfig.google || '';
    }

    async testAPIConnection() {
        const result = document.getElementById('api-test-result');
        result.style.display = 'block';
        result.className = 'api-test-result';
        result.textContent = '🔄 Testing connection...';
        
        // Determine which API to test based on active tab
        const activeTab = document.querySelector('.api-tab-btn.active');
        const provider = activeTab.dataset.provider;
        
        try {
            let testSuccessful = false;
            
            if (provider === 'anthropic' && this.apiConfig.anthropic) {
                testSuccessful = await this.testAnthropicAPI();
            } else if (provider === 'openai' && this.apiConfig.openai) {
                testSuccessful = await this.testOpenAIAPI();
            } else if (provider === 'google' && this.apiConfig.google) {
                testSuccessful = await this.testGoogleAPI();
            } else {
                throw new Error('No API key configured for this provider');
            }
            
            if (testSuccessful) {
                result.className = 'api-test-result success';
                result.textContent = `✅ ${provider.charAt(0).toUpperCase() + provider.slice(1)} API connection successful!`;
            }
        } catch (error) {
            result.className = 'api-test-result error';
            result.textContent = `❌ Connection failed: ${error.message}`;
            console.error('API test error:', error);
        }
    }

    async testAnthropicAPI() {
        // Skip actual API call in test environment
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
            return true;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiConfig.anthropic,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 10,
                    messages: [{
                        role: 'user',
                        content: 'test'
                    }]
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }
            
            return true;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API request timed out after 10 seconds');
            }
            throw error;
        }
    }

    async testOpenAIAPI() {
        // Skip actual API call in test environment
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
            return true;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.openai}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    max_tokens: 10,
                    messages: [{
                        role: 'user',
                        content: 'test'
                    }]
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }
            
            return true;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API request timed out after 10 seconds');
            }
            throw error;
        }
    }

    async testGoogleAPI() {
        // Skip actual API call in test environment
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
            return true;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiConfig.google}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'test'
                        }]
                    }]
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }
            
            return true;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API request timed out after 10 seconds');
            }
            throw error;
        }
    }

    async captureScreenshot() {
        console.log('📸 Capturing screenshot...');
        
        try {
            // Use Neuroglancer's screenshot capability
            const canvas = document.querySelector('#neuroglancer-container canvas');
            if (!canvas) {
                throw new Error('Canvas not found - Neuroglancer may not be fully loaded');
            }
            
            // Convert canvas to data URL
            // This may fail if canvas contains cross-origin content
            let dataUrl;
            try {
                dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            } catch (corsError) {
                console.error('CORS error capturing screenshot:', corsError);
                throw new Error('Screenshot capture blocked by CORS policy. This can happen if external data sources taint the canvas.');
            }
            
            // Add to screenshots
            const screenshot = {
                dataUrl,
                timestamp: new Date().toISOString(),
                state: this.getCurrentState()
            };
            
            this.screenshots.push(screenshot);
            
            // Display screenshot
            this.displayScreenshot(screenshot);
            
            // Generate narration if API configured
            if (Object.values(this.apiConfig).some(key => key.length > 0)) {
                await this.generateNarration(screenshot);
            }
            
            console.log('✅ Screenshot captured');
        } catch (error) {
            console.error('❌ Screenshot capture failed:', error);
            alert('Failed to capture screenshot: ' + error.message + '\n\nNote: Screenshot capture requires the canvas to not be tainted by cross-origin content.');
        }
    }

    getCurrentState() {
        if (!this.viewer || !this.viewer.state) {
            console.warn('⚠️ Viewer not available for state capture');
            return {
                position: [0, 0, 0],
                scale: 1,
                dataset: this.currentDataset
            };
        }
        
        try {
            const state = this.viewer.state.toJSON();
            const position = state.position || [0, 0, 0];
            const scale = state.crossSectionScale || 1;
            
            return {
                position: [position[0], position[1], position[2]],
                scale,
                dataset: this.currentDataset
            };
        } catch (error) {
            console.error('Error getting current state:', error);
            return {
                position: [0, 0, 0],
                scale: 1,
                dataset: this.currentDataset
            };
        }
    }

    displayScreenshot(screenshot) {
        const container = document.getElementById('screenshots-container');
        
        // Remove placeholder if exists
        const placeholder = container.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create screenshot element
        const item = document.createElement('div');
        item.className = 'screenshot-item';
        item.innerHTML = `
            <img src="${screenshot.dataUrl}" alt="Screenshot">
            <div class="screenshot-info">
                <p><strong>Time:</strong> ${new Date(screenshot.timestamp).toLocaleTimeString()}</p>
                <p><strong>Position:</strong> ${screenshot.state.position.map(p => p.toFixed(0)).join(', ')}</p>
                <p><strong>Scale:</strong> ${screenshot.state.scale.toFixed(2)}x</p>
            </div>
            <div class="screenshot-narration" id="narration-${this.screenshots.length - 1}">
                <em>Generating narration...</em>
            </div>
        `;
        
        container.insertBefore(item, container.firstChild);
    }

    async generateNarration(screenshot) {
        console.log('🎙️ Generating narration...');
        
        try {
            // Determine which API to use (prefer in order: Google, Anthropic, OpenAI)
            let narration = '';
            
            if (this.apiConfig.google) {
                narration = await this.generateNarrationGoogle(screenshot);
            } else if (this.apiConfig.anthropic) {
                narration = await this.generateNarrationAnthropic(screenshot);
            } else if (this.apiConfig.openai) {
                narration = await this.generateNarrationOpenAI(screenshot);
            } else {
                throw new Error('No API key configured');
            }
            
            // Update screenshot with narration
            const index = this.screenshots.length - 1;
            this.screenshots[index].narration = narration;
            
            // Update display
            const narrationEl = document.getElementById(`narration-${index}`);
            if (narrationEl) {
                narrationEl.innerHTML = narration;
            }
            
            // Add to narrations list
            this.addNarration(narration, screenshot.timestamp);
            
            console.log('✅ Narration generated');
        } catch (error) {
            console.error('❌ Narration generation failed:', error);
            const index = this.screenshots.length - 1;
            const narrationEl = document.getElementById(`narration-${index}`);
            if (narrationEl) {
                narrationEl.innerHTML = `<em style="color: var(--error);">Failed to generate narration: ${error.message}</em>`;
            }
        }
    }

    async generateNarrationAnthropic(screenshot) {
        const prompt = `You are viewing electron microscopy data from a ${this.currentDataset === 'celegans' ? 'C. elegans embryo' : 'HeLa cell'}. 
The current position is ${screenshot.state.position.map(p => p.toFixed(0)).join(', ')} at ${screenshot.state.scale.toFixed(2)}x zoom.
Describe what might be visible in this view in 1-2 sentences, focusing on cellular structures and organelles.`;
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiConfig.anthropic,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 200,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        return data.content[0].text;
    }

    async generateNarrationOpenAI(screenshot) {
        const prompt = `You are viewing electron microscopy data from a ${this.currentDataset === 'celegans' ? 'C. elegans embryo' : 'HeLa cell'}. 
The current position is ${screenshot.state.position.map(p => p.toFixed(0)).join(', ')} at ${screenshot.state.scale.toFixed(2)}x zoom.
Describe what might be visible in this view in 1-2 sentences, focusing on cellular structures and organelles.`;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiConfig.openai}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                max_tokens: 200,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    async generateNarrationGoogle(screenshot) {
        const prompt = `You are viewing electron microscopy data from a ${this.currentDataset === 'celegans' ? 'C. elegans embryo' : 'HeLa cell'}. 
The current position is ${screenshot.state.position.map(p => p.toFixed(0)).join(', ')} at ${screenshot.state.scale.toFixed(2)}x zoom.
Describe what might be visible in this view in 1-2 sentences, focusing on cellular structures and organelles.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiConfig.google}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 200
                }
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    addNarration(text, timestamp) {
        const container = document.getElementById('narrations-list');
        
        // Remove placeholder if exists
        const placeholder = container.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create narration element
        const item = document.createElement('div');
        item.className = 'narration-item';
        item.innerHTML = `
            <div class="narration-timestamp">${new Date(timestamp).toLocaleTimeString()}</div>
            <div class="narration-text">${text}</div>
        `;
        
        container.insertBefore(item, container.firstChild);
        
        this.narrations.push({ text, timestamp });
    }

    async submitQuery() {
        const input = document.getElementById('query-input');
        const query = input.value.trim();
        
        if (!query) return;
        
        console.log('💬 Submitting query:', query);
        
        // Clear input
        input.value = '';
        
        // Add query to results
        this.addQueryResult(query, 'Processing query...', true);
        
        try {
            // Generate answer using LLM
            const answer = await this.processQuery(query);
            
            // Update result
            this.updateLastQueryResult(answer, false);
            
            console.log('✅ Query processed');
        } catch (error) {
            console.error('❌ Query processing failed:', error);
            this.updateLastQueryResult(`Error: ${error.message}`, false);
        }
    }

    async processQuery(query) {
        // Use available API to process query
        const prompt = `You are an AI assistant helping analyze electron microscopy data of ${this.currentDataset === 'celegans' ? 'C. elegans embryo' : 'HeLa cell'}.
The user asked: "${query}"

Provide a helpful response about organelles and cellular structures. If the query asks to show or navigate to specific organelles, explain that this feature requires connecting to organelle metadata CSV files.`;
        
        if (this.apiConfig.google) {
            return await this.queryGoogle(prompt);
        } else if (this.apiConfig.anthropic) {
            return await this.queryAnthropic(prompt);
        } else if (this.apiConfig.openai) {
            return await this.queryOpenAI(prompt);
        } else {
            throw new Error('No API key configured. Please configure an API key in settings.');
        }
    }

    async queryAnthropic(prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiConfig.anthropic,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        return data.content[0].text;
    }

    async queryOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiConfig.openai}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    async queryGoogle(prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiConfig.google}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 500
                }
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    addQueryResult(query, answer, isLoading) {
        const container = document.getElementById('query-results');
        
        // Remove placeholder if exists
        const placeholder = container.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create result element
        const item = document.createElement('div');
        item.className = 'query-result-item';
        item.id = `query-result-${Date.now()}`;
        item.innerHTML = `
            <div class="result-query">Q: ${query}</div>
            <div class="result-answer">${isLoading ? '<span class="loading"></span> ' : ''}${answer}</div>
            <div class="result-timestamp">${new Date().toLocaleTimeString()}</div>
        `;
        
        container.insertBefore(item, container.firstChild);
    }

    updateLastQueryResult(answer, isLoading) {
        const container = document.getElementById('query-results');
        const lastResult = container.querySelector('.query-result-item');
        
        if (lastResult) {
            const answerEl = lastResult.querySelector('.result-answer');
            answerEl.innerHTML = `${isLoading ? '<span class="loading"></span> ' : ''}${answer}`;
        }
    }

    async submitAnalysis() {
        const input = document.getElementById('analysis-input');
        const query = input.value.trim();
        
        if (!query) return;
        
        console.log('📊 Submitting analysis request:', query);
        
        // Clear input
        input.value = '';
        
        // Add to results
        this.addAnalysisResult(query, 'Processing analysis request...', true);
        
        try {
            // Generate response
            const response = await this.processAnalysis(query);
            
            // Update result
            this.updateLastAnalysisResult(response, false);
            
            console.log('✅ Analysis processed');
        } catch (error) {
            console.error('❌ Analysis processing failed:', error);
            this.updateLastAnalysisResult(`Error: ${error.message}`, false);
        }
    }

    async processAnalysis(query) {
        const prompt = `You are an AI assistant helping with data analysis of electron microscopy organelle data from ${this.currentDataset === 'celegans' ? 'C. elegans embryo' : 'HeLa cell'}.
The user requested: "${query}"

Explain what analysis would be performed and what type of visualization would be created. Note that actual code execution requires connecting to organelle metadata CSV files and a backend execution environment.`;
        
        if (this.apiConfig.google) {
            return await this.queryGoogle(prompt);
        } else if (this.apiConfig.anthropic) {
            return await this.queryAnthropic(prompt);
        } else if (this.apiConfig.openai) {
            return await this.queryOpenAI(prompt);
        } else {
            throw new Error('No API key configured. Please configure an API key in settings.');
        }
    }

    addAnalysisResult(query, result, isLoading) {
        const container = document.getElementById('analysis-results');
        
        // Remove placeholder if exists
        const placeholder = container.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create result element
        const item = document.createElement('div');
        item.className = 'analysis-result-item';
        item.id = `analysis-result-${Date.now()}`;
        item.innerHTML = `
            <div class="result-query">Analysis: ${query}</div>
            <div class="result-answer">${isLoading ? '<span class="loading"></span> ' : ''}${result}</div>
            <div class="result-timestamp">${new Date().toLocaleTimeString()}</div>
        `;
        
        container.insertBefore(item, container.firstChild);
    }

    updateLastAnalysisResult(result, isLoading) {
        const container = document.getElementById('analysis-results');
        const lastResult = container.querySelector('.analysis-result-item');
        
        if (lastResult) {
            const answerEl = lastResult.querySelector('.result-answer');
            answerEl.innerHTML = `${isLoading ? '<span class="loading"></span> ' : ''}${result}`;
        }
    }
}

// Initialize application when DOM is ready AND Neuroglancer is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM loaded, waiting for Neuroglancer...');
    
    let timeoutId;
    try {
        // Wait for Neuroglancer to load (with timeout)
        await Promise.race([
            window.neuroglancerLoading,
            new Promise((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Neuroglancer load timeout')), 
                    CONFIG.neuroglancer.loadTimeoutMs
                );
            })
        ]);
        console.log('✅ Neuroglancer library ready');
    } catch (error) {
        console.warn('⚠️ Neuroglancer failed to load:', error.message);
    } finally {
        // Always clear timeout to prevent memory leaks
        if (timeoutId) clearTimeout(timeoutId);
    }
    
    // Initialize app regardless of Neuroglancer status
    window.app = new NeuroglancerTourguide();
});
