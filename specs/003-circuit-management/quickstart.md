# Circuit Management Quickstart Guide

**Feature**: Circuit Management  
**Branch**: `003-circuit-management`  
**Date**: 2025-11-18

## Overview

This guide helps developers implement, test, and verify the Circuit Management feature for the KartLog application.

## Prerequisites

- Node.js 20.19+ or 22.12+ or 24+
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project configured (see root `FIREBASE_SETUP.md`)
- Local development environment set up (`npm install` completed)

## Quick Start Commands

```bash
# Start development server
npm run dev

# Run Firebase emulators (optional, for local testing)
firebase emulators:start

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## Implementation Checklist

### Phase 1: Service Module

**File**: `src/lib/circuits.js`

- [ ] Import Firebase dependencies (collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp)
- [ ] Import db from './firebase.js'
- [ ] Import user store from './stores.js' and get from 'svelte/store'
- [ ] Implement `addCircuit(circuitData)` function
  - Check user authentication
  - Add userId and createdAt fields
  - Trim whitespace, convert empty notes to null
  - Call addDoc and return document ID
- [ ] Implement `getUserCircuits()` function
  - Check user authentication
  - Query with userId filter and createdAt ordering
  - Map docs to objects with IDs
- [ ] Implement `updateCircuit(circuitId, updates)` function
  - Check user authentication
  - Add updatedAt timestamp
  - Call updateDoc with processed updates
- [ ] Implement `deleteCircuit(circuitId)` function
  - Check user authentication
  - Query sessions for circuitId references
  - Throw error if references exist with count
  - Call deleteDoc if no references

**Reference**: `src/lib/engines.js` (mirror this pattern)

### Phase 2: Route Components

**File**: `src/routes/Circuits.svelte` (list view)

- [ ] Import dependencies (onMount, push, link, SMUI components)
- [ ] Import getUserCircuits and deleteCircuit from circuits service
- [ ] Create state variables (circuits array, loading, error)
- [ ] Implement loadCircuits() function
- [ ] Implement handleDelete() with confirmation dialog
- [ ] Render page header with "Add New Circuit" button
- [ ] Render LayoutGrid with circuit cards
- [ ] Display circuit name, coordinates (formatted), notes
- [ ] Add Edit and Delete action buttons
- [ ] Handle empty state (no circuits message)
- [ ] onMount: call loadCircuits()

**Reference**: `src/routes/Engines.svelte`

**File**: `src/routes/NewCircuit.svelte` (create form)

- [ ] Import dependencies (push, link, SMUI components)
- [ ] Import addCircuit from circuits service
- [ ] Create form state variables (name, latitude, longitude, notes, loading, error)
- [ ] Implement validateCoordinates() helper function
  - Check latitude range (-90 to +90)
  - Check longitude range (-180 to +180)
  - Return parsed numbers or throw error
- [ ] Implement handleSubmit() function
  - Validate required fields
  - Validate coordinates
  - Call addCircuit
  - Navigate to /circuits on success
- [ ] Render form with Textfield components
  - Name (text, required)
  - Latitude (type="number", step="any", required)
  - Longitude (type="number", step="any", required)
  - Notes (textarea, optional)
- [ ] Add Cancel and Submit buttons

**Reference**: `src/routes/NewEngine.svelte`

**File**: `src/routes/EditCircuit.svelte` (update form)

- [ ] Import dependencies (onMount, push, link, SMUI components)
- [ ] Import getUserCircuits and updateCircuit from circuits service
- [ ] Extract circuitId from route params
- [ ] Load circuit data in onMount
- [ ] Pre-fill form fields with current values
- [ ] Implement handleSubmit() with validation
- [ ] Call updateCircuit with changes
- [ ] Navigate to /circuits on success

**Reference**: `src/routes/EditEngine.svelte`

### Phase 3: Routing Configuration

**File**: `src/App.svelte` (or wherever routes are defined)

- [ ] Add route: `/circuits` → `Circuits.svelte`
- [ ] Add route: `/circuits/new` → `NewCircuit.svelte`
- [ ] Add route: `/circuits/edit/:id` → `EditCircuit.svelte`

**Note**: Check existing routing configuration pattern in the app.

### Phase 4: Navigation Menu

**File**: `src/lib/Navigation.svelte` (or main navigation component)

- [ ] Add "Circuits" link to navigation menu
- [ ] Link to `/circuits` route
- [ ] Use consistent styling with other nav items

### Phase 5: Session Integration

**File**: `src/lib/sessions.js`

- [ ] Update `addSession()` to accept `circuitId` instead of/alongside `circuit` string
- [ ] Ensure `circuitId` included in session document data

**File**: `src/routes/NewSession.svelte`

- [ ] Import getUserCircuits from circuits service
- [ ] Load circuits in onMount or loadData function
- [ ] Sort circuits alphabetically by name
- [ ] Replace circuit Textfield with Select component
- [ ] Populate Select with circuit options (show name, store ID)
- [ ] Add empty state handling (link to /circuits if no circuits exist)
- [ ] Update form validation to require circuitId
- [ ] Pass circuitId to addSession instead of circuit string

**File**: `src/routes/EditSession.svelte`

- [ ] Apply same circuit selection changes as NewSession.svelte
- [ ] Pre-select current session's circuit

**File**: `src/routes/Sessions.svelte` (list view)

- [ ] Load circuits alongside sessions
- [ ] Create circuit lookup map for efficient resolution
- [ ] Display circuit name by resolving circuitId
- [ ] Handle backward compatibility (fall back to circuit string if circuitId missing)

**File**: `src/routes/ViewSession.svelte` (detail view)

- [ ] Load circuits alongside session
- [ ] Resolve circuitId to circuit object
- [ ] Display circuit name (and optionally coordinates/notes)
- [ ] Handle backward compatibility

### Phase 6: Firestore Security Rules

**File**: `firestore.rules`

- [ ] Add circuits collection security rules:
  ```javascript
  match /circuits/{circuitId} {
    allow read, write: if request.auth != null && 
      request.auth.uid == resource.data.userId;
    allow create: if request.auth != null && 
      request.auth.uid == request.resource.data.userId;
  }
  ```
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

### Phase 7: Firestore Indexes

**File**: `firestore.indexes.json`

- [ ] Add composite index for circuits query:
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
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

### Phase 8: Styling

- [ ] Verify circuits page uses existing CSS patterns (`action-buttons.css`, `table.css`)
- [ ] Ensure mobile responsiveness (test at 375px width)
- [ ] Verify touch targets ≥44px
- [ ] Add any circuit-specific styles if needed

## Testing Checklist

### Manual Testing - Circuit CRUD

**Test 1: Add Circuit (Valid Data)**
1. Navigate to /circuits
2. Click "Add New Circuit"
3. Enter name: "Buckmore Park"
4. Enter latitude: 51.4545
5. Enter longitude: 0.2156
6. Enter notes: "My home track"
7. Click Submit
8. **Expected**: Redirect to /circuits, new circuit appears in list

**Test 2: Add Circuit (Validation Errors)**
1. Navigate to /circuits/new
2. Leave name empty, click Submit
3. **Expected**: Error "Name, latitude, and longitude are required"
4. Enter name: "Test Track"
5. Enter latitude: 100 (invalid)
6. Enter longitude: 0
7. Click Submit
8. **Expected**: Error "Latitude must be between -90 and +90 degrees"
9. Fix latitude: 51.5
10. Enter longitude: 200 (invalid)
11. Click Submit
12. **Expected**: Error "Longitude must be between -180 and +180 degrees"

**Test 3: View Circuits**
1. Add 3-5 circuits with different names
2. Navigate to /circuits
3. **Expected**: All circuits display with name, coordinates, notes
4. **Expected**: Coordinates formatted with 4 decimal places
5. **Expected**: Circuits sorted by creation date (newest first)

**Test 4: Edit Circuit**
1. Navigate to /circuits
2. Click "Edit" on a circuit
3. **Expected**: Form pre-filled with current values
4. Modify notes field
5. Click Save
6. **Expected**: Redirect to /circuits, changes visible

**Test 5: Delete Circuit (No References)**
1. Create a circuit with no sessions
2. Navigate to /circuits
3. Click "Delete" on the circuit
4. **Expected**: Confirmation dialog appears
5. Click Cancel
6. **Expected**: Dialog closes, circuit remains
7. Click "Delete" again, confirm
8. **Expected**: Circuit removed from list

**Test 6: Delete Circuit (With References)**
1. Create a circuit
2. Create a session using that circuit
3. Navigate to /circuits
4. Click "Delete" on the circuit
5. Confirm deletion
6. **Expected**: Error message "Cannot delete circuit: 1 sessions use this circuit"
7. Circuit remains in list

### Manual Testing - Session Integration

**Test 7: Session Form Circuit Selection**
1. Ensure at least 3 circuits exist
2. Navigate to /sessions/new
3. **Expected**: Circuit field is a dropdown (not text input)
4. Open circuit dropdown
5. **Expected**: Circuits sorted alphabetically by name
6. Select a circuit
7. Fill other required fields
8. Submit form
9. **Expected**: Session created successfully

**Test 8: Empty Circuit Library**
1. Delete all circuits (or use fresh test account)
2. Navigate to /sessions/new
3. **Expected**: Circuit dropdown empty or shows helpful message
4. **Expected**: Message links to /circuits page

**Test 9: Session Display with Circuit**
1. Create session with circuit selected
2. Navigate to /sessions (list view)
3. **Expected**: Session shows circuit name (resolved from circuitId)
4. Click to view session details
5. **Expected**: Circuit name displayed in session details

**Test 10: Backward Compatibility**
1. Manually create session with old `circuit` string field (no `circuitId`)
2. Navigate to /sessions
3. **Expected**: Session displays with circuit string value
4. Edit session
5. **Expected**: Circuit dropdown allows selecting new circuit

### Manual Testing - Mobile Responsiveness

**Test 11: Mobile Circuit List**
1. Open browser dev tools, set viewport to 375px width
2. Navigate to /circuits
3. **Expected**: Circuit cards stack vertically
4. **Expected**: All content readable, no horizontal scroll
5. **Expected**: Action buttons easily tappable (≥44px)

**Test 12: Mobile Circuit Form**
1. Set viewport to 375px width
2. Navigate to /circuits/new
3. Tap latitude field
4. **Expected**: Numeric keyboard appears (mobile device)
5. Enter coordinates
6. **Expected**: No layout issues, all fields accessible

**Test 13: Mobile Session Form**
1. Set viewport to 375px width
2. Navigate to /sessions/new
3. Tap circuit dropdown
4. **Expected**: Dropdown opens, options readable
5. Select circuit
6. **Expected**: Selection works correctly

### Manual Testing - Security & Data Isolation

**Test 14: User Data Isolation**
1. Create circuits as User A
2. Log out, log in as User B
3. Navigate to /circuits
4. **Expected**: User B sees empty list (not User A's circuits)
5. Create circuits as User B
6. **Expected**: Only User B's circuits visible

**Test 15: Unauthenticated Access**
1. Log out
2. Attempt to navigate to /circuits
3. **Expected**: Redirect to login or access denied
4. (Depends on existing auth guard implementation)

### Manual Testing - Edge Cases

**Test 16: Very Long Circuit Name**
1. Add circuit with 100+ character name
2. **Expected**: Name saves and displays correctly
3. Check circuit cards don't break layout

**Test 17: Very Long Notes**
1. Add circuit with 1000+ character notes
2. **Expected**: Notes save correctly
3. Check display truncates or handles gracefully in list view

**Test 18: Duplicate Circuit Names**
1. Add circuit named "Test Track"
2. Add another circuit named "Test Track"
3. **Expected**: Both circuits exist independently
4. **Expected**: Can distinguish by coordinates or notes

**Test 19: Negative Coordinates**
1. Add circuit with latitude: -33.8688 (Sydney, Australia)
2. Add circuit with longitude: -122.4194 (San Francisco, USA)
3. **Expected**: Negative coordinates accepted and displayed correctly

**Test 20: Decimal Precision**
1. Add circuit with latitude: 51.45451234 (many decimals)
2. **Expected**: Full precision stored
3. **Expected**: Display shows 4 decimal places (rounded)

## Firebase Emulator Testing (Optional)

If using Firebase emulators for local development:

1. Start emulators: `firebase emulators:start`
2. Configure app to use emulator endpoints (check `src/lib/firebase.js`)
3. Run all tests against emulator database
4. Verify security rules in Emulator UI (http://localhost:4000)
5. Check Firestore data in Emulator UI

## Deployment Steps

Once all tests pass:

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Implement circuit management feature"
   ```

2. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Deploy Application** (if using Firebase Hosting):
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. **Verify Production**:
   - Test circuit CRUD operations in production
   - Verify session integration works
   - Check mobile responsiveness on real device

## Troubleshooting

### Issue: "Missing index" error when loading circuits

**Solution**: Deploy Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```
Or click the index creation link in the Firebase console error message.

### Issue: "Permission denied" when creating circuit

**Solution**: 
1. Check user is authenticated before calling circuit functions
2. Verify Firestore rules deployed correctly
3. Check userId field is set correctly in circuit document

### Issue: Circuit dropdown empty in session form

**Solution**:
1. Verify circuits exist for current user
2. Check `getUserCircuits()` called in onMount
3. Check for errors in browser console
4. Verify circuits array populated before rendering dropdown

### Issue: Session display shows "Unknown Circuit"

**Solution**:
1. Check session has `circuitId` field populated
2. Verify circuits loaded alongside sessions
3. Check circuit lookup map created correctly
4. Verify circuitId matches an actual circuit document ID

### Issue: Cannot delete circuit with sessions

**Expected Behavior**: This is intentional. Delete or update the sessions first, then delete the circuit.

### Issue: Mobile numeric keyboard not appearing

**Solution**: Verify input type is `type="number"` for latitude/longitude fields.

## File Locations Quick Reference

```
src/
├── lib/
│   ├── circuits.js          # NEW: Circuit service module
│   ├── sessions.js          # MODIFIED: Add circuitId support
│   └── Navigation.svelte    # MODIFIED: Add circuits nav link
├── routes/
│   ├── Circuits.svelte      # NEW: Circuit list view
│   ├── NewCircuit.svelte    # NEW: Add circuit form
│   ├── EditCircuit.svelte   # NEW: Edit circuit form
│   ├── NewSession.svelte    # MODIFIED: Circuit dropdown
│   ├── EditSession.svelte   # MODIFIED: Circuit dropdown
│   ├── Sessions.svelte      # MODIFIED: Display circuit names
│   └── ViewSession.svelte   # MODIFIED: Display circuit details
└── App.svelte               # MODIFIED: Add circuit routes

firestore.rules                # MODIFIED: Add circuit rules
firestore.indexes.json         # MODIFIED: Add circuit indexes
```

## Next Steps

After completing implementation and testing:

1. Create pull request for code review
2. Update any user-facing documentation
3. Consider data migration for existing sessions (separate task)
4. Monitor for errors after deployment
5. Gather user feedback on circuit management UX

## Related Documents

- **Feature Spec**: `spec.md` - Requirements and user stories
- **Data Model**: `data-model.md` - Entity schemas
- **API Contract**: `contracts/circuits-api.md` - Service module specification
- **Implementation Plan**: `plan.md` - Technical approach

---

**Questions or Issues?**

Check existing engines/chassis implementations for pattern reference, or consult the project constitution in `.specify/memory/constitution.md`.
