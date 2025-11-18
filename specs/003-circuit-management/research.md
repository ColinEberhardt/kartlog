# Research: Circuit Management Implementation

**Feature**: Circuit Management  
**Branch**: `003-circuit-management`  
**Date**: 2025-11-18

## Purpose

This document resolves all technical unknowns from the initial Technical Context and establishes implementation patterns based on the existing KartLog codebase.

## Technology Stack Analysis

### Frontend Framework
**Decision**: SvelteKit with Svelte components  
**Rationale**: Existing codebase uses SvelteKit with file-based routing in `src/routes/`. Circuit management will follow identical patterns to Engines and Chassis features.  
**Evidence**: `src/routes/Engines.svelte`, `src/routes/NewEngine.svelte`, `src/routes/EditEngine.svelte` demonstrate the CRUD pattern to replicate.

### Component Library
**Decision**: SMUI (Svelte Material UI)  
**Rationale**: Entire application uses SMUI components (`@smui/card`, `@smui/button`, `@smui/textfield`, `@smui/select`). Circuit forms will use identical components for consistency.  
**Evidence**: All route components import from `@smui/*` packages. NewEngine.svelte shows form field patterns with SMUI Textfield and Select components.

### Firebase Integration
**Decision**: Firebase SDK v9+ modular syntax with Cloud Firestore  
**Rationale**: Constitution mandates modular imports. Existing service modules (`src/lib/engines.js`, `src/lib/tyres.js`) demonstrate established patterns.  
**Evidence**: `src/lib/engines.js` uses `import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore'`.

### State Management
**Decision**: Svelte stores in `src/lib/stores.js`  
**Rationale**: User authentication state managed via `user` store exported from `stores.js`. All service modules use `get(user)` to access current user.  
**Evidence**: `src/lib/engines.js` line 11: `const currentUser = get(user);`

### Routing
**Decision**: svelte-spa-router  
**Rationale**: Application uses client-side routing via `svelte-spa-router`. All navigation uses `push()` function and `link` action.  
**Evidence**: `src/routes/Engines.svelte` imports `import { push, link } from 'svelte-spa-router'`.

## Data Validation Patterns

### Coordinate Validation
**Decision**: Client-side validation with numeric input type and range checks  
**Rationale**: 
- Latitude: -90 to +90 decimal degrees
- Longitude: -180 to +180 decimal degrees
- JavaScript can validate using `parseFloat()` and range comparison
- HTML5 `type="number"` provides mobile numeric keyboard and basic validation

**Implementation Pattern**:
```javascript
// Validation function
const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and +90 degrees');
  }
  
  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and +180 degrees');
  }
  
  return { latitude, longitude };
};
```

**Evidence**: Existing pattern in `NewSession.svelte` lines 124-136 validates numeric fields with `isNaN(Number(field))` checks.

### Required Field Validation
**Decision**: Client-side required field checks before submission  
**Rationale**: Follow existing pattern of checking required fields in submit handler, not relying solely on HTML5 `required` attribute.

**Implementation Pattern**:
```javascript
if (!name || !latitude || !longitude) {
  error = 'Name, latitude, and longitude are required';
  return;
}
```

**Evidence**: `NewEngine.svelte` lines 30-33 checks required fields: `if (!name || !make || !model) { error = 'Name, make and model are required'; return; }`

## Dropdown/Select Component Usage

### Circuit Selection in Session Forms
**Decision**: SMUI Select component populated from circuit service  
**Rationale**: Existing session form uses Select for engines, tyres, chassis. Circuit will follow identical pattern.

**Implementation Pattern**:
```svelte
<script>
  import Select, { Option } from '@smui/select';
  import { getUserCircuits } from '../lib/circuits.js';
  
  let circuits = [];
  let circuitId = '';
  
  onMount(async () => {
    circuits = await getUserCircuits();
    // Sort alphabetically by name
    circuits.sort((a, b) => a.name.localeCompare(b.name));
  });
</script>

<Select bind:value={circuitId} label="Circuit" required style="width: 100%;">
  <Option value="">Select a circuit</Option>
  {#each circuits as circuit}
    <Option value={circuit.id}>{circuit.name}</Option>
  {/each}
</Select>
```

**Evidence**: `NewSession.svelte` lines 58-74 loads tyres, engines, chassis and uses them in Select dropdowns (visible in lines 150+).

### Empty State Handling
**Decision**: Display helpful message when no circuits exist  
**Rationale**: Engines page shows empty state pattern. Circuit selection in session forms should link to circuit management page if empty.

**Implementation Pattern**:
```svelte
{#if circuits.length === 0}
  <div class="empty-state">
    <p>No circuits found. <a href="/circuits" use:link>Add a circuit</a> to get started.</p>
  </div>
{/if}
```

**Evidence**: Standard pattern across all list views in the application.

## Service Module Patterns

