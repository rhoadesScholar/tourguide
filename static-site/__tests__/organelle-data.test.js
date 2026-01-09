/**
 * Unit tests for OrganelleDataManager
 */

// Load the organelle-data.js file
const fs = require('fs');
const path = require('path');
const organelleDataCode = fs.readFileSync(
  path.join(__dirname, '../organelle-data.js'),
  'utf8'
);

// Evaluate the code in the test environment
eval(organelleDataCode);

describe('OrganelleDataManager', () => {
  let manager;

  beforeEach(() => {
    manager = new OrganelleDataManager();
  });

  describe('Constructor', () => {
    test('should initialize with default CSV sources', () => {
      expect(manager.csvSources).toBeDefined();
      expect(manager.csvSources.celegans).toBeDefined();
      expect(manager.csvSources.hela).toBeDefined();
      expect(manager.data).toEqual({});
    });
  });

  describe('parseCSV', () => {
    test('should parse valid CSV data', () => {
      const csvText = `id,type,volume,surface_area,x,y,z
1,mitochondrion,1500000,45000,5234,6123,4567
2,mitochondrion,2100000,52000,5456,6234,4678`;

      const result = manager.parseCSV(csvText);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        type: 'mitochondrion',
        volume: 1500000,
        surface_area: 45000,
        x: 5234,
        y: 6123,
        z: 4567
      });
    });

    test('should handle empty strings correctly', () => {
      const csvText = `id,name,value
1,test,100
2,,200`;

      const result = manager.parseCSV(csvText);

      expect(result[1].name).toBe('');
      expect(result[1].value).toBe(200);
    });

    test('should return empty array for empty CSV', () => {
      const result = manager.parseCSV('');
      expect(result).toEqual([]);
    });

    test('should handle CSV with only headers', () => {
      const csvText = 'id,type,volume';
      const result = manager.parseCSV(csvText);
      expect(result).toEqual([]);
    });
  });

  describe('loadData', () => {
    test('should fetch and cache CSV data', async () => {
      const mockCsvData = `id,type,volume
1,mito,1000
2,mito,2000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      const result = await manager.loadData('celegans', 'mito');

      expect(fetch).toHaveBeenCalledWith('data/celegans_mito.csv');
      expect(result).toHaveLength(2);
      expect(result[0].volume).toBe(1000);
    });

    test('should return cached data on second call', async () => {
      const mockCsvData = `id,type,volume
1,mito,1000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
      const result = await manager.loadData('celegans', 'mito');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    test('should throw error for missing CSV source', async () => {
      await expect(
        manager.loadData('invalid', 'organelle')
      ).rejects.toThrow('No CSV source configured');
    });

    test('should throw error on fetch failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(
        manager.loadData('celegans', 'mito')
      ).rejects.toThrow('Failed to fetch CSV');
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      const mockCsvData = `id,type,volume,x
1,mito,1000,100
2,mito,2000,200
3,mito,3000,300`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
    });

    test('should filter data with exact match', async () => {
      const result = await manager.query('celegans', 'mito', { id: 1 });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('should filter data with range query', async () => {
      const result = await manager.query('celegans', 'mito', {
        volume: { min: 1500, max: 2500 }
      });
      expect(result).toHaveLength(1);
      expect(result[0].volume).toBe(2000);
    });

    test('should filter data with function', async () => {
      const result = await manager.query('celegans', 'mito', {
        volume: (v) => v > 2000
      });
      expect(result).toHaveLength(1);
      expect(result[0].volume).toBe(3000);
    });

    test('should return all data with no filters', async () => {
      const result = await manager.query('celegans', 'mito');
      expect(result).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const mockCsvData = `id,volume
1,1000
2,2000
3,3000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
    });

    test('should calculate statistics correctly', async () => {
      const stats = await manager.getStats('celegans', 'mito', 'volume');

      expect(stats.count).toBe(3);
      expect(stats.min).toBe(1000);
      expect(stats.max).toBe(3000);
      expect(stats.mean).toBe(2000);
      expect(stats.median).toBe(2000);
      expect(stats.sum).toBe(6000);
    });

    test('should return null for non-numeric field', async () => {
      const stats = await manager.getStats('celegans', 'mito', 'nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      const mockCsvData = `id,volume
3,3000
1,1000
2,2000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
    });

    test('should sort data ascending', async () => {
      const result = await manager.find('celegans', 'mito', {
        sortBy: 'volume',
        sortOrder: 'asc'
      });

      expect(result[0].volume).toBe(1000);
      expect(result[2].volume).toBe(3000);
    });

    test('should sort data descending', async () => {
      const result = await manager.find('celegans', 'mito', {
        sortBy: 'volume',
        sortOrder: 'desc'
      });

      expect(result[0].volume).toBe(3000);
      expect(result[2].volume).toBe(1000);
    });

    test('should limit results', async () => {
      const result = await manager.find('celegans', 'mito', {
        limit: 2
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('getLargest', () => {
    beforeEach(async () => {
      const mockCsvData = `id,volume
1,1000
2,3000
3,2000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
    });

    test('should return largest organelle by volume', async () => {
      const result = await manager.getLargest('celegans', 'mito', 'volume');
      expect(result.volume).toBe(3000);
      expect(result.id).toBe(2);
    });
  });

  describe('getSmallest', () => {
    beforeEach(async () => {
      const mockCsvData = `id,volume
1,1000
2,3000
3,2000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
    });

    test('should return smallest organelle by volume', async () => {
      const result = await manager.getSmallest('celegans', 'mito', 'volume');
      expect(result.volume).toBe(1000);
      expect(result.id).toBe(1);
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      const mockCsvData = `id,volume
1,1000
2,2000
3,3000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
    });

    test('should count all organelles', async () => {
      const count = await manager.count('celegans', 'mito');
      expect(count).toBe(3);
    });

    test('should count filtered organelles', async () => {
      const count = await manager.count('celegans', 'mito', {
        volume: { min: 2000 }
      });
      expect(count).toBe(2);
    });
  });

  describe('setCSVSources', () => {
    test('should set custom CSV source', () => {
      manager.setCSVSources('custom', 'organelle', 'http://example.com/data.csv');
      expect(manager.csvSources.custom.organelle).toBe('http://example.com/data.csv');
    });

    test('should create new dataset if not exists', () => {
      manager.setCSVSources('newdataset', 'mito', 'http://example.com/mito.csv');
      expect(manager.csvSources.newdataset).toBeDefined();
      expect(manager.csvSources.newdataset.mito).toBe('http://example.com/mito.csv');
    });
  });

  describe('clearCache', () => {
    test('should clear all cached data', async () => {
      const mockCsvData = `id,volume
1,1000`;

      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsvData
      });

      await manager.loadData('celegans', 'mito');
      expect(Object.keys(manager.data)).toHaveLength(1);

      manager.clearCache();
      expect(manager.data).toEqual({});
    });
  });
});
