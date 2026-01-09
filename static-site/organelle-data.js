/**
 * Organelle Data Manager
 * 
 * Handles loading and querying organelle metadata from public CSV files
 */

class OrganelleDataManager {
    constructor() {
        this.data = {};
        this.csvSources = {
            celegans: {
                // Example URLs - replace with actual public URLs
                mito: 'data/celegans_mito.csv',
                nucleus: 'data/celegans_nucleus.csv',
                er: 'data/celegans_er.csv'
            },
            hela: {
                mito: 'data/hela_mito.csv',
                nucleus: 'data/hela_nucleus.csv',
                er: 'data/hela_er.csv'
            }
        };
    }

    /**
     * Load organelle data for a specific dataset and type
     */
    async loadData(dataset, organelleType) {
        const cacheKey = `${dataset}-${organelleType}`;
        
        // Return cached data if available
        if (this.data[cacheKey]) {
            return this.data[cacheKey];
        }

        const csvUrl = this.csvSources[dataset]?.[organelleType];
        if (!csvUrl) {
            throw new Error(`No CSV source configured for ${dataset} - ${organelleType}`);
        }

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.statusText}`);
            }

            const csvText = await response.text();
            const parsed = this.parseCSV(csvText);
            
            // Cache the data
            this.data[cacheKey] = parsed;
            
            return parsed;
        } catch (error) {
            console.error(`Error loading organelle data:`, error);
            throw error;
        }
    }

    /**
     * Simple CSV parser (for basic CSV format)
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) {
            return [];
        }

        // Parse header
        const header = lines[0].split(',').map(h => h.trim());
        
        // Parse rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            
            header.forEach((key, index) => {
                const value = values[index];
                // Try to parse as number, otherwise keep as string
                row[key] = isNaN(value) ? value : parseFloat(value);
            });
            
            data.push(row);
        }
        
        return data;
    }

    /**
     * Query organelle data
     */
    async query(dataset, organelleType, filters = {}) {
        const data = await this.loadData(dataset, organelleType);
        
        // Apply filters
        let filtered = data;
        
        for (const [key, condition] of Object.entries(filters)) {
            filtered = filtered.filter(item => {
                const value = item[key];
                
                if (typeof condition === 'function') {
                    return condition(value);
                } else if (typeof condition === 'object') {
                    // Handle range queries: {min: x, max: y}
                    if (condition.min !== undefined && value < condition.min) return false;
                    if (condition.max !== undefined && value > condition.max) return false;
                    return true;
                } else {
                    // Exact match
                    return value === condition;
                }
            });
        }
        
        return filtered;
    }

    /**
     * Get statistics for organelle data
     */
    async getStats(dataset, organelleType, field) {
        const data = await this.loadData(dataset, organelleType);
        
        const values = data.map(item => item[field]).filter(v => typeof v === 'number');
        
        if (values.length === 0) {
            return null;
        }

        values.sort((a, b) => a - b);
        
        return {
            count: values.length,
            min: values[0],
            max: values[values.length - 1],
            mean: values.reduce((a, b) => a + b, 0) / values.length,
            median: values[Math.floor(values.length / 2)],
            sum: values.reduce((a, b) => a + b, 0)
        };
    }

    /**
     * Find organelles by criteria
     */
    async find(dataset, organelleType, criteria) {
        const data = await this.loadData(dataset, organelleType);
        
        // Sort by a field
        if (criteria.sortBy) {
            data.sort((a, b) => {
                const aVal = a[criteria.sortBy];
                const bVal = b[criteria.sortBy];
                return criteria.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });
        }
        
        // Limit results
        if (criteria.limit) {
            return data.slice(0, criteria.limit);
        }
        
        return data;
    }

    /**
     * Get the largest organelle
     */
    async getLargest(dataset, organelleType, field = 'volume') {
        const results = await this.find(dataset, organelleType, {
            sortBy: field,
            sortOrder: 'desc',
            limit: 1
        });
        return results[0];
    }

    /**
     * Get the smallest organelle
     */
    async getSmallest(dataset, organelleType, field = 'volume') {
        const results = await this.find(dataset, organelleType, {
            sortBy: field,
            sortOrder: 'asc',
            limit: 1
        });
        return results[0];
    }

    /**
     * Count organelles matching criteria
     */
    async count(dataset, organelleType, filters = {}) {
        const results = await this.query(dataset, organelleType, filters);
        return results.length;
    }

    /**
     * Configure custom CSV sources
     */
    setCSVSources(dataset, organelleType, url) {
        if (!this.csvSources[dataset]) {
            this.csvSources[dataset] = {};
        }
        this.csvSources[dataset][organelleType] = url;
    }

    /**
     * Clear cached data
     */
    clearCache() {
        this.data = {};
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrganelleDataManager;
}