### File Naming Convention
**Decision**: `src/lib/circuits.js` (lowercase, plural)  
**Rationale**: Existing service modules follow this pattern: `engines.js`, `tyres.js`, `chassis.js`, `sessions.js`.

### Function Naming Convention
**Decision**: CRUD operations named as:
- `addCircuit(circuitData)`
- `getUserCircuits()`
- `updateCircuit(circuitId, updates)`
- `deleteCircuit(circuitId)`

**Rationale**: Exact pattern from `engines.js`: `addEngine`, `getUserEngines`, `updateEngine`, `deleteEngine`.

### Authentication Checks
**Decision**: Every function checks `get(user)` and throws error if null  
**Rationale**: Defense-in-depth security per Constitution. Client checks prevent accidental calls; Firestore rules provide authoritative security boundary.

**Implementation Pattern**:
```javascript
import { user } from './stores.js';
import { get } from 'svelte/store';

export const addCircuit = async (circuitData) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to add circuits');
  }
  // ... operation
};
```

**Evidence**: `src/lib/engines.js` lines 14-17: `const currentUser = get(user); if (!currentUser) { throw new Error('Must be logged in to add engines'); }`

### Timestamp Handling
**Decision**: Use `Timestamp.now()` for `createdAt`, `updatedAt` fields  
**Rationale**: Firestore Timestamp provides server-side consistency. Existing pattern across all service modules.

**Evidence**: `engines.js` line 22: `createdAt: Timestamp.now()`, line 47: `updatedAt: Timestamp.now()`

## Data Migration Strategy

### Session Circuit Field Conversion
**Decision**: Migration handled separately from feature implementation  
**Rationale**: Per spec assumptions: "Existing sessions with circuit stored as text will require data migration (handled separately from this feature implementation)".

**Approach**:
1. Add new `circuitId` field to sessions schema
2. Keep existing `circuit` string field temporarily for backward compatibility
3. Session forms will write to `circuitId` going forward
4. Display logic checks `circuitId` first, falls back to `circuit` string
5. Separate migration script (not part of this feature) will:
   - Create circuit entities from unique session circuit strings
   - Populate `circuitId` on sessions with matching circuit names
   - Eventually remove legacy `circuit` field

**Implementation Note**: This feature implements the new circuit entity and integration. Migration is out of scope.

## Deletion Constraints

### Preventing Orphaned References
**Decision**: Block circuit deletion if sessions reference it  
**Rationale**: Maintain referential integrity. Deleting circuit would break session display.

**Implementation Pattern**:
```javascript
export const deleteCircuit = async (circuitId) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to delete circuits');
  }
  
  // Check for sessions using this circuit
  const sessionsQuery = query(
    collection(db, 'sessions'),
    where('userId', '==', currentUser.uid),
    where('circuitId', '==', circuitId)
  );
  const sessionsSnapshot = await getDocs(sessionsQuery);
  
  if (sessionsSnapshot.size > 0) {
    throw new Error(`Cannot delete circuit: ${sessionsSnapshot.size} sessions use this circuit. Update those sessions first.`);
  }
  
  const circuitRef = doc(db, 'circuits', circuitId);
  await deleteDoc(circuitRef);
};
```

**Evidence**: User Story 4 acceptance scenario 4 specifies this behavior. Pattern extrapolated from existing service module error handling.

## Mobile Optimization

### Coordinate Input on Mobile
**Decision**: Use `type="number"` with `step="any"` for decimal latitude/longitude  
**Rationale**: Triggers numeric keyboard on mobile devices. `step="any"` allows decimal precision.

**Implementation Pattern**:
```svelte
<Textfield 
  type="number" 
  step="any"
  bind:value={latitude} 
  label="Latitude" 
  required 
  style="width: 100%;" 
/>
```

**Evidence**: Mobile-first design per Constitution Principle IV. HTML5 input types improve mobile UX.

### Touch Target Sizing
**Decision**: Button and link touch targets minimum 44×44px  
**Rationale**: Constitution requirement. SMUI buttons meet this by default. Custom CSS adjustments only if needed.

**Evidence**: Existing SMUI Button components in `Engines.svelte` and other routes meet touch target requirements.

## Firestore Security Rules

### Circuit Collection Rules
**Decision**: Add rules matching existing entity patterns  
**Rationale**: Constitution mandates user data isolation. Rules enforce `userId` matching.

**Implementation Pattern**:
```plaintext
match /circuits/{circuitId} {
  // Allow read and write only if user is authenticated and owns the document
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  
  // Allow create if user is authenticated (they'll be the owner)
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.userId;
}
```

**Evidence**: Existing rules in `firestore.rules` lines 5-12 (tyres), 15-23 (engines) follow identical pattern.

## Coordinate Display Formatting

### Decimal Degrees Format
**Decision**: Display coordinates with 4 decimal places and degree symbol  
**Rationale**: 4 decimal places provides ~11 meter accuracy (sufficient per assumptions). Degree symbol improves readability.

