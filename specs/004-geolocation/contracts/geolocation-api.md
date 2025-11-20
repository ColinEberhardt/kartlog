# API Contract: Geolocation Service

**Module**: `src/lib/geolocation.js`  
**Type**: Client-side JavaScript module  
**Purpose**: Provide geolocation functionality and distance calculations

---

## Function: getCurrentLocation

**Description**: Request user's current location from browser Geolocation API with timeout and error handling.

**Signature**:
```javascript
async function getCurrentLocation(): Promise<GeolocationResult>
```

**Parameters**: None

**Returns**:
```typescript
interface GeolocationResult {
  latitude: number;      // Decimal degrees, range: -90 to 90
  longitude: number;     // Decimal degrees, range: -180 to 180
  accuracy: number;      // Accuracy radius in meters (e.g., 20, 5000)
  timestamp: number;     // Unix timestamp in milliseconds
}
```

**Throws**:
```typescript
interface GeolocationError extends Error {
  code: number;          // 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
  message: string;       // User-friendly error message
}
```

**Error Codes**:
- `1` (PERMISSION_DENIED): User denied location permission
- `2` (POSITION_UNAVAILABLE): Device cannot determine location
- `3` (TIMEOUT): Location request exceeded 10-second timeout

**Behavior**:
- Requests high-accuracy position (GPS if available)
- Times out after 10 seconds (per spec FR-014)
- Does not use cached positions (`maximumAge: 0`)
- Caches permission status in module to avoid repeated prompts
- Accepts any accuracy level (per spec FR-016)

**Example Usage**:
```javascript
try {
  const location = await getCurrentLocation();
  console.log(`Location: ${location.latitude}, ${location.longitude}`);
  console.log(`Accuracy: ${location.accuracy}m`);
} catch (error) {
  if (error.code === 1) {
    console.log('Permission denied - falling back to manual input');
  } else if (error.code === 3) {
    console.log('Timeout - falling back to manual input');
  }
}
```

---

## Function: calculateDistance

**Description**: Calculate great-circle distance between two geographic coordinates using Haversine formula.

**Signature**:
```javascript
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number
```

**Parameters**:
- `lat1`: Latitude of first point in decimal degrees (-90 to 90)
- `lon1`: Longitude of first point in decimal degrees (-180 to 180)
- `lat2`: Latitude of second point in decimal degrees (-90 to 90)
- `lon2`: Longitude of second point in decimal degrees (-180 to 180)

**Returns**:
- `number`: Distance in kilometers (e.g., 2.5, 45.2, 120.8)

**Throws**: None (pure calculation, no side effects)

**Behavior**:
- Uses Haversine formula for spherical Earth approximation
- Accurate to ~0.3% for distances <1000km
- Handles edge cases (same point = 0km, antipodes = ~20,000km)
- Pure function (no state, no side effects)

**Example Usage**:
```javascript
const distance = calculateDistance(51.4545, 0.2156, 51.3656, 0.1963);
console.log(`Distance: ${distance.toFixed(2)}km`);
// Output: Distance: 10.24km
```

---

## Function: findNearestCircuit

**Description**: Find the nearest circuit to user's location from a list of circuits, within maximum distance threshold.

**Signature**:
```javascript
function findNearestCircuit(
  userLocation: GeolocationResult, 
  circuits: Circuit[]
): Circuit | null
```

**Parameters**:
- `userLocation`: User's current location (from `getCurrentLocation`)
- `circuits`: Array of circuit objects with `latitude` and `longitude` fields

**Circuit Type**:
```typescript
interface Circuit {
  id: string;           // Firestore document ID
  name: string;         // Circuit name
  latitude: number;     // Circuit latitude
  longitude: number;    // Circuit longitude
  // ... other fields ignored
}
```

**Returns**:
- `Circuit | null`: Nearest circuit if found within 50km, otherwise `null`

**Behavior**:
- Calculates distance from `userLocation` to each circuit
- Returns circuit with minimum distance
- Returns `null` if no circuits within 50km (per spec FR-003)
- If multiple circuits at same distance, returns first found (stable)
- Empty circuits array returns `null`

**Example Usage**:
```javascript
const userLocation = await getCurrentLocation();
const circuits = await getUserCircuits();
const nearest = findNearestCircuit(userLocation, circuits);

if (nearest) {
  console.log(`Nearest circuit: ${nearest.name} (ID: ${nearest.id})`);
  // Pre-select in dropdown
  circuitId = nearest.id;
} else {
  console.log('No circuits within 50km - manual selection required');
}
```

---

## Function: getPermissionStatus

**Description**: Get cached geolocation permission status without triggering permission prompt.

**Signature**:
```javascript
function getPermissionStatus(): 'granted' | 'denied' | 'prompt' | null
```

**Parameters**: None

