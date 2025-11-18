# Data Model: Circuit Management

**Feature**: Circuit Management  
**Branch**: `003-circuit-management`  
**Date**: 2025-11-18

## Overview

This document defines the entity schemas for Circuit Management, including the new Circuit entity and modifications to the Session entity to support circuit references.

## Entities

### Circuit (NEW)

**Collection Name**: `circuits`  
**Purpose**: Represents a racing circuit/track with geographic location and user notes.

#### Schema

| Field Name | Type | Required | Validation | Description |
|------------|------|----------|------------|-------------|
| `name` | string | Yes | Min 1 char, trim whitespace | Circuit name (e.g., "Buckmore Park") |
| `latitude` | number | Yes | -90 ≤ value ≤ 90 | Latitude in decimal degrees |
| `longitude` | number | Yes | -180 ≤ value ≤ 180 | Longitude in decimal degrees |
| `notes` | string | No | Trim whitespace, store null if empty | User's personal notes about circuit |
| `userId` | string | Yes | Must match authenticated user | Owner of circuit entity |
| `createdAt` | Timestamp | Yes | Auto-generated via `Timestamp.now()` | Creation timestamp |
| `updatedAt` | Timestamp | No | Set via `Timestamp.now()` on updates | Last update timestamp |

#### Field Details

**`name`** (string, required)
- **Purpose**: Human-readable circuit identifier
- **Validation**: 
  - Must not be empty string after trimming
  - No uniqueness constraint—users may have multiple circuits with same name (e.g., "Local Track 1", "Local Track 2")
- **Example**: `"Buckmore Park"`
- **Display**: Used in circuit lists, session forms, session views

**`latitude`** (number, required)
- **Purpose**: North-south geographic coordinate in decimal degrees
- **Validation**:
  - Must be valid number (not NaN)
  - Must be within range: -90 ≤ latitude ≤ 90
  - Stored with full precision (no rounding during storage)
- **Format**: Decimal degrees (e.g., `51.4545`, not degrees-minutes-seconds)
- **Example**: `51.4545` (Buckmore Park, Kent, UK)
- **Display**: Format with 4 decimal places and degree symbol: `51.4545°`

**`longitude`** (number, required)
- **Purpose**: East-west geographic coordinate in decimal degrees
- **Validation**:
  - Must be valid number (not NaN)
  - Must be within range: -180 ≤ longitude ≤ 180
  - Stored with full precision (no rounding during storage)
- **Format**: Decimal degrees (e.g., `0.2156`, not degrees-minutes-seconds)
- **Example**: `0.2156` (Buckmore Park, Kent, UK)
- **Display**: Format with 4 decimal places and degree symbol: `0.2156°`

**`notes`** (string, optional)
- **Purpose**: User's personal observations about circuit (e.g., "tight hairpin at turn 3", "fast track - watch turn 4 in wet")
- **Validation**: 
  - No length limit enforced (reasonable text length expected)
  - Trim whitespace before storage
  - Store `null` if empty string after trimming
- **Example**: `"My home track - very technical layout"`
- **Display**: Show in circuit detail view, truncate in list view if very long

**`userId`** (string, required)
- **Purpose**: Links circuit to owning user for data isolation
- **Validation**: 
  - Must match `auth.currentUser.uid` during creation
  - Immutable after creation
  - Enforced by Firestore security rules
- **Example**: `"abc123xyz789"` (Firebase Auth UID)
- **Security**: Users can only read/write their own circuits

**`createdAt`** (Timestamp, required)
- **Purpose**: Audit trail and sorting
- **Validation**: Set automatically via `Timestamp.now()` during creation
- **Example**: `Timestamp { seconds: 1700000000, nanoseconds: 0 }`
- **Display**: Format as human-readable date if needed (not typically shown to users)

**`updatedAt`** (Timestamp, optional)
- **Purpose**: Track last modification time
- **Validation**: Set via `Timestamp.now()` during updates (not during creation)
- **Example**: `Timestamp { seconds: 1700001000, nanoseconds: 0 }`
- **Display**: Not typically shown to users

#### Indexes

**Primary Index** (automatic): Document ID (`circuitId`)

**Query Index** (required):
- Collection: `circuits`
- Fields: `userId` (Ascending), `createdAt` (Descending)
- Purpose: Support `getUserCircuits()` query with ordering

**Firestore Index Definition** (add to `firestore.indexes.json`):
```json
{
  "collectionGroup": "circuits",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "userId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
}
```

#### Example Document

