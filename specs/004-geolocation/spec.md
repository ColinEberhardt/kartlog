# Feature Specification: Geolocation Integration

**Feature Branch**: `004-geolocation`  
**Created**: 2025-11-20  
**Status**: Draft  
**Input**: User description: "use geolocation APIs to make it easier to manage sessions. When editing sessions, the circuit should default to the closest circuit to the users current location, and when adding circuits, allow the lat / long to be set using the current location."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-Select Nearest Circuit When Creating Session (Priority: P1)

A user arrives at a karting circuit and wants to log a new session. Instead of scrolling through their circuit list, they want the system to automatically suggest the closest circuit based on their current location, so they can quickly start logging session data.

**Why this priority**: This is the core value proposition—reducing friction when creating sessions at known circuits. Delivers immediate time savings and improves user experience for the most common workflow.

**Independent Test**: Can be fully tested by creating a new session while at a known circuit location. The system should automatically select the nearest circuit from the user's library. Delivers value by eliminating manual circuit selection in 80%+ of use cases.

**Acceptance Scenarios**:

1. **Given** user has circuits in their library and is within 5km of "Buckmore Park" circuit, **When** user navigates to new session form, **Then** "Buckmore Park" is automatically pre-selected in the circuit dropdown
2. **Given** user has circuits in their library but location permission is denied, **When** user navigates to new session form, **Then** circuit dropdown shows all circuits without pre-selection and no error message is displayed
3. **Given** user has circuits in their library but is not within 50km of any stored circuit, **When** user navigates to new session form, **Then** circuit dropdown shows all circuits without pre-selection
4. **Given** user has multiple circuits within 5km, **When** user navigates to new session form, **Then** the closest circuit by straight-line distance is pre-selected

---

### User Story 2 - Auto-Select Nearest Circuit When Editing Session (Priority: P2)

A user is editing a session record and wants the system to suggest the nearest circuit based on their current location as a convenience, though they may be editing the session remotely (not at the circuit), so they retain full control to change the selection.

**Why this priority**: Provides convenience but less critical than new session creation. Users editing sessions are often doing so after the fact, not at the circuit location. Still valuable for users who log sessions immediately after racing.

**Independent Test**: Can be fully tested by editing an existing session while at a circuit location. The system should pre-select the nearest circuit but allow manual override. Delivers value by speeding up session corrections made on-site.

**Acceptance Scenarios**:

1. **Given** user is editing a session and is within 5km of "Daytona Milton Keynes" circuit, **When** edit session form loads, **Then** "Daytona Milton Keynes" is automatically pre-selected in the circuit dropdown
2. **Given** user is editing a session with pre-selected nearest circuit, **When** user manually changes the circuit selection, **Then** manual selection is retained and saved
3. **Given** user is editing a session but location permission is denied or unavailable, **When** edit session form loads, **Then** circuit dropdown shows the currently stored circuit (from session data) as selected

---

### User Story 3 - Set Circuit Coordinates Using Current Location (Priority: P1)

A user is at a new circuit and wants to add it to their library. Instead of looking up latitude/longitude coordinates online or using a separate mapping app, they want to use their current location to automatically populate the coordinate fields, so circuit creation is faster and more accurate.

**Why this priority**: Critical for reducing barriers to adding new circuits. Looking up coordinates is tedious and error-prone. This makes circuit management practical for users who discover new tracks frequently.

**Independent Test**: Can be fully tested by clicking "Add Circuit" while at a circuit location, then clicking a "Use My Location" button that populates latitude/longitude fields with current coordinates. Delivers value by eliminating manual coordinate entry.

**Acceptance Scenarios**:

1. **Given** user is on add circuit form, **When** form loads, **Then** "Use My Location" button is visible next to latitude/longitude fields
2. **Given** user is on add circuit form with location permission granted, **When** user clicks "Use My Location" button, **Then** latitude and longitude fields populate with current coordinates (e.g., "51.4545", "0.2156") and button shows success feedback (e.g., "Location captured")
3. **Given** user is on add circuit form without location permission, **When** user clicks "Use My Location" button, **Then** browser prompts for location access permission
4. **Given** user is on add circuit form and location permission is denied, **When** user clicks "Use My Location" button, **Then** message displays explaining permission is needed and how to enable it in browser settings
5. **Given** user has used "Use My Location" to populate coordinates, **When** user manually edits the coordinate values, **Then** manual changes are retained (not overwritten by geolocation)

---

### User Story 4 - Set Circuit Coordinates Using Current Location When Editing (Priority: P3)

