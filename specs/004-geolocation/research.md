# Research: Geolocation Integration

**Feature**: 004-geolocation  
**Date**: 2025-11-20  
**Status**: Complete

## Overview

This document captures research findings for implementing browser geolocation support in the karting application. The feature requires understanding the Geolocation API, distance calculation algorithms, and integration with existing Svelte components.

---

## Browser Geolocation API

### Decision: Use Standard Geolocation API with getCurrentPosition

**Rationale**:
- Built into all modern browsers (Chrome, Firefox, Safari, Edge) since ~2010
- No external dependencies required
- Simple promise-based API suitable for one-time location requests
- Adequate accuracy for circuit matching (typically 10-100m on mobile devices)

**Implementation Pattern**:
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    // Use coordinates
  },
  (error) => {
    // Handle error (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT)
  },
  {
    enableHighAccuracy: true,  // Request GPS if available
    timeout: 10000,             // 10 second timeout per spec
    maximumAge: 0               // Don't use cached position
  }
);
```

**Alternatives Considered**:
- `watchPosition()`: Rejected—unnecessary continuous tracking; increases battery drain; spec only needs one-time location
- Third-party geolocation services (Google Maps, Mapbox): Rejected—adds dependencies, API keys, costs; browser API sufficient for distance calculation
- IP-based geolocation: Rejected as primary method—too inaccurate (city-level); browser API provides GPS on mobile

**Error Handling**:
- `PERMISSION_DENIED`: Show helpful message explaining benefits; allow manual selection/entry
- `POSITION_UNAVAILABLE`: Degrade gracefully to manual mode; no blocking
- `TIMEOUT`: After 10s, fall back to manual mode with brief notification

---

## Distance Calculation Algorithm

### Decision: Haversine Formula for Great-Circle Distance

**Rationale**:
- Standard algorithm for calculating distance between lat/long coordinates
- Accounts for Earth's curvature (more accurate than Pythagorean approximation)
- Simple implementation (~15 lines of code)
- Sufficient accuracy for circuit matching (circuits 0.1-100km apart)
- No external dependencies

**Implementation**:
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}
```

**Alternatives Considered**:
- Vincenty formula: Rejected—more accurate (mm precision) but unnecessary for circuit matching; adds complexity
- Pythagorean approximation: Rejected—inaccurate over long distances (>10km); circuits may be 50km apart
- External libraries (geolib, turf.js): Rejected—adds dependencies for simple calculation; haversine is straightforward

**Performance**:
- Calculation time: <1ms per distance check
- For 20 circuits: <20ms to find nearest
- Well within <100ms constraint for 50 circuits

---

## Svelte Integration Patterns

### Decision: Shared Geolocation Service Module

**Rationale**:
- Follows constitution principle I (Component-First Architecture)
- Centralizes geolocation logic for reuse across NewSession, NewCircuit, EditCircuit
- Enables testing and mocking
- Separates browser API concerns from UI components

**Module Structure** (`src/lib/geolocation.js`):
```javascript
// Export functions:
// - getCurrentLocation(): Promise<{latitude, longitude, accuracy}>
// - findNearestCircuit(userLocation, circuits): Circuit | null
// - calculateDistance(lat1, lon1, lat2, lon2): number
```

**Component Integration**:
- Components import from `src/lib/geolocation.js`
- Use Svelte's reactive statements to trigger auto-selection
- Handle loading states with boolean flags
- Display errors in existing SMUI components (no new UI patterns)

**Alternatives Considered**:
- Inline geolocation code in each component: Rejected—violates DRY; harder to test; duplicates error handling
- Svelte store for location: Rejected—geolocation is transient (one-time request per form); store unnecessary
- Context API: Rejected—overkill for simple function calls; adds complexity

---

## Permission Management

### Decision: Request on First Use with Graceful Fallback

**Rationale**:
- Browser best practice: request permissions when user takes action (click "Use My Location")
- Avoids permission prompts on page load (poor UX, often denied)
- Spec requires graceful degradation—all workflows must work without location

