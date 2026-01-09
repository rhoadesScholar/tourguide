# Organelle Data Configuration

This configuration file specifies public CSV files containing organelle metadata.

## CSV Format

CSV files should contain the following columns:
- `id`: Unique organelle identifier
- `type`: Organelle type (e.g., mitochondrion, nucleus, etc.)
- `volume`: Volume in nm³
- `surface_area`: Surface area in nm²
- `x`, `y`, `z`: Centroid position coordinates
- Additional columns as needed

## Public CSV URLs

For the static site to access organelle data, CSV files must be:
1. Publicly accessible via HTTPS
2. Served with CORS headers enabled
3. In standard CSV format

### Example Configuration

```javascript
// Add to app.js to enable organelle data loading
const ORGANELLE_DATA_SOURCES = {
    'celegans': {
        'mitochondria': 'https://example.com/data/celegans_mito.csv',
        'nucleus': 'https://example.com/data/celegans_nucleus.csv',
        'peroxisomes': 'https://example.com/data/celegans_perox.csv'
    },
    'hela': {
        'mitochondria': 'https://example.com/data/hela_mito.csv',
        'nucleus': 'https://example.com/data/hela_nucleus.csv',
        'er': 'https://example.com/data/hela_er.csv'
    }
};
```

## Hosting Options

### GitHub Pages
1. Add CSV files to your repository
2. Enable GitHub Pages
3. Access via: `https://username.github.io/repo/data/file.csv`

### S3 with CORS
1. Upload CSV to S3 bucket
2. Configure CORS policy:
```json
{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
}
```
3. Make bucket/objects public
4. Access via S3 URL

### Google Cloud Storage
1. Upload CSV to GCS bucket
2. Make objects public
3. Enable CORS if needed
4. Access via GCS URL

### Any HTTPS Server
Simply host CSV files on any web server with CORS enabled.

## Example CSV Structure

```csv
id,type,volume,surface_area,x,y,z
1,mitochondrion,1500000,45000,5234,6123,4567
2,mitochondrion,2100000,52000,5456,6234,4678
3,nucleus,8500000,120000,5123,6234,4789
```

## Implementation Notes

To implement CSV loading in the static site:

1. Add CSV parsing library (e.g., PapaParse):
```html
<script src="https://unpkg.com/papaparse@5.4.1/papaparse.min.js"></script>
```

2. Add CSV loading function to app.js:
```javascript
async loadOrganelleData(csvUrl) {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true });
    return parsed.data;
}
```

3. Use the data for queries:
```javascript
async processQuery(query) {
    const data = await this.loadOrganelleData(ORGANELLE_DATA_SOURCES[this.currentDataset]['mitochondria']);
    // Process query with data...
}
```

## Future Enhancements

- [ ] Add CSV loading library
- [ ] Implement data caching in IndexedDB
- [ ] Add CSV validation
- [ ] Support multiple CSV formats
- [ ] Add data preprocessing
- [ ] Implement search/filter functionality
- [ ] Add data visualization charts
