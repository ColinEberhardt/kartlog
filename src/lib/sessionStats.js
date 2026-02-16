/**
 * Calculate statistics for items (tyres or engines) based on sessions data
 * @param {Array} sessions - Array of session objects
 * @param {string} itemIdField - Field name to extract item ID from ('tyreId' or 'engineId')
 * @returns {Object} Statistics object with itemId as keys
 */
export function calculateItemStats(sessions, itemIdField) {
  const itemStats = {};
  
  sessions.forEach(session => {
    const itemId = session[itemIdField];
    const laps = session.laps || 0;
    
    if (itemId) {
      if (!itemStats[itemId]) {
        itemStats[itemId] = {
          totalLaps: 0,
          sessions: 0
        };
      }
      itemStats[itemId].totalLaps += laps;
      itemStats[itemId].sessions += 1;
    }
  });
  
  return itemStats;
}

/**
 * Merge items with their calculated statistics
 * @param {Array} items - Array of items (tyres or engines)
 * @param {Object} stats - Statistics object from calculateItemStats
 * @returns {Array} Items with added totalLaps and sessions properties
 */
export function mergeItemsWithStats(items, stats) {
  return items.map(item => ({
    ...item,
    totalLaps: (item.initialLaps || 0) + (stats[item.id]?.totalLaps || 0),
    sessions: stats[item.id]?.sessions || 0
  }));
}
