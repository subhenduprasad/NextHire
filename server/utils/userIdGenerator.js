/**
 * Generates a unique random suffix of 4 alphanumeric characters (lowercase a-z, 0-9).
 */
const generateRandomSuffix = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return suffix;
};

/**
 * Cleans a name to a lowercase alphanumeric string, capped at 8 characters.
 * @param {string} name 
 * @param {string} fallback 
 */
export const cleanBaseName = (name, fallback = 'user') => {
    if (!name) return fallback;
    // Strip non-alphanumeric, convert to lowercase
    let cleaned = name.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleaned) return fallback;
    return cleaned.slice(0, 8);
};

/**
 * Generates a unique userId for a given model.
 * Format: cleanBaseName(max 8 chars) + 4 alphanumeric characters suffix
 * @param {string} rawName 
 * @param {object} Model - Mongoose model to verify uniqueness against
 * @param {string} fallback 
 */
export const generateUniqueUserId = async (rawName, Model, fallback = 'user') => {
    // If the rawName has spaces, take the first word as the candidate for firstName or shortName
    let base = rawName || '';
    if (typeof base === 'string') {
        base = base.trim().split(/\s+/)[0];
    }
    
    const cleanedBase = cleanBaseName(base, fallback);
    let userId = '';
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 100) {
        userId = `${cleanedBase}${generateRandomSuffix()}`;
        const existing = await Model.findOne({ userId });
        if (!existing) {
            isUnique = true;
        }
        attempts++;
    }
    
    // Safety fallback in extreme cases of collision
    if (!isUnique) {
        userId = `${cleanedBase}${Date.now().toString(36).slice(-4)}`;
    }
    
    return userId;
};
