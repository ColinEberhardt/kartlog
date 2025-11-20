# Tasks: Geolocation Integration

**Feature**: 004-geolocation  
**Branch**: `004-geolocation`  
**Input**: Design documents from `/specs/004-geolocation/`

## Task Format

- **Checkbox**: `- [ ]` (required for all tasks)
- **Task ID**: Sequential number (T001, T002, etc.)
- **[P] marker**: Parallelizable tasks (different files, no dependencies)
- **[Story] label**: User story association (US1, US2, US3)
- **Description**: Clear action with exact file path

---

## Phase 1: Setup

**Purpose**: No setup required - using existing project structure

**Status**: ✅ Complete (feature 003-circuit-management provides circuits entity)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core geolocation service that all user stories depend on

**⚠️ CRITICAL**: This phase MUST be complete before any user story work begins

- [ ] T001 [P] Create geolocation service module in src/lib/geolocation.js with getCurrentLocation() function (returns Promise with lat/lon/accuracy)
- [ ] T002 [P] Implement calculateDistance() function in src/lib/geolocation.js using Haversine formula
- [ ] T003 [P] Implement findNearestCircuit() function in src/lib/geolocation.js (finds circuit within 50km threshold)
- [ ] T004 [P] Implement getPermissionStatus() function in src/lib/geolocation.js (returns cached permission state)
- [ ] T005 Add error handling for geolocation permission denial in src/lib/geolocation.js (graceful fallback per FR-008)
- [ ] T006 Add 10-second timeout for geolocation requests in src/lib/geolocation.js (per FR-014)
- [ ] T007 Implement permission caching to avoid repeated prompts in src/lib/geolocation.js (per FR-015)

**Checkpoint**: Geolocation service module complete and ready for component integration

---

## Phase 3: User Story 1 - Auto-Select Nearest Circuit When Creating Session (Priority: P1) 🎯 MVP

**Goal**: Automatically pre-select the nearest circuit when user creates a new session, based on their current location

**Independent Test**: Open NewSession form near a known circuit location, grant location permission, verify nearest circuit is pre-selected in dropdown. Can manually override selection before saving.

### Implementation for User Story 1

- [ ] T008 [US1] Import getCurrentLocation and findNearestCircuit from src/lib/geolocation.js in src/routes/NewSession.svelte
- [ ] T009 [US1] Add state variables for geolocation loading and error states in src/routes/NewSession.svelte
- [ ] T010 [US1] Modify onMount lifecycle to call getCurrentLocation() asynchronously in src/routes/NewSession.svelte
- [ ] T011 [US1] Integrate findNearestCircuit() to pre-select circuitId in dropdown in src/routes/NewSession.svelte (only if nearest <50km per FR-003)
- [ ] T012 [US1] Add error handling for permission denial/timeout in src/routes/NewSession.svelte (fail silently per FR-009, allow manual selection)
- [ ] T013 [US1] Add optional loading indicator "📍 Getting your location..." in src/routes/NewSession.svelte template
- [ ] T014 [US1] Verify manual override works (user can change pre-selected circuit) in src/routes/NewSession.svelte
- [ ] T015 [US1] Test on mobile viewport (375px minimum) to ensure layout remains responsive

**Manual Test Checklist for US1**:
- [ ] Open NewSession near circuit → Nearest pre-selected
- [ ] Open NewSession >50km from circuits → No pre-selection
- [ ] Deny location permission → Manual selection works, no blocking
- [ ] Multiple nearby circuits → Closest one selected
- [ ] Manual override → Selected circuit persists when saving
- [ ] Mobile (375px) → UI responsive, no layout issues

**Checkpoint**: User Story 1 complete - can create sessions with auto-selected circuits

---

## Phase 4: User Story 2 - Set Circuit Coordinates Using Current Location (Priority: P1) 🎯 MVP

**Goal**: Provide "Use My Location" button on NewCircuit form to populate latitude/longitude fields with current coordinates

**Independent Test**: Open NewCircuit form, click "Use My Location", grant permission, verify lat/long fields populate. Manually edit coordinates and save circuit.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Import getCurrentLocation from src/lib/geolocation.js in src/routes/NewCircuit.svelte
- [ ] T017 [P] [US2] Add state variables for location capture (isCapturingLocation, locationCaptureError, locationCaptureSuccess) in src/routes/NewCircuit.svelte
- [ ] T018 [US2] Implement handleUseMyLocation() handler function in src/routes/NewCircuit.svelte that calls getCurrentLocation()
- [ ] T019 [US2] Implement getUserFriendlyError() helper for error messages in src/routes/NewCircuit.svelte (per FR-009)
- [ ] T020 [US2] Add "Use My Location" button (SMUI Button) next to latitude/longitude fields in src/routes/NewCircuit.svelte template
- [ ] T021 [US2] Add button states: loading ("📍 Getting location..."), success ("✓ Location captured"), error in src/routes/NewCircuit.svelte
- [ ] T022 [US2] Populate latitude/longitude input fields with coordinates (rounded to 6 decimals) in src/routes/NewCircuit.svelte (per FR-006)
- [ ] T023 [US2] Add success feedback that auto-clears after 2 seconds in src/routes/NewCircuit.svelte (per FR-007)
- [ ] T024 [US2] Add error message display for permission denial/timeout in src/routes/NewCircuit.svelte template
- [ ] T025 [US2] Add CSS for responsive layout (coordinates-group, location-button-container) in src/routes/NewCircuit.svelte
- [ ] T026 [US2] Ensure button touch target ≥44px for mobile in src/routes/NewCircuit.svelte styles
- [ ] T027 [US2] Test button stacks below fields on narrow screens (<600px) in src/routes/NewCircuit.svelte

