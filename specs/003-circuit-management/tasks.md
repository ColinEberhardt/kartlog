# Tasks: Circuit Management

**Feature**: Circuit Management  
**Branch**: `003-circuit-management`  
**Date**: 2025-11-18

**Input**: Design documents from `/specs/003-circuit-management/`
- plan.md (tech stack, structure, patterns)
- spec.md (user stories with priorities)
- data-model.md (Circuit entity, Session modifications)
- contracts/circuits-api.md (Service module API specification)
- research.md (implementation decisions)
- quickstart.md (test scenarios)

**Tests**: Not explicitly requested in specification - manual QA approach per Constitution. Test tasks omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (e.g., US1, US2, US3) - only for story-specific tasks
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Basic project structure and configuration

- [X] T001 Verify development environment (Node.js 20.19+/22.12+/24+, Firebase CLI installed)
- [X] T002 Ensure Firebase project configured per FIREBASE_SETUP.md
- [X] T003 Create feature branch `003-circuit-management` from main

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add Firestore security rules for circuits collection in firestore.rules
- [X] T005 [P] Add composite index for circuits query in firestore.indexes.json
- [X] T006 [P] Create circuits service module skeleton in src/lib/circuits.js (imports, exports structure)
- [X] T007 Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [X] T008 Deploy Firestore indexes: `firebase deploy --only firestore:indexes`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View All Circuits (Priority: P1) 🎯 MVP

**Goal**: Users can see all their racing circuits with name, coordinates, and notes in a centralized list

**Independent Test**: Log in, navigate to circuits page, verify all circuits display with complete information (name, latitude, longitude, notes). Works as standalone circuit directory.

### Implementation for User Story 1

- [X] T009 [P] [US1] Implement `getUserCircuits()` function in src/lib/circuits.js
- [X] T010 [P] [US1] Create Circuits.svelte route component in src/routes/Circuits.svelte
- [X] T011 [US1] Add circuits route mapping in src/App.svelte (`/circuits` → Circuits.svelte)
- [X] T012 [US1] Implement circuit list layout with LayoutGrid and Card components in src/routes/Circuits.svelte
- [X] T013 [US1] Add coordinate formatting helper (4 decimal places with degree symbol) in src/routes/Circuits.svelte
- [X] T014 [US1] Implement empty state display (no circuits message) in src/routes/Circuits.svelte
- [X] T015 [US1] Add "Circuits" navigation link in src/lib/Navigation.svelte
- [ ] T016 [US1] Test mobile responsiveness at 375px viewport width

**Checkpoint**: User Story 1 complete - users can view circuit library

---

## Phase 4: User Story 2 - Add New Circuit (Priority: P1) 🎯 MVP

**Goal**: Users can add new circuits with name, coordinates, and notes to build their circuit database

**Independent Test**: Click "Add Circuit", fill form (name, lat, lng, notes), submit, verify new circuit appears in list. Delivers value by populating circuit data.

### Implementation for User Story 2

- [X] T017 [P] [US2] Implement `addCircuit(circuitData)` function in src/lib/circuits.js
- [X] T018 [P] [US2] Create NewCircuit.svelte route component in src/routes/NewCircuit.svelte
- [X] T019 [US2] Add new circuit route mapping in src/App.svelte (`/circuits/new` → NewCircuit.svelte)
- [X] T020 [US2] Implement coordinate validation helper (latitude -90 to +90, longitude -180 to +180) in src/routes/NewCircuit.svelte
- [X] T021 [US2] Build circuit form with SMUI Textfield components (name, latitude, longitude, notes) in src/routes/NewCircuit.svelte
- [X] T022 [US2] Add required field validation in form submit handler in src/routes/NewCircuit.svelte
- [X] T023 [US2] Implement coordinate range validation in form submit handler in src/routes/NewCircuit.svelte
- [X] T024 [US2] Add "Add New Circuit" button to Circuits.svelte linking to /circuits/new
- [ ] T025 [US2] Test numeric keyboard activation on mobile for lat/lng fields
- [ ] T026 [US2] Verify form error messaging for validation failures

**Checkpoint**: User Stories 1 AND 2 complete - users can view and add circuits

---

## Phase 5: User Story 3 - Edit Existing Circuit (Priority: P2)

**Goal**: Users can update circuit information to maintain data accuracy

**Independent Test**: Click "Edit" on circuit, modify fields (name, coordinates, notes), save, verify changes persist. Enables data refinement.

### Implementation for User Story 3

- [X] T027 [P] [US3] Implement `updateCircuit(circuitId, updates)` function in src/lib/circuits.js
- [X] T028 [P] [US3] Create EditCircuit.svelte route component in src/routes/EditCircuit.svelte
- [X] T029 [US3] Add edit circuit route mapping in src/App.svelte (`/circuits/edit/:id` → EditCircuit.svelte)
- [X] T030 [US3] Implement circuit data loading in onMount using route params in src/routes/EditCircuit.svelte
- [X] T031 [US3] Pre-fill form fields with current circuit data in src/routes/EditCircuit.svelte
- [X] T032 [US3] Add form validation (required fields, coordinate ranges) in src/routes/EditCircuit.svelte
- [X] T033 [US3] Add "Edit" button to each circuit card in src/routes/Circuits.svelte
- [ ] T034 [US3] Test edit flow end-to-end (load, modify, save, verify)