**Returns**:
- `'granted'`: User previously granted permission
- `'denied'`: User previously denied permission
- `'prompt'`: Permission not yet requested
- `null`: Unknown (first page load)

**Behavior**:
- Returns cached status from previous `getCurrentLocation` call
- Does not trigger browser permission prompt
- Resets to `null` on page refresh (session-scoped cache)
- Used to avoid showing "Use My Location" button when permission permanently denied

**Example Usage**:
```javascript
const status = getPermissionStatus();
if (status === 'denied') {
  // Hide "Use My Location" button, show message
  console.log('Location access denied - manual entry only');
}
```

---

## Function: formatCoordinates

**Description**: Format latitude/longitude for display in UI (6 decimal places).

**Signature**:
```javascript
function formatCoordinates(latitude: number, longitude: number): string
```

**Parameters**:
- `latitude`: Latitude in decimal degrees
- `longitude`: Longitude in decimal degrees

**Returns**:
- `string`: Formatted coordinates (e.g., "51.454500, 0.215600")

**Behavior**:
- Rounds to 6 decimal places (~0.1m accuracy)
- Includes sign (+/-) for clarity
- Comma-separated format

**Example Usage**:
```javascript
const formatted = formatCoordinates(51.4545, 0.2156);
console.log(formatted);
// Output: "51.454500, 0.215600"
```

---

## Module State (Internal)

**Note**: These are implementation details, not part of public API.

```javascript
// Module-level variables (not exported)
let cachedPermissionStatus = null;  // 'granted' | 'denied' | 'prompt' | null
let lastGeolocationError = null;    // GeolocationPositionError | null
```

**Purpose**:
- `cachedPermissionStatus`: Avoid repeated permission prompts per spec FR-015
- `lastGeolocationError`: Store last error for debugging/logging

**Lifetime**: Browser session (cleared on page refresh)

---

## Error Messages (User-Facing)

**Permission Denied**:
> "Location access is needed to automatically select the nearest circuit. Please enable location permissions in your browser settings to use this feature."

**Position Unavailable**:
> "Unable to determine your location. Please check that location services are enabled on your device."

**Timeout**:
> "Location request timed out. Please try again or enter coordinates manually."

**Browser Not Supported**:
> "Your browser does not support geolocation. Please enter coordinates manually."

---

## Performance Characteristics

| Operation | Time Complexity | Typical Duration |
|-----------|----------------|------------------|
| `getCurrentLocation()` | O(1) | 2-10 seconds (device-dependent) |
| `calculateDistance()` | O(1) | <1ms |
| `findNearestCircuit()` | O(n) where n = circuit count | <20ms for 20 circuits |
| `getPermissionStatus()` | O(1) | <1ms (memory read) |
| `formatCoordinates()` | O(1) | <1ms |

**Memory Usage**: <1KB (module state + function closures)

---

## Browser Compatibility

**Required**:
- `navigator.geolocation` (supported in Chrome 5+, Firefox 3.5+, Safari 5+, Edge 12+)
- Promise support (ES6)
- Math functions (built-in)

**Fallback**:
- Feature detection: `if ('geolocation' in navigator)`
- Graceful degradation to manual input if API unavailable

---

## Testing Contract

**Manual Test Scenarios** (per constitution):

1. **Happy Path**: 
   - Grant permission → Verify coordinates returned within 10s
   - Calculate distance → Verify matches online calculator (e.g., movable-type.co.uk)
   - Find nearest → Verify closest circuit pre-selected

2. **Permission Denied**:
   - Deny permission → Verify error thrown with code 1
   - Verify manual input still functional

3. **Timeout**:
   - Slow network → Verify timeout at 10s
   - Verify fallback to manual input

4. **Edge Cases**:
   - Same coordinates → Distance = 0km
   - Antipodes → Distance ~20,000km
   - Empty circuits array → findNearestCircuit returns null
   - All circuits >50km → Returns null

5. **Mobile/Desktop**:
   - Mobile (GPS) → High accuracy (<50m)
   - Desktop (IP) → Low accuracy (>1km) → Still accepted per spec

---

## Security Considerations

**No sensitive data**:
- User location never stored or transmitted
- Calculations performed client-side only
- No API keys or secrets required

**Privacy**:
- Browser manages permission persistence
- No tracking or location history
- Ephemeral data (discarded after use)

**HTTPS Required**:
- Geolocation API only works on secure origins
- Already enforced by Firebase Hosting

---

## Summary

This service module provides a clean, testable API for geolocation functionality while following the constitution principles:
- Component-First Architecture (Principle I): Separates concerns from UI
- No Firebase dependencies: Pure client-side logic
- Error handling: Graceful degradation per spec
- Performance: <100ms for distance calculations
- Security: No data storage, privacy-friendly

**Module is ready for implementation** after Phase 1 complete.
