# Data Model: Geolocation Integration

**Feature**: 004-geolocation  
**Date**: 2025-11-20  
**Status**: Complete

## Overview

This feature adds geolocation capabilities to the existing karting application. **No new database entities are required**—the feature uses existing circuit data and performs all location operations client-side.

---

## Existing Entities (No Changes)

### Circuit

**Source**: Feature 003-circuit-management  
**Collection**: `circuits`  
**Usage**: Read-only for distance calculations

**Fields** (existing):
- `id`: string (auto-generated Firestore document ID)
- `name`: string (required) - Circuit name
- `latitude`: number (required) - Circuit latitude in decimal degrees (-90 to 90)
- `longitude`: number (required) - Circuit longitude in decimal degrees (-180 to 180)
- `notes`: string | null (optional) - User notes about circuit
- `userId`: string (required) - Owner's Firebase Auth UID
- `createdAt`: Timestamp (required) - Creation timestamp

**Indexes** (existing):
- `userId` + `createdAt` (descending) - For getUserCircuits query

**Security Rules** (existing, unchanged):
```javascript
match /circuits/{circuitId} {
  allow read, write: if request.auth != null && 
                        request.resource.data.userId == request.auth.uid;
}
```

**Geolocation Usage**:
- Read circuit `latitude` and `longitude` for distance calculation
- No writes or modifications to circuit data
- Auto-select feature pre-fills circuit ID in session forms

---

## Transient Data (Client-Side Only)

### User Location

**Storage**: None (not persisted)  
**Lifetime**: Single form load  
**Source**: Browser Geolocation API

**Structure**:
```javascript
{
  latitude: number,      // User's current latitude (-90 to 90)
  longitude: number,     // User's current longitude (-180 to 180)
  accuracy: number,      // Accuracy radius in meters (e.g., 20, 5000)
  timestamp: number      // Unix timestamp when position obtained
}
```

**Usage**:
- Obtained via `navigator.geolocation.getCurrentPosition()`
- Used immediately for distance calculation or coordinate population
- Discarded after use (not stored in state, localStorage, or database)
- Never transmitted to server or shared with other users

**Privacy Note**: User location is ephemeral and never leaves the browser. No tracking or history.

---

## Computed Data (Client-Side Only)

### Distance Calculation

**Storage**: None (calculated on-demand)  
**Lifetime**: Single operation  
**Algorithm**: Haversine formula

**Inputs**:
- User location (latitude, longitude)
- Circuit location (latitude, longitude)

**Output**:
```javascript
{
  circuitId: string,     // Circuit document ID
  distance: number       // Distance in kilometers (e.g., 2.5, 45.2)
}
```

**Usage**:
- Calculate distance from user to each circuit
- Find circuit with minimum distance
- Pre-select nearest circuit in session forms

**Performance**:
- Calculation time: <1ms per circuit
- For 20 circuits: <20ms total
- No caching (forms loaded infrequently)

---

## State Management

### Geolocation Service State

**Storage**: Module-level variables in `src/lib/geolocation.js`  
**Lifetime**: Browser session (page refresh clears)

**State Variables**:
```javascript
let permissionStatus = null;  // 'granted' | 'denied' | 'prompt' | null
let lastError = null;         // GeolocationPositionError | null
```

**Purpose**:
- Track permission state to avoid repeated prompts (per spec FR-015)
- Cache last error for user-friendly messages

**Persistence**: Not persisted (resets on page load)—browser manages actual permissions

---

## Data Flow Diagrams

### Auto-Select Circuit (New Session)

```
User → NewSession.svelte
  ├─→ onMount: geolocation.getCurrentLocation()
  │   ├─→ navigator.geolocation.getCurrentPosition()
  │   └─→ {latitude, longitude, accuracy}
  │
  ├─→ circuits.getUserCircuits()
  │   └─→ Firestore: read circuits collection
  │       └─→ [{id, name, latitude, longitude, ...}, ...]
  │
  ├─→ geolocation.findNearestCircuit(userLocation, circuits)
  │   ├─→ For each circuit: calculateDistance()
  │   └─→ Return circuit with min distance (if <50km)
  │
  └─→ Pre-select circuitId in dropdown
```

### Capture Coordinates (New/Edit Circuit)

```
User → NewCircuit.svelte / EditCircuit.svelte
  ├─→ Click "Use My Location" button
  │
  ├─→ geolocation.getCurrentLocation()
  │   ├─→ navigator.geolocation.getCurrentPosition()
  │   └─→ {latitude, longitude, accuracy}
  │
  └─→ Populate latitude/longitude input fields
      └─→ User can manually edit before saving
```

---

## Database Migrations

**Required**: None

**Rationale**:
- Circuit entity with latitude/longitude already exists (feature 003)
- No new fields or collections needed
- Geolocation data is client-side only (not stored)

---

## Validation Rules

### Latitude Validation

**Rules** (existing, unchanged):
- Type: number (float)
- Range: -90 to 90
- Required: true

**Source**: Form validation in NewCircuit/EditCircuit components

### Longitude Validation

**Rules** (existing, unchanged):
- Type: number (float)
- Range: -180 to 180
- Required: true

**Source**: Form validation in NewCircuit/EditCircuit components

### Geolocation-Specific Validation

**No additional validation required**:
- Browser API returns coordinates within valid ranges
- If invalid coordinates returned (edge case), form validation catches them
- User can manually correct before saving

---

## Relationships

### Circuit ↔ Session

**Existing Relationship** (no changes):
- Session has `circuitId` field referencing Circuit document
- Geolocation feature auto-populates this field but doesn't change relationship

**Impact of Geolocation**:
- Pre-selection improves data quality (fewer selection errors)
- Faster session creation (less manual selection)
- No schema changes

---

## State Transitions

### Permission States

```
           Page Load
               ↓
      [Permission: prompt]
               ↓
    User clicks "Use My Location"
               ↓
    Browser shows permission dialog
          ↙         ↘
    [granted]     [denied]
         ↓            ↓
    Get location   Show message
         ↓            ↓
    Populate/     Manual input
    Pre-select    fallback
```

### Form Loading States

```
    Form Mount
        ↓
[Loading location...] ← Optional background request
        ↓
    ↙       ↘
Success    Fail/Timeout
  ↓           ↓
Pre-select  No pre-select
circuit     (manual)
  ↓           ↓
User can override selection in both cases
```

---

## Data Privacy

### Personal Data Classification

**User Location**:
- Classification: Transient, client-side only
- Retention: Discarded after single use
- Storage: Memory only (no persistence)
- Transmission: Never sent to server
- Sharing: Never shared with other users

**Circuit Coordinates**:
- Classification: User-generated content (circuit locations)
- Retention: Persistent (user can delete)
- Storage: Firestore (per existing security rules)
- Transmission: Encrypted HTTPS (Firebase SDK)
- Sharing: Private per user (`userId` field enforced)

### GDPR Compliance

**Geolocation Feature**:
- No personal data processing (location not stored)
- User consent via browser permission dialog
- Right to withdraw: User can revoke browser permission anytime
- Data minimization: Location used only for immediate UI operation

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| New Entities | None | Uses existing circuits collection |
| Schema Changes | None | No database migrations required |
| Data Storage | None | Geolocation data is client-side only |
| Indexes | No changes | Existing indexes sufficient |
| Security Rules | No changes | Existing rules enforce `userId` isolation |
| Validation | No changes | Existing coordinate validation applies |
| Privacy | Compliant | Location not stored, client-side only |

**Data model is ready for implementation.** No database work required—all changes are client-side logic.