**Checkpoint**: User Stories 1-3 complete - full circuit CRUD except delete

---

## Phase 6: User Story 4 - Delete Circuit (Priority: P2)

**Goal**: Users can remove unused or mistaken circuits to keep list relevant

**Independent Test**: Click "Delete" on circuit, confirm deletion, verify circuit removed from list. Test referential integrity by attempting to delete circuit with sessions.

### Implementation for User Story 4

- [X] T035 [US4] Implement `deleteCircuit(circuitId)` function with session reference check in src/lib/circuits.js
- [X] T036 [US4] Add deletion confirmation dialog to Circuits.svelte
- [X] T037 [US4] Implement `handleDelete()` function with error handling in src/routes/Circuits.svelte
- [X] T038 [US4] Add "Delete" button to each circuit card in src/routes/Circuits.svelte
- [ ] T039 [US4] Test deletion with no session references (success case)
- [ ] T040 [US4] Test deletion with session references (error case with count message)

**Checkpoint**: All circuit CRUD operations complete

---

## Phase 7: User Story 5 - Link Sessions to Circuits (Priority: P1) 🎯 MVP

**Goal**: Sessions reference managed circuits (dropdown selection) instead of freeform text, enabling structured circuit data usage

**Independent Test**: Create/edit session, select circuit from dropdown (populated from circuit library), verify session stores circuitId. Demonstrates value of circuit entities.

### Implementation for User Story 5

- [X] T041 [P] [US5] Update `addSession()` to accept and store circuitId in src/lib/sessions.js
- [X] T042 [P] [US5] Update `updateSession()` to accept and store circuitId in src/lib/sessions.js
- [X] T043 [P] [US5] Modify NewSession.svelte to load circuits via getUserCircuits() in src/routes/NewSession.svelte
- [X] T044 [US5] Replace circuit Textfield with SMUI Select component in src/routes/NewSession.svelte
- [X] T045 [US5] Populate Select dropdown with circuits sorted alphabetically in src/routes/NewSession.svelte
- [X] T046 [US5] Add empty state handling (no circuits message with link to /circuits) in src/routes/NewSession.svelte
- [X] T047 [US5] Update form validation to require circuitId instead of circuit string in src/routes/NewSession.svelte
- [X] T048 [P] [US5] Apply circuit selection changes to EditSession.svelte (mirror NewSession changes) in src/routes/EditSession.svelte
- [X] T049 [P] [US5] Modify Sessions.svelte to load circuits and resolve circuitId to name in src/routes/Sessions.svelte
- [X] T050 [US5] Add backward compatibility (fall back to circuit string if circuitId missing) in src/routes/Sessions.svelte
- [X] T051 [P] [US5] Modify ViewSession.svelte to resolve circuitId and display circuit details in src/routes/ViewSession.svelte
- [X] T052 [US5] Add backward compatibility in ViewSession.svelte (fall back to circuit string) in src/routes/ViewSession.svelte
- [ ] T053 [US5] Test session creation with circuit selection end-to-end
- [ ] T054 [US5] Test session editing with circuit selection
- [ ] T055 [US5] Verify sessions list displays circuit names correctly
- [ ] T056 [US5] Verify session detail view shows circuit information

**Checkpoint**: Circuit management fully integrated with session tracking - MVP COMPLETE

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Refinements affecting multiple user stories

- [ ] T057 [P] Review and optimize SMUI component styling for consistency across circuit pages
- [ ] T058 [P] Verify touch target sizes (≥44px) on all buttons and links
- [ ] T059 Add circuit-specific CSS if needed (or verify existing action-buttons.css, table.css suffice)
- [ ] T060 Test complete user journey: add circuit → create session with circuit → view session
- [ ] T061 Test data isolation (create test accounts, verify users only see own circuits)
- [ ] T062 Verify error handling displays user-friendly messages (not raw Firebase errors)
- [ ] T063 Test edge cases per quickstart.md checklist (long notes, boundary coordinates, duplicate names)
- [ ] T064 [P] Update README.md or documentation with circuit management feature description
- [ ] T065 Run full manual QA checklist from quickstart.md
- [ ] T066 Code review and refactoring (ensure consistency with engines/chassis patterns)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Setup - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Foundational completion
- **Phase 4 (US2)**: Depends on Foundational completion, independent of US1 but logically builds on it
- **Phase 5 (US3)**: Depends on US1 and US2 (needs view and add to make edit useful)
- **Phase 6 (US4)**: Depends on US1 (needs view to delete), independent of US2/US3
- **Phase 7 (US5)**: Depends on US1 and US2 (needs circuit library populated)
- **Phase 8 (Polish)**: Depends on all desired user stories

