# Quickstart: Geolocation Integration

**Feature**: 004-geolocation  
**Target Audience**: Developers implementing this feature  
**Estimated Time**: 2-3 hours

---

## Overview

This guide walks through implementing browser geolocation support for the karting application. The feature has three main components:

1. **Geolocation Service** (`src/lib/geolocation.js`) - Core logic
2. **Auto-Select Circuit** (NewSession.svelte) - Pre-select nearest circuit
3. **Location Capture** (NewCircuit/EditCircuit.svelte) - "Use My Location" button

**Complexity**: Low-Medium (straightforward browser API, simple UI changes)

---

## Prerequisites

- [ ] Feature 003-circuit-management complete (circuits with lat/long exist)
- [ ] Existing codebase running locally (`npm run dev`)
- [ ] Test on HTTPS (geolocation requires secure origin)
- [ ] Mobile device or browser dev tools for testing

---

## Step 1: Create Geolocation Service (30 min)

### File: `src/lib/geolocation.js`

**Purpose**: Encapsulate geolocation logic, distance calculations

**Implementation**:

```javascript
// src/lib/geolocation.js

// Module-level state (session cache per spec FR-015)
let cachedPermissionStatus = null;

/**
 * Get user's current location from browser Geolocation API
 * @returns {Promise<{latitude, longitude, accuracy, timestamp}>}
 * @throws {Error} with code property (1=denied, 2=unavailable, 3=timeout)
 */
export async function getCurrentLocation() {
  // Feature detection
  if (!('geolocation' in navigator)) {
    const error = new Error('Geolocation not supported in this browser');
    error.code = 0;
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
        // Map browser error codes to friendly messages
        if (error.code === 1) {
          cachedPermissionStatus = 'denied';
        }
        reject(error);
      },
      {
        enableHighAccuracy: true,  // Request GPS if available
        timeout: 10000,             // 10 second timeout per spec FR-014
        maximumAge: 0               // Don't use cached position
      }
    );
  });
}

/**
 * Calculate great-circle distance between two points using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
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
 * @param {{latitude, longitude}} userLocation - User's current location
 * @param {Array} circuits - Array of circuit objects with latitude/longitude
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

  // Return null if nearest circuit is >50km away (per spec FR-003)
  return minDistance <= 50 ? nearest : null;
}

/**
 * Get cached permission status (avoid repeated prompts)
 * @returns {'granted'|'denied'|'prompt'|null}
 */
export function getPermissionStatus() {
  return cachedPermissionStatus;
}
```

**Test**:
```javascript
// Quick console test in browser
import { getCurrentLocation, calculateDistance } from './lib/geolocation.js';

const location = await getCurrentLocation();
console.log('Location:', location);

const distance = calculateDistance(51.4545, 0.2156, 51.3656, 0.1963);
console.log('Distance:', distance.toFixed(2) + 'km');
```

---

## Step 2: Auto-Select Circuit in New Session (45 min)

### File: `src/routes/NewSession.svelte`

**Changes**: Add geolocation logic to pre-select nearest circuit on form load

**Implementation**:

```javascript
// Add to imports at top of <script>
import { getCurrentLocation, findNearestCircuit } from '../lib/geolocation.js';

// Add state variables for geolocation
let isLoadingLocation = false;
let locationError = null;

// Modify onMount to include auto-select logic
onMount(async () => {
  try {
    loading = true;

    // Load data (existing code)
    const [tyresData, enginesData, chassisData, circuitsData] = await Promise.all([
      getUserTyres(),
      getUserEngines(),
      getUserChassis(),
      getUserCircuits()
    ]);

    tyres = tyresData;
    engines = enginesData;
    chassis = chassisData;
    circuits = circuitsData;

    // NEW: Auto-select nearest circuit based on location
    if (circuits.length > 0) {
      try {
        isLoadingLocation = true;
        const userLocation = await getCurrentLocation();
        const nearest = findNearestCircuit(userLocation, circuits);
        
        if (nearest) {
          circuitId = nearest.id;  // Pre-select in dropdown
          console.log('Auto-selected circuit:', nearest.name);
        }
      } catch (error) {
        // Permission denied or timeout - fail silently per spec FR-009
        console.log('Geolocation unavailable:', error.message);
        locationError = error;
        // Continue with manual selection (no blocking)
      } finally {
        isLoadingLocation = false;
      }
    }

    // Set default date (existing code)
    const today = new Date();
    date = today.toISOString().split('T')[0];

    loading = false;
  } catch (error) {
    console.error('Error loading form data:', error);
    errorMessage = 'Failed to load form data. Please try again.';
    loading = false;
  }
});
```