**Manual Test Checklist for US2**:
- [ ] Click "Use My Location" → Permission prompt appears
- [ ] Grant permission → Coordinates populate in <10s
- [ ] Coordinates rounded to 6 decimals (e.g., 51.454500)
- [ ] Success message shows briefly then clears
- [ ] Deny permission → Error message explains how to enable
- [ ] Manually edit populated coordinates → Changes retained
- [ ] Save circuit → Coordinates persist in database
- [ ] Mobile (375px) → Button 44px+, layout responsive
- [ ] Desktop → Button inline, compact layout

**Checkpoint**: User Story 2 complete - can add circuits using current location

---

## Phase 5: User Story 3 - Set Circuit Coordinates When Editing (Priority: P3)

**Goal**: Provide "Use My Location" button on EditCircuit form to update coordinates

**Independent Test**: Open EditCircuit form, click "Use My Location", verify coordinates update. Save to persist changes.

### Implementation for User Story 3

- [ ] T028 [P] [US3] Import getCurrentLocation from src/lib/geolocation.js in src/routes/EditCircuit.svelte
- [ ] T029 [P] [US3] Add state variables for location capture (same as NewCircuit) in src/routes/EditCircuit.svelte
- [ ] T030 [US3] Copy handleUseMyLocation() handler from NewCircuit to src/routes/EditCircuit.svelte
- [ ] T031 [US3] Copy getUserFriendlyError() helper from NewCircuit to src/routes/EditCircuit.svelte
- [ ] T032 [US3] Add "Use My Location" button next to existing latitude/longitude fields in src/routes/EditCircuit.svelte template
- [ ] T033 [US3] Add button states (loading/success/error) in src/routes/EditCircuit.svelte (same as NewCircuit)
- [ ] T034 [US3] Add error message display in src/routes/EditCircuit.svelte template
- [ ] T035 [US3] Copy responsive CSS from NewCircuit to src/routes/EditCircuit.svelte styles
- [ ] T036 [US3] Verify existing coordinates remain if "Use My Location" not clicked in src/routes/EditCircuit.svelte

**Manual Test Checklist for US3**:
- [ ] Open EditCircuit → Existing coordinates pre-filled
- [ ] Click "Use My Location" → New coordinates populate
- [ ] Don't click button → Existing coordinates unchanged
- [ ] Save without using location → Original coordinates persist
- [ ] Save after using location → New coordinates persist
- [ ] Mobile (375px) → Button responsive, 44px+ touch target

**Checkpoint**: User Story 3 complete - can edit circuit coordinates using location

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T037 [P] Test all three user stories end-to-end on desktop Chrome/Firefox
- [ ] T038 [P] Test all three user stories end-to-end on mobile Safari/Chrome
- [ ] T039 [P] Verify graceful degradation when location permission denied across all forms
- [ ] T040 [P] Verify 10-second timeout works correctly (slow network simulation)
- [ ] T041 Test edge case: no circuits in database (NewSession should not crash)
- [ ] T042 Test edge case: user equidistant from two circuits (first found selected)
- [ ] T043 Test edge case: coordinates at boundary values (lat=90, lon=180)
- [ ] T044 Verify accuracy acceptance (low accuracy like 5km should work per FR-016)
- [ ] T045 [P] Update constitution check in specs/004-geolocation/plan.md to mark implementation complete
- [ ] T046 Code review: verify no direct browser API access in components (only via service module)
- [ ] T047 Performance check: distance calculation <100ms for 20 circuits
- [ ] T048 Security check: no location data stored in database (transient only)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → ✅ Already complete
     ↓
Phase 2 (Foundational) → BLOCKS all user stories
     ↓
     ├─→ Phase 3 (US1 - Auto-select) ─┐
     ├─→ Phase 4 (US2 - NewCircuit) ──┼─→ Phase 6 (Polish)
     └─→ Phase 5 (US3 - EditCircuit) ─┘