A user is editing an existing circuit record and realizes the coordinates are incorrect. They want to update the coordinates using their current location (if they're at the circuit), so they can correct location data without manual lookup.

**Why this priority**: Lower priority because editing coordinates is less common than initial circuit creation. Most circuits are added once with correct coordinates. Nice to have for error corrections.

**Independent Test**: Can be fully tested by editing an existing circuit and clicking "Use My Location" to update coordinates. Delivers value for fixing data quality issues.

**Acceptance Scenarios**:

1. **Given** user is on edit circuit form, **When** form loads, **Then** "Use My Location" button is visible next to latitude/longitude fields
2. **Given** user is on edit circuit form with location permission granted, **When** user clicks "Use My Location" button, **Then** latitude and longitude fields update with current coordinates and show visual confirmation
3. **Given** user clicks "Use My Location" but is not at the circuit location, **When** user reviews the updated coordinates, **Then** user can manually correct or revert the changes before saving

---

### Edge Cases

- What happens when user's device reports inaccurate location data (e.g., GPS signal is weak or positioning shows they're 500m from actual location)?
- How does system handle location requests that timeout or fail to return coordinates?
- What happens when user denies location permission initially but wants to grant it later during the same session?
- How does system determine "nearest circuit" when user is equidistant from two circuits (e.g., within 100m of both)?
- What happens when user's device doesn't support geolocation API (e.g., very old browser)?
- How does system handle scenarios where browser provides location but with low accuracy (e.g., accuracy radius of 5km)?
- What happens when user creates/edits session on desktop computer that doesn't have GPS (only IP-based location)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST request user's location permission through browser geolocation API when location features are first used
- **FR-002**: System MUST calculate distance between user's current location and all circuits in their library using great-circle distance formula (haversine)
- **FR-003**: System MUST automatically pre-select the nearest circuit when creating a new session if user is within 50km of any stored circuit
- **FR-004**: System MUST automatically pre-select the nearest circuit when editing a session if user is within 50km of any stored circuit
- **FR-005**: System MUST display a "Use My Location" button on add circuit form next to latitude/longitude fields
- **FR-006**: System MUST display a "Use My Location" button on edit circuit form next to latitude/longitude fields
- **FR-007**: System MUST populate latitude/longitude fields with current coordinates when user clicks "Use My Location" and permission is granted
- **FR-008**: System MUST provide clear visual feedback when location is successfully captured (e.g., button state change, success message)
- **FR-009**: System MUST handle location permission denial gracefully without blocking circuit or session creation/editing workflows
- **FR-010**: System MUST display helpful message when location permission is denied, explaining how it benefits the user and how to enable it
- **FR-011**: System MUST allow manual override of auto-selected circuits in session forms
- **FR-012**: System MUST allow manual editing of coordinates after they're populated by "Use My Location" feature
- **FR-013**: System MUST work correctly when location services are unavailable, degrading gracefully to manual circuit selection and coordinate entry
- **FR-014**: System MUST timeout location requests after 10 seconds if position cannot be determined
- **FR-015**: System MUST cache location permission status to avoid repeated permission prompts within same session

### Key Entities *(data impacts)*

- **User Location**: Latitude and longitude coordinates obtained from browser geolocation API, with accuracy indicator and timestamp
- **Circuit**: Existing entity with latitude and longitude fields (already defined in feature 003-circuit-management)
- **Distance Calculation**: Computed value representing great-circle distance in kilometers between user location and each circuit

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a session with auto-selected circuit in under 30 seconds when at a known circuit location
- **SC-002**: 80% or more of new sessions created at circuit locations use the auto-selected nearest circuit (not manually changed)
- **SC-003**: Users can add a new circuit using current location in under 2 minutes (compared to 5+ minutes looking up coordinates manually)
- **SC-004**: Location features degrade gracefully—100% of circuit and session operations remain functional when location services are denied or unavailable
- **SC-005**: Users receive actionable feedback within 2 seconds of clicking "Use My Location" (either success or clear explanation of issue)
- **SC-006**: System accurately identifies nearest circuit in 95%+ of cases when user is within 50km of a stored circuit

## Assumptions

- Users have modern browsers that support the Geolocation API (supported in all major browsers since 2010+)
- Users primarily create sessions while at or near the circuit location
- Most users will grant location permission when they understand the convenience benefits
- Circuit locations in database are accurate to within 100 meters
- Users understand that location services must be enabled on their device for geolocation features to work
- Network connectivity is available for geolocation API calls (some browsers may support offline GPS)
- Straight-line distance (great-circle) is sufficient for "nearest circuit" determination—road distance calculation is not needed
- Users may edit sessions remotely (not at circuit), so location-based suggestions should be helpful but not mandatory

## Dependencies

- Feature 003-circuit-management must be complete (circuits with latitude/longitude fields must exist)
- Browser geolocation API support (standard web platform feature)
- Device must have location services enabled at OS level for browser to access location

## Out of Scope

- Displaying circuits on a map interface (geographic visualization)
- Turn-by-turn directions to circuits
- Suggesting circuits user hasn't added yet based on public circuit databases
- Historical location tracking or session route recording
- Geofencing or automatic session start based on circuit arrival
- Sharing circuit locations with other users
- Importing circuit locations from external mapping services
- Offline geolocation caching or GPS tracking
