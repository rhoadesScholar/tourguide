/**
 * Neuroglancer Tourguide - Static Site Application
 * 
 * This is a standalone static site version that uses:
 * - Neuroglancer JS library (standalone)
 * - Public S3 Zarr datasets (CORS-enabled)
 * - Client-side LLM API calls (Anthropic, OpenAI, Google)
 * - Public CSV files for organelle data
 */

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
        
        // Initialize Neuroglancer viewer
        this.initViewer();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Load API configuration UI state
        this.updateAPIStatus();
        
        console.log('✅ Initialization complete');
    }

    initViewer() {
        console.log('🧠 Initializing Neuroglancer viewer...');
        
        const container = document.getElementById('neuroglancer-container');
        
        // Create Neuroglancer viewer with default state
        this.viewer = new neuroglancer.Viewer(container, {
            showLayerDialog: true,
            showLayerPanel: true,
            showHelpButton: true,
        });
        
        // Load initial dataset
        this.loadDataset(this.currentDataset);
        
        // Setup state change listener
        this.viewer.state.changed.add(() => {
            this.onViewerStateChanged();
        });
        
        console.log('✅ Neuroglancer viewer initialized');
    }

    loadDataset(datasetName) {
        console.log(`📊 Loading dataset: ${datasetName}`);
        
        this.currentDataset = datasetName;
        
        // Clear existing layers
        this.viewer.layerManager.clear();
        
        if (datasetName === 'celegans') {
            this.loadCelegansDataset();
        } else if (datasetName === 'hela') {
            this.loadHelaDataset();
        }
        
        console.log(`✅ Dataset loaded: ${datasetName}`);
    }

    loadCelegansDataset() {
        // C. elegans comma stage embryo EM data
        // Using public CORS-compatible Janelia CellMap data
        const baseUrl = 'zarr://https://cellmap-vm1.int.janelia.org/nrs/data/jrc_c-elegans-op50-1/jrc_c-elegans-op50-1.zarr/recon-1';
        
        // Add EM layer
        this.viewer.layerManager.addManagedLayer(
            this.viewer.layerSpecification.getLayer('fibsem-int16', {
                type: 'image',
                source: `${baseUrl}/em/fibsem-int16/`,
                shader: '#uicontrol invlerp normalized\nvoid main() { emitGrayscale(normalized()); }'
            })
        );
        
        // Add organelle segmentation layers
        const segBase = `${baseUrl}/labels/inference/segmentations`;
        const organelles = ['cell', 'ld', 'lyso', 'mito', 'nuc', 'perox', 'yolk'];
        
        organelles.forEach(organelle => {
            this.viewer.layerManager.addManagedLayer(
                this.viewer.layerSpecification.getLayer(organelle, {
                    type: 'segmentation',
                    source: `${segBase}/${organelle}/`,
                    visible: false
                })
            );
        });
        
        // Set initial position (center of dataset)
        this.viewer.navigationState.position.value = [5000, 5000, 5000];
        this.viewer.navigationState.zoomFactor.value = 10;
    }

    loadHelaDataset() {
        // HeLa-2 cell EM data from public S3 bucket
        const baseUrl = 's3://janelia-cosem-datasets/jrc_hela-2/jrc_hela-2';
        
        // Add EM layer
        this.viewer.layerManager.addManagedLayer(
            this.viewer.layerSpecification.getLayer('fibsem-uint8', {
                type: 'image',
                source: `zarr://${baseUrl}.zarr/recon-1/em/fibsem-uint8/`,
                shader: '#uicontrol invlerp normalized\nvoid main() { emitGrayscale(normalized()); }'
            })
        );
        
        // Add organelle segmentation layers (N5 format)
        const organelles = ['endo_seg', 'er_seg', 'golgi_seg', 'mito_seg', 'nucleus_seg', 'pm_seg', 'vesicle_seg'];
        
        organelles.forEach(organelle => {
            this.viewer.layerManager.addManagedLayer(
                this.viewer.layerSpecification.getLayer(organelle, {
                    type: 'segmentation',
                    source: `n5://${baseUrl}.n5/labels/${organelle}`,
                    visible: false
                })
            );
        });
        
        // Set initial position for HeLa dataset
        this.viewer.navigationState.position.value = [5000, 5000, 2500];
        this.viewer.navigationState.zoomFactor.value = 10;
    }

    onViewerStateChanged() {
        // Update state display
        this.updateStateDisplay();
    }

    updateStateDisplay() {
        const stateInfo = document.getElementById('state-info');
        
        // Get current state
        const position = this.viewer.navigationState.position.value;
        const zoom = this.viewer.navigationState.zoomFactor.value;
        const layers = [];
        
        this.viewer.layerManager.managedLayers.forEach(layer => {
            layers.push({
                name: layer.name,
                visible: layer.visible
            });
        });
        
        // Update display
        stateInfo.innerHTML = `
            <div class="state-section">
                <h3>Position</h3>
                <p>X: ${position[0].toFixed(0)}, Y: ${position[1].toFixed(0)}, Z: ${position[2].toFixed(0)}</p>
            </div>
            <div class="state-section">
                <h3>Zoom</h3>
                <p>${zoom.toFixed(2)}x</p>
            </div>
            <div class="state-section">
                <h3>Layers (${layers.length})</h3>
                <ul>
                    ${layers.map(l => `<li>${l.name} ${l.visible ? '✓' : '✗'}</li>`).join('')}
                </ul>
            </div>
        `;
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
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
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
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        return true;
    }

    async testOpenAIAPI() {
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
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        return true;
    }

    async testGoogleAPI() {
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
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        return true;
    }

    async captureScreenshot() {
        console.log('📸 Capturing screenshot...');
        
        try {
            // Use Neuroglancer's screenshot capability
            const canvas = document.querySelector('#neuroglancer-container canvas');
            if (!canvas) {
                throw new Error('Canvas not found');
            }
            
            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
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
            alert('Failed to capture screenshot: ' + error.message);
        }
    }

    getCurrentState() {
        const position = this.viewer.navigationState.position.value;
        const zoom = this.viewer.navigationState.zoomFactor.value;
        
        return {
            position: [position[0], position[1], position[2]],
            zoom,
            dataset: this.currentDataset
        };
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
                <p><strong>Zoom:</strong> ${screenshot.state.zoom.toFixed(2)}x</p>
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
The current position is ${screenshot.state.position.map(p => p.toFixed(0)).join(', ')} at ${screenshot.state.zoom.toFixed(2)}x zoom.
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
The current position is ${screenshot.state.position.map(p => p.toFixed(0)).join(', ')} at ${screenshot.state.zoom.toFixed(2)}x zoom.
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
The current position is ${screenshot.state.position.map(p => p.toFixed(0)).join(', ')} at ${screenshot.state.zoom.toFixed(2)}x zoom.
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

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuroglancerTourguide();
});