All user stories can proceed in parallel after Phase 2
```

### User Story Dependencies

- **US1 (Auto-select)**: Depends on Phase 2 (geolocation service) - No dependencies on other stories
- **US2 (NewCircuit button)**: Depends on Phase 2 (geolocation service) - No dependencies on other stories  
- **US3 (EditCircuit button)**: Depends on Phase 2 (geolocation service) - No dependencies on other stories

**Independence**: All three user stories are completely independent and can be implemented/tested separately

### Task Dependencies Within Phases

**Phase 2 (Foundational)**:
- T001-T004 can run in parallel (different functions in same file)
- T005-T007 depend on T001 (error handling needs getCurrentLocation)

**Phase 3 (US1)**:
- T008-T009 are parallelizable
- T010-T014 are sequential (modify same component)
- T015 can run anytime after T010

**Phase 4 (US2)**:
- T016-T017 can run in parallel
- T018-T027 are sequential (modify same component)

**Phase 5 (US3)**:
- T028-T029 can run in parallel
- T030-T036 are sequential (modify same component)

**Phase 6 (Polish)**:
- T037-T040, T045, T046-T048 can all run in parallel
- T041-T044 should run sequentially (edge case testing)

---

## Parallel Opportunities

### After Phase 2 Completes (Foundation Ready):

**Option A - Single Developer (Sequential)**:
```bash
1. Complete Phase 2 (T001-T007) → Foundation ready
2. Implement US1 (T008-T015) → Test independently → MVP!
3. Implement US2 (T016-T027) → Test independently
4. Implement US3 (T028-T036) → Test independently
5. Polish (T037-T048) → Final validation
```

**Option B - Multiple Developers (Parallel)**:
```bash
1. Complete Phase 2 together (T001-T007) → Foundation ready

Then split:
Developer A: US1 (T008-T015)
Developer B: US2 (T016-T027)
Developer C: US3 (T028-T036)

2. All stories complete independently
3. Integrate and run Phase 6 (T037-T048) together
```

### Within Each Phase:

**Phase 2**: T001-T004 parallel, then T005-T007 sequential  
**Phase 6**: T037-T040, T045-T048 all parallel

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Recommended path for fastest value delivery**:

1. ✅ Phase 1: Setup (already done via feature 003)
2. **Phase 2: Foundational** (T001-T007) → ~30 min
3. **Phase 3: User Story 1** (T008-T015) → ~45 min
4. **STOP and VALIDATE**: Test auto-select independently
5. **DEMO MVP**: Auto-select circuit works!

**At this point, you have a working MVP that delivers core value** (80% of use cases per spec SC-002)

### Incremental Delivery

**After MVP, add remaining stories**:

6. **Phase 4: User Story 2** (T016-T027) → ~60 min → Test independently
7. **DEMO**: "Use My Location" on NewCircuit works!
8. **Phase 5: User Story 3** (T028-T036) → ~30 min → Test independently
9. **Phase 6: Polish** (T037-T048) → ~30 min → Final validation

**Total Estimated Time**: 3.5 hours

### Story-by-Story Value

- **After US1**: Users save time creating sessions (core workflow)
- **After US2**: Users save 3-5 minutes per new circuit (coordinate lookup eliminated)
- **After US3**: Users can fix incorrect coordinates easily (data quality)
- **After Polish**: Production-ready with full testing

---

## File Summary

**Files Modified** (3 components):
- `src/routes/NewSession.svelte` - Auto-select nearest circuit (US1)
- `src/routes/NewCircuit.svelte` - "Use My Location" button (US2)
- `src/routes/EditCircuit.svelte` - "Use My Location" button (US3)

**Files Created** (1 service):
- `src/lib/geolocation.js` - Core geolocation service (Phase 2)

**No Files Changed**:
- No database schema changes
- No Firestore rules changes  
- No Firebase configuration changes
- No new dependencies (uses browser API)

---

## Task Metrics

**Total Tasks**: 48
- **Phase 2 (Foundational)**: 7 tasks (~30 min)
- **Phase 3 (US1)**: 8 tasks (~45 min)
- **Phase 4 (US2)**: 12 tasks (~60 min)
- **Phase 5 (US3)**: 9 tasks (~30 min)
- **Phase 6 (Polish)**: 12 tasks (~30 min)

**Parallel Tasks**: 15 marked [P] (31% parallelizable)

**Story Distribution**:
- US1 tasks: 8 (focus on auto-select logic)
- US2 tasks: 12 (most complex - new UI patterns)
- US3 tasks: 9 (similar to US2, copy patterns)

---

## Success Criteria Validation

Before marking feature complete, verify all success criteria from spec.md:

- [ ] **SC-001**: Create session with auto-selected circuit in <30 seconds ✓
- [ ] **SC-002**: 80%+ of sessions use auto-selected circuit (monitor after deploy)
- [ ] **SC-003**: Add circuit using location in <2 minutes ✓
- [ ] **SC-004**: 100% of operations work when location denied ✓
- [ ] **SC-005**: Feedback within 2 seconds of "Use My Location" ✓
- [ ] **SC-006**: 95%+ accuracy in nearest circuit selection ✓

---

## Notes

- All [P] tasks can run in parallel (different files or independent functions)
- [US1], [US2], [US3] labels map tasks to user stories for traceability
- Each user story is independently completable and testable
- Manual testing is per constitution (no automated test tasks)
- Stop at any checkpoint to validate story independently before proceeding
- Commit after completing each user story phase for clean rollback points
