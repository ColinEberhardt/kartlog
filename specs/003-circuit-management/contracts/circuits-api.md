# Circuit Service Module API Contract

**Module**: `src/lib/circuits.js`  
**Purpose**: Service module providing CRUD operations for Circuit entities in Cloud Firestore  
**Pattern**: Follows established pattern from `engines.js`, `tyres.js`, `chassis.js`

## Module Exports

This module exports the following functions as named exports:

```javascript
export const addCircuit = async (circuitData) => { ... }
export const getUserCircuits = async () => { ... }
export const updateCircuit = async (circuitId, updates) => { ... }
export const deleteCircuit = async (circuitId) => { ... }
```

---

## Function: `addCircuit`

### Signature
```javascript
async function addCircuit(circuitData: CircuitInput): Promise<string>
```

### Purpose
Creates a new circuit document in the `circuits` collection for the authenticated user.

### Parameters

**`circuitData`** (Object, required):
```javascript
{
  name: string,        // Required: Circuit name (min 1 char after trim)
  latitude: number,    // Required: -90 ≤ value ≤ 90
  longitude: number,   // Required: -180 ≤ value ≤ 180
  notes: string        // Optional: User notes (can be empty string)
}
```

### Returns
- **Success**: `Promise<string>` - Document ID of created circuit
- **Failure**: Throws `Error` with user-friendly message

### Behavior

1. **Authentication Check**: Verifies user is logged in via `get(user)`
2. **Data Processing**:
   - Trims whitespace from `name`
   - Stores `notes` as `null` if empty string after trimming
   - Adds `userId` field set to `auth.currentUser.uid`
   - Adds `createdAt` field set to `Timestamp.now()`
3. **Firestore Operation**: Calls `addDoc(collection(db, 'circuits'), processedData)`
4. **Return**: Returns document ID from `docRef.id`

### Error Conditions

| Condition | Error Message |
|-----------|---------------|
| User not authenticated | `"Must be logged in to add circuits"` |
| Firestore write fails | Firebase error message or generic error |

### Example Usage

```javascript
import { addCircuit } from './lib/circuits.js';

try {
  const circuitData = {
    name: 'Buckmore Park',
    latitude: 51.4545,
    longitude: 0.2156,
    notes: 'My home track'
  };
  
  const circuitId = await addCircuit(circuitData);
  console.log('Circuit created with ID:', circuitId);
} catch (error) {
  console.error('Failed to add circuit:', error.message);
}
```

### Validation Notes

- **No client-side validation in service module**: Validation performed in UI component before calling this function
- **Firestore security rules enforce**: `request.auth.uid == request.resource.data.userId`

---

## Function: `getUserCircuits`

### Signature
```javascript
async function getUserCircuits(): Promise<Circuit[]>
```

### Purpose
Retrieves all circuits belonging to the authenticated user, ordered by creation date (newest first).

### Parameters
None

### Returns
- **Success**: `Promise<Circuit[]>` - Array of circuit objects with IDs
- **Failure**: Throws `Error` with user-friendly message

### Return Type

```javascript
Circuit {
  id: string,           // Firestore document ID
  name: string,
  latitude: number,
  longitude: number,
  notes: string | null,
  userId: string,
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```

### Behavior

1. **Authentication Check**: Verifies user is logged in via `get(user)`
2. **Query Construction**:
   ```javascript
   query(
     collection(db, 'circuits'),
     where('userId', '==', currentUser.uid),
     orderBy('createdAt', 'desc')
   )
   ```
3. **Firestore Operation**: Executes query via `getDocs(q)`
4. **Data Transformation**: Maps `QuerySnapshot` to array of objects with document ID merged:
   ```javascript
   querySnapshot.docs.map(doc => ({
     id: doc.id,
     ...doc.data()
   }))
   ```

### Error Conditions

| Condition | Error Message |
|-----------|---------------|
| User not authenticated | `"Must be logged in to view circuits"` |
| Firestore read fails | Firebase error message or generic error |

### Example Usage

```javascript
import { getUserCircuits } from './lib/circuits.js';

try {
  const circuits = await getUserCircuits();
  
  // Sort alphabetically for dropdown display
  const sortedCircuits = circuits.sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  console.log('User has', circuits.length, 'circuits');
} catch (error) {
  console.error('Failed to load circuits:', error.message);
}
```

### Performance Notes

- Expected dataset size: 5-50 circuits per user
- Firestore reads: 1 read per circuit document
- Index required: Composite index on `userId` + `createdAt`

---

## Function: `updateCircuit`

### Signature
```javascript
async function updateCircuit(circuitId: string, updates: Partial<CircuitUpdate>): Promise<void>
```

### Purpose
Updates an existing circuit document with new field values.

### Parameters

**`circuitId`** (string, required):
- Firestore document ID of circuit to update
- Must be a circuit owned by authenticated user

**`updates`** (Object, required):
```javascript
{
  name?: string,        // Optional: New circuit name
  latitude?: number,    // Optional: New latitude
  longitude?: number,   // Optional: New longitude
  notes?: string        // Optional: New notes (can be null or empty)
}
```

### Returns
- **Success**: `Promise<void>` - No return value
- **Failure**: Throws `Error` with user-friendly message

### Behavior