```javascript
{
  name: "Buckmore Park",
  latitude: 51.4545,
  longitude: 0.2156,
  notes: "My home track - very technical layout with tight hairpin",
  userId: "abc123xyz789",
  createdAt: Timestamp { seconds: 1700000000, nanoseconds: 0 },
  updatedAt: Timestamp { seconds: 1700001000, nanoseconds: 0 }
}
```

#### Lifecycle

1. **Creation**: User clicks "Add Circuit" → fills form → `addCircuit()` creates document with `userId` and `createdAt`
2. **Read**: User views circuits list → `getUserCircuits()` fetches all circuits where `userId` matches
3. **Update**: User clicks "Edit" → modifies fields → `updateCircuit()` updates document and sets `updatedAt`
4. **Deletion**: User clicks "Delete" → confirms → `deleteCircuit()` checks for session references → deletes if no references exist

---

### Session (MODIFIED)

**Collection Name**: `sessions`  
**Purpose**: Records a karting session with setup details and results. Modified to reference Circuit entity instead of storing circuit as string.

#### Schema Changes

| Field Name | Old Type | New Type | Migration Strategy |
|------------|----------|----------|-------------------|
| `circuit` | string | (deprecated) | Keep temporarily for backward compatibility |
| `circuitId` | N/A | string (reference) | **NEW**: Foreign key to circuits collection |

#### New Field Details

**`circuitId`** (string, optional during migration, required going forward)
- **Purpose**: Foreign key reference to Circuit entity
- **Validation**: 
  - Must be valid circuit document ID from `circuits` collection
  - Circuit must belong to same user (`userId` matching)
  - Required for new sessions created after circuit management implementation
- **Example**: `"circuit_abc123"` (Firestore document ID)
- **Display**: Resolve to circuit name by looking up circuit document
- **Relationship**: Many sessions → One circuit (many-to-one)

#### Backward Compatibility

**Dual Field Support**:
- Old sessions have `circuit` (string) populated, `circuitId` missing
- New sessions have `circuitId` populated, `circuit` deprecated
- Display logic: Check `circuitId` first; if missing, fall back to `circuit` string

**Migration Path** (out of scope for this feature):
1. Identify unique circuit strings from existing sessions
2. Create Circuit entities for each unique circuit name
3. Update sessions to populate `circuitId` based on circuit name matching
4. Eventually remove `circuit` field after migration complete

**Display Resolution Pattern**:
```javascript
// In session display logic
const getCircuitDisplay = (session, circuits) => {
  if (session.circuitId) {
    const circuit = circuits.find(c => c.id === session.circuitId);
    return circuit ? circuit.name : 'Unknown Circuit';
  }
  // Fallback to legacy string field
  return session.circuit || 'Unknown Circuit';
};
```

#### Updated Session Form Behavior

**Before Circuit Management**:
```svelte
<Textfield bind:value={circuit} label="Circuit" required />
```

**After Circuit Management**:
```svelte
<Select bind:value={circuitId} label="Circuit" required>
  <Option value="">Select a circuit</Option>
  {#each circuits as circuit}
    <Option value={circuit.id}>{circuit.name}</Option>
  {/each}
</Select>
```

#### Referential Integrity

**Deletion Constraint**: Cannot delete a circuit if any sessions reference it via `circuitId`.

**Enforcement**:
- Check performed in `deleteCircuit()` function
- Query sessions collection: `where('userId', '==', currentUser.uid).where('circuitId', '==', circuitId)`
- If results exist, throw error with count: `"Cannot delete circuit: N sessions use this circuit"`

---

## Relationships

```
User (Firebase Auth)
  └── 1:N → Circuits
  └── 1:N → Sessions

Circuit
  └── 1:N → Sessions (via circuitId foreign key)

Session
  └── N:1 → Circuit (many sessions can use same circuit)
  └── N:1 → Engine (existing relationship, unchanged)
  └── N:1 → Tyre (existing relationship, unchanged)
  └── N:1 → Chassis (existing relationship, unchanged)
```

## Data Flow

### Circuit CRUD Operations

**Create Circuit**:
1. User fills circuit form (name, latitude, longitude, optional notes)
2. Form validation checks required fields and coordinate ranges
3. `addCircuit(circuitData)` called with validated data
4. Service adds `userId` and `createdAt` fields
5. Document created in `circuits` collection
6. User redirected to circuits list

**Read Circuits**:
1. User navigates to circuits page
2. `getUserCircuits()` queries `circuits` collection filtered by `userId`
3. Results sorted by `createdAt` descending
4. Component displays circuits in grid layout

**Update Circuit**:
1. User clicks "Edit" on circuit
2. Edit form pre-filled with current circuit data
3. User modifies fields and submits
4. Form validation checks required fields and coordinate ranges
5. `updateCircuit(circuitId, updates)` called
6. Service adds `updatedAt` timestamp
7. Document updated in `circuits` collection
8. User redirected to circuits list

