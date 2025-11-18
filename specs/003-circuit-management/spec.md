# Feature Specification: Circuit Management

**Feature Branch**: `003-circuit-management`  
**Created**: 2025-11-18  
**Status**: Draft  
**Input**: User description: "I'd like to extend this application to provide more feature rich functionality for managing circuits. At the moment the circuit is just a string associated with each session. I'd like to turn this into an entity (with circuit name, latitude, longitude, notes), that has a CRUD style interface (similar to engines) that allows the user to update and manage circuits"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View All Circuits (Priority: P1)

A karting enthusiast needs to see all racing circuits they've visited, with key information like location coordinates, so they can quickly reference circuit details when planning future sessions or reviewing past performance.

**Why this priority**: This is the foundation—users must be able to view their circuits before any other operations make sense. Delivers immediate value by providing a centralized circuit reference.

**Independent Test**: Can be fully tested by logging in, navigating to the circuits page, and verifying that all user's circuits display with name, location data (latitude/longitude), and notes. Delivers value as a circuit directory even without other operations.

**Acceptance Scenarios**:

1. **Given** user is logged in with existing circuits in database, **When** user navigates to circuits page, **Then** all their circuits display in a list/grid with circuit name, latitude, longitude, and notes preview
2. **Given** user is logged in with no circuits, **When** user navigates to circuits page, **Then** empty state displays with message prompting them to add their first circuit
3. **Given** circuits page is displaying, **When** user views circuit information, **Then** latitude and longitude are formatted clearly (e.g., "51.4545°N, 1.0152°W")

---

### User Story 2 - Add New Circuit (Priority: P1)

A user who just raced at a new circuit needs to add it to their library with name, geographic coordinates, and personal notes (e.g., "tight hairpin at turn 3"), so they can track which circuits they've raced and reference setup notes for future visits.

**Why this priority**: Adding circuits is essential for building the circuit library. Without this, users cannot populate their circuit data. Equally critical as viewing circuits for MVP.

**Independent Test**: Can be fully tested by clicking "Add Circuit" button, filling form with name, latitude, longitude, and notes, submitting, and verifying new circuit appears in list. Delivers value by allowing users to build their circuit database.

**Acceptance Scenarios**:

1. **Given** user is on circuits page, **When** user clicks "Add Circuit" button, **Then** form displays with fields for circuit name (required), latitude (required), longitude (required), and notes (optional)
2. **Given** user is on add circuit form, **When** user enters "Buckmore Park" as name, "51.4545" as latitude, "0.2156" as longitude, and "My home track" as notes, then submits, **Then** new circuit is created and user sees success confirmation
3. **Given** user is on add circuit form, **When** user attempts to submit without required fields (name, latitude, or longitude), **Then** validation error displays indicating which fields are missing
4. **Given** user is on add circuit form, **When** user enters invalid coordinate values (e.g., latitude > 90 or longitude > 180), **Then** validation error displays explaining valid coordinate ranges

---

### User Story 3 - Edit Existing Circuit (Priority: P2)

A user needs to update circuit information (e.g., correcting coordinates, adding notes about recent track changes), so their circuit library stays accurate and useful for session planning.

**Why this priority**: Important for maintaining data quality, but users can work around by deleting and re-adding circuits if needed. Can be deferred if MVP needs faster delivery.

**Independent Test**: Can be fully tested by clicking "Edit" on an existing circuit, modifying any field (name, coordinates, notes), saving, and verifying changes persist. Delivers value by allowing circuit information refinement.

**Acceptance Scenarios**:

1. **Given** user is viewing circuits list, **When** user clicks "Edit" button on a circuit, **Then** edit form displays pre-filled with current circuit data (name, latitude, longitude, notes)
2. **Given** user is on edit circuit form, **When** user modifies the notes field from "Fast track" to "Fast track - watch turn 4 in wet conditions" and saves, **Then** circuit updates and displays new notes
3. **Given** user is on edit circuit form, **When** user clears required field (name, latitude, or longitude) and attempts to save, **Then** validation error prevents saving and indicates which field is required

---

### User Story 4 - Delete Circuit (Priority: P2)

A user needs to remove circuits they no longer visit or entered by mistake, so their circuit list stays relevant and uncluttered.