**Flow**:
1. User loads form → No permission request
2. User clicks "Use My Location" OR form auto-selects → Request permission
3. If denied → Show message once, allow manual input, don't re-prompt
4. If granted → Cache permission state in session (don't re-prompt per spec FR-015)

**Caching Strategy**:
- Store permission state in memory (module-level variable)
- Valid for current browser session only
- Reset on page refresh (acceptable per spec)

**Alternatives Considered**:
- Request permission on page load: Rejected—intrusive; high denial rate; poor UX
- Persistent permission cache (localStorage): Rejected—security concern; browser manages permissions; no need to duplicate

---

## UI/UX Patterns

### Decision: SMUI Button with Icon + Loading State

**Rationale**:
- Consistent with existing app styling (all forms use SMUI)
- Icon provides visual affordance (location pin icon)
- Loading state shows feedback during geolocation request (can take 2-10s)
- Meets constitution principle IV (Mobile-Responsive Design)

**Button States**:
- Default: "Use My Location" + location icon
- Loading: Spinner + "Getting location..."
- Success: Brief checkmark + "Location captured" (1s)
- Error: Error icon + message

**Placement**:
- Next to latitude/longitude fields (per spec)
- Below inputs on mobile (<600px) for better touch target
- Inline on desktop (>600px) for compact layout

**Alternatives Considered**:
- Automatic background location request: Rejected—permission prompt may interrupt form filling; user should control when permission requested
- Separate permission prompt UI: Rejected—browser's native prompt is familiar; duplicating adds complexity

---

## Testing Strategy

### Decision: Manual Testing with Real Devices

**Rationale**:
- Constitution principle V: Manual Quality Assurance
- Geolocation requires real devices/browsers for accurate testing
- Emulators/mocks don't test permission flows or GPS accuracy
- Small feature scope makes manual testing practical

**Test Scenarios**:
1. **Happy Path**: Grant permission, capture location, verify coordinates populated
2. **Permission Denied**: Deny permission, verify graceful fallback, manual entry works
3. **Timeout**: Slow network, verify 10s timeout, fallback to manual
4. **Auto-Select**: Create session near circuit, verify nearest pre-selected
5. **Distance Edge Cases**: Multiple circuits close together, verify closest chosen
6. **Mobile Viewport**: Test on 375px, verify button touch target 44px+
7. **Desktop IP Location**: Test on desktop, verify low-accuracy location accepted

**Test Devices**:
- Mobile: iPhone Safari, Android Chrome (primary use case)
- Desktop: Chrome, Firefox (secondary use case)

**Alternatives Considered**:
- Automated tests with geolocation mocks: Rejected—can't test real permission flows; constitution doesn't require automated tests; manual testing sufficient for this feature
- Firebase emulator testing: Not applicable—geolocation is client-side only, no Firebase operations

---

## Security Considerations

### Decision: Client-Side Only, No Data Storage

**Rationale**:
- Geolocation used only for UI convenience (pre-selecting circuit)
- No location data stored in database
- No privacy concerns—user's location never leaves their browser
- Follows constitution principle III (User Security First)

**Privacy Implications**:
- User's location is transient (used once per form load)
- No tracking or history
- Permission managed by browser (can be revoked anytime)
- Coordinates stored in circuit records are circuit locations, not user locations

**Compliance**:
- GDPR: No personal data stored; location used transiently for UI only
- Browser permissions: Respects user's permission choices
- HTTPS required: Geolocation API only works on secure origins (already enforced by Firebase Hosting)

**Alternatives Considered**:
- Store last-known location: Rejected—privacy concern; unnecessary; user's location changes (trackside vs home)
- Share locations between users: Out of scope per spec

---

## Performance Optimization

### Decision: Calculate Distance Only When Needed

**Rationale**:
- Distance calculation is cheap (<20ms for 20 circuits)
- Pre-optimization unnecessary at this scale
- Simple implementation preferred (constitution principle)

**Strategy**:
- Fetch all user circuits once (already done in existing code)
- Calculate distance to each on-demand when location obtained
- Find minimum distance (simple loop)
- No caching—forms loaded infrequently (few times per race day)

**Alternatives Considered**:
- Spatial index (R-tree, quadtree): Rejected—overkill for <100 circuits; adds complexity
- Pre-calculate distances on server: Rejected—requires storing user location; privacy concern
- Caching results: Rejected—user's location changes; cache invalidation complex

---

## Browser Compatibility

### Decision: Support Modern Browsers, Graceful Degradation for Old

**Rationale**:
- Geolocation API supported in all browsers since 2010+
- Assumption in spec: "Users have modern browsers"
- Progressive enhancement: old browsers fall back to manual input

**Supported Browsers**:
- Chrome 50+ (2016)
- Firefox 45+ (2016)
- Safari 10+ (2016)
- Edge 12+ (2015)

**Detection**:
```javascript
if ('geolocation' in navigator) {
  // Use geolocation
} else {
  // Manual input only (no error—silent fallback)
}
```

**Alternatives Considered**:
- Polyfills for old browsers: Rejected—unnecessary; old browsers rare in target audience; adds dependency
- Show warning for unsupported browsers: Rejected—silent fallback better UX; manual input always available

---

## Summary

All technical unknowns from Technical Context have been resolved:

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Geolocation API | `getCurrentPosition` with 10s timeout | Standard, no dependencies, adequate accuracy |
| Distance Algorithm | Haversine formula | Accurate, simple, no dependencies |
| Integration Pattern | Shared service module (`geolocation.js`) | Follows constitution, reusable, testable |
| Permission Flow | Request on first use, graceful fallback | Best practice, non-intrusive, spec compliant |
| UI Components | SMUI button with loading states | Consistent with app, mobile-responsive |
| Testing | Manual on real devices | Per constitution, tests real permission flows |
| Security | Client-side only, no storage | Privacy-friendly, spec compliant |
| Performance | Calculate on-demand | Simple, fast enough (<100ms for 50 circuits) |
| Browser Support | Modern browsers with fallback | Reasonable assumption, graceful degradation |

**No remaining NEEDS CLARIFICATION items.** Ready for Phase 1 (Design & Contracts).