**Delete Circuit**:
1. User clicks "Delete" on circuit
2. Confirmation dialog appears
3. User confirms deletion
4. `deleteCircuit(circuitId)` queries sessions for references
5. If references exist, throw error with count
6. If no references, delete document from `circuits` collection
7. Circuits list refreshed

### Session Integration

**Create Session with Circuit**:
1. User navigates to new session form
2. Form loads circuits via `getUserCircuits()`
3. Circuit dropdown populated and sorted alphabetically
4. User selects circuit from dropdown
5. Form stores `circuitId` in session data
6. `addSession(sessionData)` creates session with `circuitId` reference

**Display Session with Circuit**:
1. Load session data via `getSession(sessionId)`
2. Load user's circuits via `getUserCircuits()`
3. Resolve `circuitId` to circuit object
4. Display circuit name (and optionally coordinates/notes)
5. If `circuitId` missing, fall back to legacy `circuit` string

## Validation Rules Summary

| Validation | Location | Error Message |
|------------|----------|---------------|
| Circuit name required | Client (form submit) | "Name, latitude, and longitude are required" |
| Latitude required | Client (form submit) | "Name, latitude, and longitude are required" |
| Longitude required | Client (form submit) | "Name, latitude, and longitude are required" |
| Latitude range | Client (form submit) | "Latitude must be between -90 and +90 degrees" |
| Longitude range | Client (form submit) | "Longitude must be between -180 and +180 degrees" |
| User authenticated | Service module | "Must be logged in to add/view/update/delete circuits" |
| Circuit references | Delete operation | "Cannot delete circuit: N sessions use this circuit. Update those sessions first." |
| User ownership | Firestore rules | Permission denied (handled by Firebase) |

## Performance Considerations

### Query Efficiency

**Circuit List Query**:
- Query: `where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc')`
- Index: Composite index on `userId` + `createdAt`
- Expected dataset size: 5-50 circuits per user
- Performance: Negligible (< 50 reads)

**Session-Circuit Resolution**:
- Load circuits once per page load, cache in component state
- Create in-memory Map for O(1) lookups: `circuitMap = new Map(circuits.map(c => [c.id, c]))`
- Avoids N+1 query problem when displaying session list with circuit names

**Deletion Check Query**:
- Query: `where('userId', '==', currentUser.uid).where('circuitId', '==', circuitId)`
- Index: Composite index on `userId` + `circuitId` (may need to add to `firestore.indexes.json`)
- Performance: Acceptable for deletion operation (not on critical path)

### Mobile Data Usage

**Circuit List Load**:
- 50 circuits × ~200 bytes/document = ~10 KB
- Acceptable for mobile data usage
- No pagination needed for expected dataset size

## Security Model

### Firestore Security Rules

**Circuits Collection**:
```javascript
match /circuits/{circuitId} {
  // Users can only read their own circuits
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  
  // Users can only create circuits with their userId
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.userId;
  
  // Users can only update their own circuits
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  
  // Users can only delete their own circuits
  allow delete: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}
```

### Data Isolation

- All queries filter by `userId == currentUser.uid`
- Service modules check `get(user)` before operations
- Firestore rules provide authoritative enforcement
- No cross-user data visibility

## Migration Considerations

### Backward Compatibility Strategy

**Phase 1: Circuit Management Implementation** (this feature)
- Add Circuit entity and CRUD operations
- Add `circuitId` field to session schema (optional)
- Session forms use `circuitId` for new sessions
- Display logic checks `circuitId` first, falls back to `circuit` string
- Old sessions continue to work with `circuit` string field

**Phase 2: Data Migration** (future work, out of scope)
- Script to create Circuit entities from unique session circuit strings
- Script to populate `circuitId` on existing sessions
- Verification that all sessions have `circuitId` populated

**Phase 3: Cleanup** (future work, out of scope)
- Remove `circuit` string field from session schema
- Update display logic to only use `circuitId`
- Remove fallback code

### Testing Data Migration

**Manual Test**:
1. Create sessions with legacy `circuit` string field
2. Implement circuit management
3. Create new circuits and sessions with `circuitId`
4. Verify mixed sessions (old and new) display correctly
5. Verify session form prevents creating sessions without circuit selection

## Summary

Circuit entity design follows established patterns from engines, tyres, and chassis. Session integration uses foreign key reference pattern. Backward compatibility maintained through dual field support during migration period. Validation ensures data integrity. Firestore rules enforce user data isolation per Constitution.

**Next Phase**: Contract definition for service module API.