**Implementation Pattern**:
```svelte
{circuit.latitude.toFixed(4)}°N {circuit.longitude.toFixed(4)}°E
```

**Note**: This is display formatting only. Store raw numbers in Firestore for precision.

## Component Reuse

### Layout Grid for Circuit Cards
**Decision**: Use SMUI LayoutGrid and Cell for responsive circuit list  
**Rationale**: Existing pattern in `Engines.svelte` lines 101-201 shows grid layout with cards.

**Implementation Pattern**:
```svelte
<LayoutGrid>
  {#each circuits as circuit}
    <Cell span={12} spanDesktop={6}>
      <Card style="padding: 1.5rem; height: 100%;">
        <h3>{circuit.name}</h3>
        <p>Coordinates: {circuit.latitude.toFixed(4)}°, {circuit.longitude.toFixed(4)}°</p>
        {#if circuit.notes}
          <p class="notes">{circuit.notes}</p>
        {/if}
        <div class="action-buttons">
          <Button href="/circuits/edit/{circuit.id}" variant="outlined">Edit</Button>
          <Button onclick={() => handleDelete(circuit.id)} variant="outlined">Delete</Button>
        </div>
      </Card>
    </Cell>
  {/each}
</LayoutGrid>
```

**Evidence**: `Engines.svelte` uses identical LayoutGrid pattern with Cell span attributes for responsive behavior.

## Alphabetical Sorting

### Circuit List and Dropdowns
**Decision**: Sort circuits alphabetically by name using `localeCompare()`  
**Rationale**: Per FR-015, dropdowns must show circuits alphabetically. JavaScript `localeCompare()` provides locale-aware sorting.

**Implementation Pattern**:
```javascript
circuits.sort((a, b) => a.name.localeCompare(b.name));
```

**Evidence**: Standard JavaScript pattern for alphabetical sorting. Used throughout web applications.

## Session Display Integration

### Resolving Circuit Names from IDs
**Decision**: Join circuit data when loading sessions for display  
**Rationale**: Sessions store `circuitId` reference. Display views need circuit name and other details.

**Implementation Pattern**:
```javascript
// In sessions list/view component
const loadSessionsWithCircuits = async () => {
  const [sessions, circuits] = await Promise.all([
    getUserSessions(),
    getUserCircuits()
  ]);
  
  // Create lookup map
  const circuitMap = new Map(circuits.map(c => [c.id, c]));
  
  // Enrich sessions with circuit data
  return sessions.map(session => ({
    ...session,
    circuit: session.circuitId ? circuitMap.get(session.circuitId) : null
  }));
};
```

**Evidence**: Pattern extrapolated from existing session statistics merging in `sessionStats.js` which joins session data with item details.

## Error Handling

### User-Friendly Error Messages
**Decision**: Catch Firebase errors and display user-friendly messages  
**Rationale**: Constitution mandates user-friendly error handling. Don't expose internal error codes.

**Implementation Pattern**:
```javascript
try {
  await addCircuit(circuitData);
  push('/circuits');
} catch (err) {
  if (err.code === 'permission-denied') {
    error = 'You do not have permission to perform this action';
  } else if (err.message.includes('offline')) {
    error = 'Unable to save: check your internet connection';
  } else {
    error = err.message || 'An error occurred while saving the circuit';
  }
}
```

**Evidence**: Existing components catch errors and display in error state variables. See `NewEngine.svelte` lines 44-46.

## Testing Strategy

### Manual Testing Approach
**Decision**: Manual QA per Constitution Principle V  
**Rationale**: Small-scale project. Manual testing faster than maintaining automated test suite.

**Test Coverage**:
1. **CRUD Operations**: Add, view, edit, delete circuits with valid data
2. **Validation**: Invalid coordinates, missing required fields, long text in notes
3. **Session Integration**: Select circuit in new session, view session with circuit details
4. **Empty States**: No circuits message, session form when no circuits exist
5. **Mobile**: Test on 375px viewport, numeric keyboard activation, touch target sizes
6. **Security**: Verify users only see their own circuits (test with multiple accounts)
7. **Deletion Constraints**: Attempt to delete circuit with sessions referencing it

**Evidence**: Constitution Principle V specifies manual testing approach. User stories include acceptance scenarios defining test cases.

## Summary

All technical unknowns resolved. Implementation follows established patterns from engines/chassis features. No architectural deviations needed—circuit management is a straightforward application of existing patterns to a new entity type.

**Key Decisions**:
- Mirror engines.js pattern for circuits.js service module
- Use SMUI components (Textfield, Select, Button, Card) for consistent UI
- Store coordinates as numbers, validate ranges client-side
- Block deletion if sessions reference circuit
- Sort circuits alphabetically in dropdowns
- Mobile-optimized with numeric input types and responsive grid layout
- Firestore security rules enforce userId matching per Constitution

**Next Phase**: Data model design with complete entity schemas and relationships.