1. **Authentication Check**: Verifies user is logged in via `get(user)`
2. **Data Processing**:
   - Merges provided `updates` with `updatedAt: Timestamp.now()`
   - Trims string fields if provided
   - Converts empty notes string to `null` if applicable
3. **Firestore Operation**: Calls `updateDoc(doc(db, 'circuits', circuitId), processedUpdates)`

### Error Conditions

| Condition | Error Message |
|-----------|---------------|
| User not authenticated | `"Must be logged in to update circuits"` |
| Circuit doesn't exist | Firestore error (document not found) |
| User doesn't own circuit | Firestore permission denied |
| Firestore write fails | Firebase error message or generic error |

### Example Usage

```javascript
import { updateCircuit } from './lib/circuits.js';

try {
  await updateCircuit('circuit123', {
    notes: 'Updated notes - watch turn 4 in wet conditions'
  });
  
  console.log('Circuit updated successfully');
} catch (error) {
  console.error('Failed to update circuit:', error.message);
}
```

### Security Notes

- Firestore rules enforce user ownership: `request.auth.uid == resource.data.userId`
- Cannot update `userId` or `createdAt` fields (not passed in updates)

---

## Function: `deleteCircuit`

### Signature
```javascript
async function deleteCircuit(circuitId: string): Promise<void>
```

### Purpose
Deletes a circuit document from the `circuits` collection. Prevents deletion if any sessions reference the circuit.

### Parameters

**`circuitId`** (string, required):
- Firestore document ID of circuit to delete
- Must be a circuit owned by authenticated user

### Returns
- **Success**: `Promise<void>` - No return value
- **Failure**: Throws `Error` with user-friendly message

### Behavior

1. **Authentication Check**: Verifies user is logged in via `get(user)`
2. **Referential Integrity Check**:
   - Query sessions collection: `where('userId', '==', currentUser.uid).where('circuitId', '==', circuitId)`
   - If any sessions found, throw error with count
3. **Firestore Operation**: If no references, call `deleteDoc(doc(db, 'circuits', circuitId))`

### Error Conditions

| Condition | Error Message |
|-----------|---------------|
| User not authenticated | `"Must be logged in to delete circuits"` |
| Circuit referenced by sessions | `"Cannot delete circuit: N sessions use this circuit. Update those sessions first."` |
| Circuit doesn't exist | Firestore error (document not found) |
| User doesn't own circuit | Firestore permission denied |
| Firestore delete fails | Firebase error message or generic error |

### Example Usage

```javascript
import { deleteCircuit } from './lib/circuits.js';

// In component with confirmation dialog
const handleDelete = async (circuitId) => {
  if (!confirm('Are you sure you want to delete this circuit?')) {
    return;
  }
  
  try {
    await deleteCircuit(circuitId);
    console.log('Circuit deleted successfully');
    await loadCircuits(); // Reload list
  } catch (error) {
    if (error.message.includes('sessions use this circuit')) {
      alert('Cannot delete: This circuit is used by existing sessions');
    } else {
      console.error('Failed to delete circuit:', error.message);
    }
  }
};
```

### Referential Integrity

- **Constraint**: Circuit cannot be deleted if sessions reference it via `circuitId`
- **Check Location**: Service module function (before Firestore delete)
- **Alternative Approach**: UI could hide delete button if circuit has sessions (requires loading session stats)

---

## Module Dependencies

```javascript
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

import { db } from './firebase.js';
import { user } from './stores.js';
import { get } from 'svelte/store';
```

---

## Error Handling Pattern

All functions follow this error handling pattern:

```javascript
export const someFunction = async (...args) => {
  // 1. Check authentication
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to [action] circuits');
  }

  try {
    // 2. Perform Firestore operation
    // ...
  } catch (error) {
    // 3. Let Firebase errors propagate (component handles display)
    console.error('Error [action] circuit:', error);
    throw error;
  }
};
```

Components catch errors and display user-friendly messages in error state variable.

---

## Firestore Index Requirements

### Composite Index for `getUserCircuits`

**Collection**: `circuits`  
**Fields**:
- `userId` (Ascending)
- `createdAt` (Descending)

Add to `firestore.indexes.json`:
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

### Composite Index for `deleteCircuit` Reference Check

**Collection**: `sessions`  
**Fields**:
- `userId` (Ascending)
- `circuitId` (Ascending)

May be automatically created by Firebase or may need explicit definition if error occurs.

---

## Testing Considerations

### Unit Testing (if implemented)

Mock dependencies:
- `get(user)` returns mock user or null
- Firestore functions return mock data or throw errors
- Verify correct Firestore functions called with correct arguments

### Integration Testing with Firebase Emulators

1. Start Firestore emulator
2. Create test user and authenticate
3. Call `addCircuit()` and verify document created
4. Call `getUserCircuits()` and verify correct filtering
5. Call `updateCircuit()` and verify changes persisted
6. Create session with `circuitId` reference
7. Call `deleteCircuit()` and verify error thrown (referential integrity)
8. Remove session reference
9. Call `deleteCircuit()` and verify document deleted

### Manual Testing

See `quickstart.md` for manual testing checklist covering all API functions.

---

## Version History

- **v1.0.0** (2025-11-18): Initial API contract definition

---

## Related Documents

- **Data Model**: `../data-model.md` - Entity schemas and field definitions
- **Feature Spec**: `../spec.md` - User stories and requirements
- **Implementation Plan**: `../plan.md` - Technical approach and architecture
