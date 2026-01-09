# Neuroglancer Tourguide - Static Site

A standalone static site version of Neuroglancer Tourguide that can be deployed anywhere without a backend server.

## Features

✨ **Fully Static** - No server-side code required
🧠 **Neuroglancer JS** - Uses the standalone JavaScript library
☁️ **Public Data** - CORS-compatible S3 Zarr datasets from Janelia CellMap
🔑 **Client-Side APIs** - Direct integration with Anthropic, OpenAI, and Google AI APIs
📊 **Interactive Visualization** - Real-time EM data exploration
🎙️ **AI Narration** - Context-aware descriptions using your choice of AI provider

## Quick Start

### 1. Download or Clone

```bash
git clone https://github.com/rhoadesScholar/tourguide.git
cd tourguide/static-site
```

### 2. Serve Locally

You can use any static file server. Here are a few options:

**Python:**
```bash
python -m http.server 8080
```

**Node.js (http-server):**
```bash
npx http-server -p 8080
```

**PHP:**
```bash
php -S localhost:8080
```

### 3. Open in Browser

Navigate to `http://localhost:8080`

### 4. Configure API Keys

Click the **⚙️ API Settings** button in the header and add your API key:

- **Anthropic Claude**: Get from [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI GPT**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Google Gemini**: Get from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

**Authentication Method**: This application uses **direct API authentication** where you provide your own API keys from the AI service providers. Your keys are stored locally in your browser (localStorage) and are only sent directly to the AI provider you configure (Anthropic, OpenAI, or Google). No intermediate authentication portal is used - you authenticate directly with each supplier's portal to obtain your keys.

**Security**: API keys never leave your computer except when making requests to the AI provider you've configured. They are not sent to any other servers.

## Deployment

This static site can be deployed to any static hosting service:

### GitHub Pages (Automatic Deployment)

This repository includes a GitHub Actions workflow that automatically deploys the static site to GitHub Pages when changes are pushed to the main branch.

**Setup (One-time):**

1. Go to your repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy on push to main

**Accessing the site:**
- URL: `https://rhoadesscholar.github.io/tourguide/`
- Updates automatically when you push changes to `static-site/` in the main branch

**Manual deployment:**
You can also trigger deployment manually:
1. Go to **Actions** tab
2. Select "Deploy Static Site to GitHub Pages"
3. Click "Run workflow"

### Netlify

1. Drag and drop the `static-site` folder to [netlify.com](https://www.netlify.com/)
2. Or connect your Git repository
3. Set publish directory to `static-site`
4. Deploy!

### Vercel

```bash
cd static-site
vercel deploy
```

### Amazon S3 + CloudFront

1. Upload files to S3 bucket
2. Enable static website hosting
3. Configure CloudFront distribution (optional)
4. Access via S3 endpoint or CloudFront URL

### Any Web Server

Simply copy all files from the `static-site` directory to your web server's document root.

## Data Sources

The application uses public, CORS-compatible datasets from Janelia Research Campus:

### C. elegans (Default)
- **Source**: Janelia CellMap - jrc_c-elegans-op50-1
- **Data**: EM imagery and organelle segmentations
- **Organelles**: Cell, lipid droplets, lysosomes, mitochondria, nucleus, peroxisomes, yolk

### HeLa Cell
- **Source**: Janelia COSEM - jrc_hela-2
- **Data**: EM imagery and organelle segmentations (N5 format)
- **Organelles**: Endosomes, ER, Golgi, mitochondria, nucleus, plasma membrane, vesicles

All data is served directly from public S3 buckets with CORS enabled.

## Features

### 🔭 Explore Mode
- **Live Screenshots**: Capture and save views with one click
- **AI Narrations**: Automatic context-aware descriptions of what you're viewing
- **State Tracking**: Monitor position, zoom level, and active layers
- **History**: Keep track of all screenshots and narrations

### 💬 Query Mode
- **Natural Language**: Ask questions about organelles in plain English
- **AI-Powered**: Uses your configured AI provider to interpret and respond
- **Examples**:
  - "What organelles are visible in this view?"
  - "Explain the mitochondrial structure"
  - "What is the scale of this image?"

### 📊 Analysis Mode
- **Data Insights**: Request analysis of organelle data
- **AI-Powered**: Describes potential analyses and visualizations
- **Examples**:
  - "Plot the volume distribution of mitochondria"
  - "Compare nucleus sizes"
  - "Show mitochondria surface area statistics"

*Note: Full analysis mode with code execution requires the Python backend. The static version provides AI-generated explanations of what analyses would be performed.*

## Configuration

### API Keys Storage

API keys are stored in your browser's `localStorage` and never leave your computer except when making requests to the AI provider you've configured.

To clear stored keys:
```javascript
localStorage.removeItem('ng-tourguide-api-config');
```

### Customizing Data Sources

To add or modify datasets, edit the `app.js` file:

```javascript
// Add a new dataset
loadCustomDataset() {
    const baseUrl = 'your-zarr-url-here';
    
    this.viewer.layerManager.addManagedLayer(
        this.viewer.layerSpecification.getLayer('my-layer', {
            type: 'image',
            source: `${baseUrl}/path/to/data/`,
        })
    );
}
```

### Organelle Data CSV Files

For query features that need organelle metadata, you can configure public CSV file URLs in a future update. Currently, the query mode provides AI-generated responses based on general knowledge of the datasets.

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Older browsers may have limited WebGL support

## Privacy & Security

- **Local Storage**: API keys stored in browser localStorage
- **Direct API Calls**: Your browser connects directly to AI providers
- **No Tracking**: No analytics or tracking scripts
- **HTTPS Required**: For API calls to work, serve over HTTPS in production
- **CORS**: All data sources have CORS enabled for browser access

### API Authentication Model

This application uses **direct supplier authentication** - you obtain API keys directly from each AI service provider's portal:

1. **Anthropic Claude**: Visit [console.anthropic.com](https://console.anthropic.com/) and create an API key
2. **OpenAI GPT**: Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys) and create an API key  
3. **Google Gemini**: Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and create an API key

**No intermediate authentication portal is used.** Your API keys are:
- ✅ Stored only in your browser's localStorage
- ✅ Never sent to any server except the AI provider you configured
- ✅ Under your complete control (you can clear them anytime)
- ✅ Managed directly through each supplier's authentication portal

This approach ensures maximum security and privacy, as your credentials never pass through any intermediate service.

## Limitations

Compared to the full Python backend version, this static site:

- ✅ No server setup required
- ✅ Can be hosted anywhere
- ✅ Direct AI API access
- ❌ No real-time WebSocket streaming
- ❌ No local Ollama support (cloud APIs only)
- ❌ No Python code execution for analysis
- ❌ No video recording features
- ❌ Requires CSV organelle data to be publicly accessible

## Development

To modify or extend the static site:

1. **HTML**: Edit `index.html` for structure
2. **CSS**: Edit `style.css` for styling
3. **JavaScript**: Edit `app.js` for functionality

### Testing

The static site includes comprehensive tests:

```bash
cd static-site
npm install

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Run all tests
npm run test:all
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

### Key Classes

- `NeuroglancerTourguide`: Main application class
- `initViewer()`: Initializes Neuroglancer
- `loadDataset()`: Loads EM datasets
- `captureScreenshot()`: Captures and processes screenshots
- `generateNarration()`: Creates AI narrations
- API methods: `queryAnthropic()`, `queryOpenAI()`, `queryGoogle()`

### Adding New Features

```javascript
// Example: Add a new mode
switchMode('mymode') {
    this.currentMode = 'mymode';
    document.getElementById('mymode-panel').style.display = 'flex';
}
```

## Troubleshooting

### "API request failed"
- Check that your API key is correct
- Ensure you have API credits/quota remaining
- Check browser console for detailed errors

### Neuroglancer not loading
- Check browser console for WebGL errors
- Try a different browser
- Ensure you're serving over HTTP/HTTPS (not file://)

### CORS errors
- The included datasets have CORS enabled
- If adding custom data, ensure CORS is configured on your data source
- Use a proper web server (not file:// protocol)

### Screenshot not working
- Ensure WebGL canvas is loaded
- Check that Neuroglancer viewer is fully initialized
- Try zooming or moving the view first

## Credits

- **Neuroglancer**: Google Connectomics Team
- **Data**: Janelia Research Campus - CellMap & COSEM teams
- **Original Tourguide**: Python backend version in parent directory

## License

BSD 3-Clause License - see LICENSE file in repository root

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Support

For issues or questions:
- Open an issue on GitHub
- Check the main repository documentation
- Refer to Neuroglancer documentation

## Links

- [Neuroglancer Documentation](https://github.com/google/neuroglancer)
- [Janelia CellMap](https://www.janelia.org/project-team/cellmap)
- [Anthropic Claude API](https://www.anthropic.com/api)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Gemini API](https://ai.google.dev/)
