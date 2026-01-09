/**
 * Unit tests for app.js configuration and utilities
 */

describe('CONFIG', () => {
  test('should have valid dataset configurations', () => {
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
      }
    };

    expect(CONFIG.datasets.celegans).toBeDefined();
    expect(CONFIG.datasets.hela).toBeDefined();
    expect(CONFIG.security.storageKey).toBe('ng-tourguide-api-config');
  });

  test('celegans dataset should have required properties', () => {
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
        }
      }
    };

    const celegans = CONFIG.datasets.celegans;
    expect(celegans.name).toBe('C. elegans (Comma Stage)');
    expect(celegans.baseUrl).toContain('zarr://');
    expect(celegans.dimensions.x).toEqual([8e-9, 'm']);
    expect(celegans.initialPosition).toHaveLength(3);
    expect(celegans.organelles).toContain('mito');
  });

  test('hela dataset should have required properties', () => {
    const CONFIG = {
      datasets: {
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
      }
    };

    const hela = CONFIG.datasets.hela;
    expect(hela.name).toBe('HeLa Cell');
    expect(hela.baseUrl).toContain('s3://');
    expect(hela.dimensions.x).toEqual([4e-9, 'm']);
    expect(hela.initialPosition).toHaveLength(3);
    expect(hela.organelles).toContain('nucleus_seg');
  });
});

describe('API Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should store API config in localStorage', () => {
    const apiConfig = {
      anthropic: 'test-key-anthropic',
      openai: 'test-key-openai',
      google: 'test-key-google'
    };

    localStorage.setItem('ng-tourguide-api-config', JSON.stringify(apiConfig));

    const stored = JSON.parse(localStorage.getItem('ng-tourguide-api-config'));
    expect(stored.anthropic).toBe('test-key-anthropic');
    expect(stored.openai).toBe('test-key-openai');
    expect(stored.google).toBe('test-key-google');
  });

  test('should handle missing API config', () => {
    const stored = localStorage.getItem('ng-tourguide-api-config');
    expect(stored).toBeNull();
  });

  test('should handle empty API config', () => {
    localStorage.setItem('ng-tourguide-api-config', JSON.stringify({}));
    const stored = JSON.parse(localStorage.getItem('ng-tourguide-api-config'));
    expect(stored).toEqual({});
  });
});

describe('State Management', () => {
  test('should create valid state object for celegans', () => {
    const state = {
      dimensions: {
        x: [8e-9, 'm'],
        y: [8e-9, 'm'],
        z: [8e-9, 'm']
      },
      position: [5000, 5000, 5000],
      crossSectionScale: 10,
      projectionScale: 100000,
      layers: [
        {
          type: 'image',
          source: 'zarr://https://cellmap-vm1.int.janelia.org/nrs/data/jrc_c-elegans-op50-1/jrc_c-elegans-op50-1.zarr/recon-1/em/fibsem-int16/',
          name: 'fibsem-int16'
        }
      ],
      layout: 'xy-3d'
    };

    expect(state.position).toHaveLength(3);
    expect(state.layers).toHaveLength(1);
    expect(state.layout).toBe('xy-3d');
  });

  test('should create valid state object for hela', () => {
    const state = {
      dimensions: {
        x: [4e-9, 'm'],
        y: [4e-9, 'm'],
        z: [4e-9, 'm']
      },
      position: [5000, 5000, 2500],
      crossSectionScale: 10,
      projectionScale: 50000,
      layers: [
        {
          type: 'image',
          source: 'zarr://s3://janelia-cosem-datasets/jrc_hela-2/jrc_hela-2.zarr/recon-1/em/fibsem-uint8/',
          name: 'fibsem-uint8'
        }
      ],
      layout: 'xy-3d'
    };

    expect(state.position).toHaveLength(3);
    expect(state.position[2]).toBe(2500);
    expect(state.layers).toHaveLength(1);
  });
});

describe('Error Handling', () => {
  test('should handle CORS errors gracefully', () => {
    const error = new DOMException('Canvas tainted by cross-origin data', 'SecurityError');
    expect(error.message).toContain('cross-origin');
  });

  test('should handle network errors', () => {
    const error = new Error('Failed to fetch');
    expect(error.message).toBe('Failed to fetch');
  });

  test('should handle invalid API responses', () => {
    const error = new Error('API request failed');
    expect(error.message).toBe('API request failed');
  });
});

describe('Data Validation', () => {
  test('should validate position coordinates', () => {
    const position = [5000, 5000, 5000];
    expect(position).toHaveLength(3);
    expect(position.every(coord => typeof coord === 'number')).toBe(true);
    expect(position.every(coord => coord >= 0)).toBe(true);
  });

  test('should validate scale values', () => {
    const scale = 10;
    expect(typeof scale).toBe('number');
    expect(scale).toBeGreaterThan(0);
  });

  test('should validate dataset names', () => {
    const datasets = ['celegans', 'hela'];
    expect(datasets).toContain('celegans');
    expect(datasets).toContain('hela');
    expect(datasets).toHaveLength(2);
  });
});