**UI Feedback** (optional but recommended):

```svelte
<!-- Add after circuit select dropdown in template -->
{#if isLoadingLocation}
  <div class="location-status">
    📍 Getting your location...
  </div>
{/if}
```

**Test**:
1. Open NewSession form near a known circuit
2. Grant location permission
3. Verify nearest circuit is pre-selected
4. Try denying permission → Verify manual selection works

---

## Step 3: Add "Use My Location" to Circuit Forms (60 min)

### File: `src/routes/NewCircuit.svelte`

**Changes**: Add button next to lat/long fields to capture current location

**Implementation**:

```javascript
// Add to imports
import { getCurrentLocation } from '../lib/geolocation.js';

// Add state for location capture
let isCapturingLocation = false;
let locationCaptureError = null;
let locationCaptureSuccess = false;

// Add handler function
const handleUseMyLocation = async () => {
  try {
    isCapturingLocation = true;
    locationCaptureError = null;
    locationCaptureSuccess = false;

    const location = await getCurrentLocation();
    
    // Populate fields (round to 6 decimal places)
    latitude = location.latitude.toFixed(6);
    longitude = location.longitude.toFixed(6);
    
    locationCaptureSuccess = true;
    
    // Clear success message after 2 seconds
    setTimeout(() => {
      locationCaptureSuccess = false;
    }, 2000);
  } catch (error) {
    locationCaptureError = getUserFriendlyError(error);
  } finally {
    isCapturingLocation = false;
  }
};

// Helper for user-friendly error messages
const getUserFriendlyError = (error) => {
  if (error.code === 1) {
    return 'Location permission denied. Please enable location in browser settings.';
  } else if (error.code === 2) {
    return 'Unable to determine location. Check device location settings.';
  } else if (error.code === 3) {
    return 'Location request timed out. Please try again.';
  } else {
    return 'Geolocation not supported in this browser.';
  }
};
```

**Template Changes**:

```svelte
<!-- Replace existing latitude/longitude fields with this: -->
<div class="coordinates-group">
  <div class="coordinate-field">
    <Textfield
      bind:value={latitude}
      label="Latitude *"
      type="number"
      step="0.000001"
      min="-90"
      max="90"
      required
      input$aria-label="Latitude"
    />
  </div>
  
  <div class="coordinate-field">
    <Textfield
      bind:value={longitude}
      label="Longitude *"
      type="number"
      step="0.000001"
      min="-180"
      max="180"
      required
      input$aria-label="Longitude"
    />
  </div>
  
  <div class="location-button-container">
    <Button
      on:click={handleUseMyLocation}
      disabled={isCapturingLocation}
      variant="outlined"
    >
      {#if isCapturingLocation}
        📍 Getting location...
      {:else if locationCaptureSuccess}
        ✓ Location captured
      {:else}
        📍 Use My Location
      {/if}
    </Button>
  </div>
</div>

{#if locationCaptureError}
  <div class="error-message">{locationCaptureError}</div>
{/if}
```

**Styles** (add to component):

```css
<style>
  .coordinates-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .coordinate-field {
    flex: 1;
  }

  .location-button-container {
    display: flex;
    justify-content: flex-start;
  }

  .error-message {
    color: var(--mdc-theme-error, #b00020);
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  /* Mobile responsive */
  @media (min-width: 600px) {
    .coordinates-group {
      flex-direction: row;
      align-items: flex-end;
    }
  }
</style>
```

**Test**:
1. Open NewCircuit form
2. Click "Use My Location"
3. Grant permission
4. Verify lat/long fields populate
5. Verify can manually edit after population
6. Test error states (deny permission, timeout)

---

## Step 4: Apply Same Changes to EditCircuit (30 min)

### File: `src/routes/EditCircuit.svelte`

**Implementation**: Copy same changes from NewCircuit.svelte
- Import `getCurrentLocation`
- Add state variables
- Add `handleUseMyLocation` handler
- Add button to template
- Add styles

**Note**: Code is identical except form already has existing latitude/longitude values

---

## Step 5: Manual Testing Checklist (30 min)

### Desktop Testing (Chrome/Firefox)

- [ ] **NewSession auto-select**: 
  - Open form near circuit → Nearest pre-selected
  - Open form far from circuits → No pre-selection
  - Deny permission → Manual selection works

- [ ] **NewCircuit location capture**:
  - Click "Use My Location" → Coordinates populate
  - Deny permission → Error message shown, manual entry works
  - Manually edit populated coordinates → Changes saved