### User Story Priority Order

**MVP Scope** (Priority P1 - deliver first):
1. User Story 1 (View Circuits) - Foundation for all other stories
2. User Story 2 (Add Circuits) - Enables building circuit library
3. User Story 5 (Session Integration) - Demonstrates value of circuit entities

**Enhancement Scope** (Priority P2 - defer if needed):
4. User Story 3 (Edit Circuits) - Nice to have for data quality
5. User Story 4 (Delete Circuits) - Nice to have for housekeeping

### Parallel Opportunities

**Within Foundational Phase (Phase 2)**:
- T005 (indexes) and T006 (service skeleton) can run parallel with T004 (security rules)
- T007 (deploy rules) and T008 (deploy indexes) must wait for T004 and T005

**Within User Story 1 (Phase 3)**:
- T009 (getUserCircuits function) and T010 (Circuits.svelte component) can run in parallel

**Within User Story 2 (Phase 4)**:
- T017 (addCircuit function) and T018 (NewCircuit.svelte component) can run in parallel

**Within User Story 3 (Phase 5)**:
- T027 (updateCircuit function) and T028 (EditCircuit.svelte component) can run in parallel

**Within User Story 5 (Phase 7)**:
- T041 (addSession) and T042 (updateSession) can run in parallel
- T043-T047 (NewSession changes) and T048 (EditSession changes) can run in parallel
- T049-T050 (Sessions.svelte) and T051-T052 (ViewSession.svelte) can run in parallel

**Within Polish Phase (Phase 8)**:
- T057 (styling), T058 (touch targets), and T064 (docs) can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch US1 implementation tasks together:
Task T009: "Implement getUserCircuits() in src/lib/circuits.js"
Task T010: "Create Circuits.svelte route component"
# Then proceed sequentially through layout, formatting, navigation
```

---

## Implementation Strategy

### Recommended MVP Approach (Fastest Value Delivery)

**Sprint 1**: Foundation + US1 + US2
1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) ← CRITICAL BLOCKING PHASE
3. Complete Phase 3: US1 - View Circuits (T009-T016)
4. Complete Phase 4: US2 - Add Circuits (T017-T026)
5. **CHECKPOINT**: Users can view and add circuits - basic circuit library functional
6. Test independently before proceeding

**Sprint 2**: Session Integration
7. Complete Phase 7: US5 - Link Sessions (T041-T056)
8. **CHECKPOINT**: MVP COMPLETE - circuits integrated with sessions
9. Demo and validate with real users

**Sprint 3** (Optional Enhancements):
10. Complete Phase 5: US3 - Edit Circuits (T027-T034)
11. Complete Phase 6: US4 - Delete Circuits (T035-T040)
12. Complete Phase 8: Polish (T057-T066)

### Incremental Delivery Benefits

- **After Sprint 1**: Circuit library exists, users can build their database
- **After Sprint 2**: Full MVP - sessions use managed circuits (primary value delivered)
- **Sprint 3**: Quality-of-life improvements (edit/delete) added incrementally

### Parallel Team Strategy

With 2-3 developers after Foundational phase:
- **Developer A**: US1 (View) + US2 (Add) - Core circuit CRUD
- **Developer B**: US5 (Session Integration) - starts after US1/US2 tasks T009, T017 complete
- **Developer C**: US3 (Edit) + US4 (Delete) - Enhancement features

---

## Summary

**Total Tasks**: 66 tasks across 8 phases

**Task Count by User Story**:
- Setup: 3 tasks
- Foundational: 5 tasks (BLOCKS all stories)
- User Story 1 (View): 8 tasks
- User Story 2 (Add): 10 tasks
- User Story 3 (Edit): 8 tasks
- User Story 4 (Delete): 6 tasks
- User Story 5 (Session Integration): 16 tasks
- Polish: 10 tasks

**Parallel Opportunities**: 18 tasks marked [P] can run in parallel within their phase

**MVP Scope** (Priority P1): US1 + US2 + US5 = 34 tasks (T009-T026, T041-T056)

**Independent Test Criteria**:
- US1: Navigate to /circuits, see all circuits with complete information
- US2: Add circuit via form, verify appears in list
- US3: Edit circuit, verify changes persist
- US4: Delete circuit, verify removed (and blocked if sessions reference it)
- US5: Create session with circuit dropdown, verify circuitId stored and name displays

**Format Validation**: ✅ All tasks follow strict checklist format:
- Checkbox: `- [ ]`
- Task ID: T001-T066 sequential
- [P] marker: 18 parallelizable tasks identified
- [Story] label: US1-US5 labels applied to all story-specific tasks
- File paths: Included in every task description

**Next Steps**: Execute tasks in phase order, validate checkpoints, deliver MVP incrementally.