**Why this priority**: Nice to have for housekeeping, but not critical for MVP. Users can tolerate unused circuits remaining in their list initially.

**Independent Test**: Can be fully tested by clicking "Delete" on a circuit, confirming deletion, and verifying circuit no longer appears in list. Delivers value by allowing list cleanup.

**Acceptance Scenarios**:

1. **Given** user is viewing circuits list, **When** user clicks "Delete" button on a circuit, **Then** confirmation dialog appears asking "Are you sure you want to delete this circuit?"
2. **Given** confirmation dialog is displayed and circuit has no session references, **When** user confirms deletion, **Then** circuit is removed from database and no longer appears in circuits list
3. **Given** confirmation dialog is displayed, **When** user cancels deletion, **Then** dialog closes and circuit remains in list unchanged
4. **Given** circuit is associated with existing sessions, **When** user attempts to delete it, **Then** deletion is blocked and error message displays indicating how many sessions reference this circuit (e.g., "Cannot delete circuit: 5 sessions use this circuit. Update those sessions first.")

---

### User Story 5 - Link Sessions to Circuits (Priority: P1)

When creating or editing a session, a user needs to select a circuit from their managed circuit library (instead of typing a string), so circuit data is consistent and they can leverage the geographic and notes information stored with each circuit.

**Why this priority**: This is the integration point that makes circuit entities useful—without this, circuit management is isolated from session tracking. Critical for MVP to demonstrate value of circuit entities.

**Independent Test**: Can be fully tested by creating/editing a session and selecting a circuit from dropdown (populated from circuit library) instead of typing text. Verifying the session stores circuit ID reference. Delivers value by connecting sessions to structured circuit data.

**Acceptance Scenarios**:

1. **Given** user is on new/edit session form, **When** user views circuit field, **Then** field displays as dropdown/select populated with all user's circuits (showing circuit names)
2. **Given** user is selecting circuit on session form, **When** user chooses "Buckmore Park" from dropdown, **Then** session stores reference to that circuit entity (circuit ID)
3. **Given** user is viewing session details, **When** session displays, **Then** circuit name is shown (derived from linked circuit entity)
4. **Given** user has no circuits in library, **When** user opens new session form, **Then** circuit dropdown shows empty state with message like "Add circuits first" and link to circuits page

---

### Edge Cases

- What happens when user enters latitude/longitude in wrong format (e.g., degrees-minutes-seconds instead of decimal degrees)?
- How does system handle circuits with identical names (e.g., two circuits both named "Local Track")?
- What happens to existing sessions that have circuit stored as text string when migrating to circuit entities?
- How does system handle very long circuit notes (e.g., 5000+ characters)?
- What happens when user tries to enter latitude/longitude outside valid ranges (-90 to +90 for latitude, -180 to +180 for longitude)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a circuits management page accessible via navigation menu
- **FR-002**: System MUST display all circuits belonging to authenticated user, showing circuit name, latitude, longitude, and notes for each circuit
- **FR-003**: System MUST provide "Add Circuit" functionality with form accepting circuit name (text, required), latitude (decimal degrees, required), longitude (decimal degrees, required), and notes (text, optional)
- **FR-004**: System MUST validate latitude values are between -90 and +90 degrees
- **FR-005**: System MUST validate longitude values are between -180 and +180 degrees
- **FR-006**: System MUST validate circuit name is not empty and contains at least 1 character
- **FR-007**: System MUST provide "Edit Circuit" functionality allowing users to modify any circuit field (name, latitude, longitude, notes)
- **FR-008**: System MUST provide "Delete Circuit" functionality with confirmation dialog before deletion
- **FR-009**: System MUST store circuits in Firestore with fields: name (string), latitude (number), longitude (number), notes (string), userId (string), createdAt (timestamp)
- **FR-010**: System MUST enforce user data isolation—users can only view/edit/delete their own circuits (userId matches authenticated user)
- **FR-011**: System MUST convert session circuit field from freeform text to circuit entity reference (foreign key to circuits collection)
- **FR-012**: Session forms MUST display circuit selection as dropdown populated from user's circuit library
- **FR-013**: System MUST display circuit name on session views by resolving circuit ID reference
- **FR-014**: System MUST handle empty circuit library gracefully on session forms with helpful message directing users to add circuits
- **FR-015**: System MUST sort circuits alphabetically by name in selection dropdowns
- **FR-016**: System MUST display circuits in list/card layout following existing UI patterns (similar to engines/chassis pages)
- **FR-017**: System MUST persist circuit data to Firestore with proper error handling and user feedback on failures
- **FR-018**: System MUST prevent circuit deletion when sessions reference that circuit, displaying error message with count of referencing sessions