- [ ] **EditCircuit location capture**:
  - Click "Use My Location" → Coordinates update
  - Save without using location → Existing coordinates preserved

### Mobile Testing (Safari/Chrome)

- [ ] **Touch targets**: Button ≥44px (use dev tools to verify)
- [ ] **Responsive layout**: Button stacks below fields on narrow screen
- [ ] **GPS accuracy**: Mobile GPS typically <50m accuracy
- [ ] **Permission flow**: Browser permission dialog displays correctly

### Edge Cases

- [ ] **No circuits**: NewSession doesn't crash, no auto-select
- [ ] **Timeout**: Wait 10s → Falls back to manual
- [ ] **Multiple nearby circuits**: Closest one selected
- [ ] **Coordinates at boundary** (e.g., lat=90): Validates correctly

---

## Step 6: Update Constitution Compliance (5 min)

### Re-check Constitution Gates

Update `specs/004-geolocation/plan.md` Constitution Check:

```markdown
## Constitution Check (Post-Implementation)

- [x] **Component-First Architecture**: ✓ Geolocation logic in `src/lib/geolocation.js`
- [x] **Firebase-Native Patterns**: ✓ No Firebase changes, uses existing circuits service
- [x] **User Security First**: ✓ No security changes, client-side only
- [x] **Mobile-Responsive Design**: ✓ Button 44px, tested on 375px viewport
- [x] **Manual Quality Assurance**: ✓ All test scenarios passed (see checklist above)
```

---

## Common Issues & Solutions

### Issue: Permission denied on first try
**Solution**: Browser may block permission on localhost. Use `https://` or configure Chrome flags for testing.

### Issue: Geolocation returns 0,0 coordinates
**Solution**: Browser falling back to IP-based location. Enable device location services.

### Issue: Timeout on every request
**Solution**: Check browser console for errors. May need to allow geolocation in browser settings.

### Issue: Auto-select picks wrong circuit
**Solution**: Verify circuit coordinates in database are correct (use Google Maps to validate).

### Issue: Button not responsive on mobile
**Solution**: Check CSS media query, verify touch target size with browser dev tools.

---

## Performance Validation

After implementation, verify:

- [ ] Location capture completes in <10s (typically 2-5s)
- [ ] Distance calculation for 20 circuits <100ms
- [ ] Form loads without blocking UI (async geolocation)
- [ ] No console errors or warnings

---

## Deployment Checklist

Before deploying:

- [ ] All manual tests passed (desktop + mobile)
- [ ] No new dependencies added (uses browser APIs only)
- [ ] HTTPS enabled (geolocation requires secure origin)
- [ ] Error messages are user-friendly
- [ ] Constitution check updated and passing
- [ ] Documentation updated (README if applicable)

---

## Next Steps

After successful implementation:

1. Monitor user adoption (how many use auto-select vs manual?)
2. Collect feedback on location accuracy
3. Consider future enhancements (map view, multiple circuits, etc.) if user requests

---

## Estimated Time Breakdown

| Task | Time | Difficulty |
|------|------|------------|
| Geolocation service | 30 min | Easy |
| Auto-select circuit | 45 min | Medium |
| NewCircuit button | 60 min | Medium |
| EditCircuit button | 30 min | Easy |
| Manual testing | 30 min | Easy |
| Total | **3 hours** | **Low-Medium** |

**Prerequisite Knowledge**:
- Svelte basics (components, stores, lifecycle)
- Async/await, Promises
- Browser APIs (basic familiarity)
- Firebase Firestore (already familiar from existing code)

---

## Support Resources

**Documentation**:
- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Svelte Lifecycle](https://svelte.dev/docs/svelte#onmount)

**Spec Files**:
- [Feature Spec](./spec.md) - User requirements
- [Research](./research.md) - Technical decisions
- [Data Model](./data-model.md) - Data structure
- [API Contract](./contracts/geolocation-api.md) - Function signatures

**Project Files**:
- `src/lib/circuits.js` - Existing circuit service (reference)
- `src/routes/NewSession.svelte` - Existing form (reference)

---

## Success Criteria

Feature is complete when:
- ✅ NewSession auto-selects nearest circuit (when available)
- ✅ NewCircuit and EditCircuit have "Use My Location" button
- ✅ All geolocation errors handled gracefully
- ✅ Manual testing checklist 100% passed
- ✅ Mobile responsive (375px minimum width)
- ✅ Constitution check passes

**Ready to implement!** Start with Step 1 (geolocation service) and work sequentially.
