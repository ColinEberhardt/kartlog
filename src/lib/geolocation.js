// Geolocation service for karting application
// Provides browser-based location access and distance calculations

// Module-level state (session cache per FR-015)
let cachedPermissionStatus = null;

/**
 * Get user's current location from browser Geolocation API
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, timestamp: number}>}
 * @throws {Error} with code property (1=denied, 2=unavailable, 3=timeout, 0=not supported)
 */
export async function getCurrentLocation() {
  // Feature detection
  if (!('geolocation' in navigator)) {
    const error = Object.assign(
      new Error('Geolocation not supported in this browser'),
      { code: 0 }
    );
    throw error;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedPermissionStatus = 'granted';
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        // Map browser error codes to cached state
        if (error.code === 1) {
          cachedPermissionStatus = 'denied';
        }
        reject(error);
      },
      {
        enableHighAccuracy: true,  // Request GPS if available
        timeout: 10000,             // 10 second timeout per FR-014
        maximumAge: 0               // Don't use cached position per FR-016
      }
    );
  });
}

/**
 * Calculate great-circle distance between two points using Haversine formula
 * @param {number} lat1 - First latitude in decimal degrees
 * @param {number} lon1 - First longitude in decimal degrees
 * @param {number} lat2 - Second latitude in decimal degrees
 * @param {number} lon2 - Second longitude in decimal degrees
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Find nearest circuit to user's location within 50km threshold
 * @param {{latitude: number, longitude: number}} userLocation - User's current location
 * @param {Array<{id: string, latitude: number, longitude: number}>} circuits - Array of circuit objects
 * @returns {Object|null} Nearest circuit or null if none within 50km
 */
export function findNearestCircuit(userLocation, circuits) {
  if (!circuits || circuits.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const circuit of circuits) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      circuit.latitude,
      circuit.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = circuit;
    }
  }

  // Return null if nearest circuit is >50km away (per FR-003)
  return minDistance <= 50 ? nearest : null;
}

/**
 * Get cached permission status (avoid repeated prompts per FR-015)
 * @returns {'granted'|'denied'|'prompt'|null}
 */
export function getPermissionStatus() {
  return cachedPermissionStatus;
}