### Key Entities

- **Circuit**: Represents a racing circuit/track with name (string), latitude (decimal degrees number), longitude (decimal degrees number), notes (optional text for personal observations), userId (owner reference), createdAt (timestamp). Related to sessions through foreign key relationship (session stores circuitId).
- **Session**: Existing entity—circuit field changes from freeform string to circuit ID reference (circuitId), enabling lookup of full circuit details including geographic coordinates and notes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Circuit library displays all user's circuits with complete information (name, coordinates, notes) without requiring page refresh
- **SC-002**: Session creation form displays circuit selection dropdown populated from circuit library, eliminating need to manually type circuit names
- **SC-003**: Users can view circuit geographic coordinates (latitude/longitude) directly from circuits page without needing external tools
- **SC-004**: Circuit data validation prevents invalid coordinate entries (latitude outside ±90° or longitude outside ±180°) 100% of the time

## Assumptions

- Users understand decimal degrees format for coordinates (e.g., 51.4545, -0.2156) rather than degrees-minutes-seconds format
- Users will manually enter coordinates from external sources (maps, GPS devices)—no integration with mapping APIs for coordinate lookup is required for MVP
- Circuit entity does not track additional metadata like track length, configuration, or surface type initially—can be added in future iterations if needed
- Existing sessions with circuit stored as text will require data migration (handled separately from this feature implementation)
- Users typically manage 5-50 circuits in their library (not hundreds)—simple alphabetical dropdown is sufficient without search functionality
- Latitude and longitude precision to 4 decimal places (~11 meters accuracy) is sufficient for circuit identification
- Notes field supports plain text without rich formatting (no markdown, HTML, or attachments)
- Mobile users can reasonably enter coordinate data on mobile keyboards (numeric input type helps)

## Constitution Check

### Component-First Architecture
✅ **Compliant**: Feature will be built as Svelte components:
- `Circuits.svelte` for circuit list/grid view (route component)
- `NewCircuit.svelte` for add circuit form (route component)
- `EditCircuit.svelte` for edit circuit form (route component)
- Circuit state managed via `src/lib/circuits.js` service module (shared logic)
- Follows existing pattern established by Engines and Chassis features

### Firebase-Native Patterns
✅ **Compliant**: Firebase integration follows v9+ modular syntax:
- Service module `src/lib/circuits.js` will export functions like `addCircuit`, `getUserCircuits`, `updateCircuit`, `deleteCircuit`
- All functions use modular imports: `collection`, `addDoc`, `getDocs`, `updateDoc`, `deleteDoc`, `query`, `where`
- User authentication checked via `get(user)` from stores before operations
- Firestore operations wrapped in try-catch with user-friendly error messages

### User Security First
✅ **Compliant**: User data isolation enforced:
- All circuit documents include `userId` field set to `auth.currentUser.uid`
- Queries filter by `where('userId', '==', currentUser.uid)`
- Firestore security rules will enforce `request.auth.uid == resource.data.userId` for circuits collection
- No cross-user visibility—users only see their own circuits

### Mobile-Responsive Design
✅ **Compliant**: Mobile optimization included:
- Circuit forms use `type="number"` for latitude/longitude fields (triggers numeric keyboard)
- Circuit list follows responsive grid layout (consistent with engines/chassis pages)
- Touch targets for edit/delete buttons meet 44×44px minimum size
- Critical actions (add, save, delete) accessible within mobile viewport
- Form layout adapts to mobile screen sizes (375px minimum width tested)

### Manual Quality Assurance
✅ **Compliant**: Testing approach specified:
- User stories include acceptance scenarios defining testable flows
- Manual testing will verify: circuit CRUD operations, session integration, mobile responsiveness, data validation
- Edge cases documented for test coverage
- Testing performed on both desktop and mobile viewports
- Automated tests optional—manual verification of user journeys sufficient for MVP
