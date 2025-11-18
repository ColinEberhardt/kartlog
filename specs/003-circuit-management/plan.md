# Implementation Plan: Circuit Management

**Branch**: `003-circuit-management` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-circuit-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds circuit management functionality to the KartLog application, allowing users to create, view, update, and delete racing circuit entities with geographic coordinates and notes. Circuits are integrated into session tracking by replacing the freeform circuit text field with a dropdown selection of managed circuit entities. This provides structured circuit data, enables coordinate tracking, and maintains consistency across sessions.

**Technical Approach**: Follow established CRUD patterns from engines/chassis features. Implement `src/lib/circuits.js` service module with Firebase Firestore operations. Create three route components (`Circuits.svelte`, `NewCircuit.svelte`, `EditCircuit.svelte`) using SMUI components. Modify session forms to use circuit dropdown selection. Add Firestore security rules and indexes for circuits collection.

## Technical Context

**Language/Version**: JavaScript (Node.js 20.19+ or 22.12+ or 24+)  
**Primary Dependencies**: SvelteKit, Firebase SDK v9+ (Firestore, Auth), SMUI (Svelte Material UI), svelte-spa-router  
**Storage**: Cloud Firestore (NoSQL document database)  
**Testing**: Manual QA with comprehensive test scenarios (automated tests optional per Constitution v1.1.0)  
**Target Platform**: Web (desktop and mobile browsers), optimized for mobile trackside usage  
**Project Type**: Web application with mobile-responsive design  
**Performance Goals**: < 2s page load time; real-time data sync with Firestore; support 5-50 circuits per user  
**Constraints**: Mobile-optimized (375px minimum width); offline-capable future enhancement; ~10KB data load for circuit list  
**Scale/Scope**: Small-scale personal project; single-tenant per user; ~5-50 circuits per user; 100+ sessions per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Component-First Architecture**: Feature uses Svelte components with clear responsibilities; Firebase access delegated to `src/lib/` services
- [x] **Firebase-Native Patterns**: Uses Firebase SDK v9+ modular imports; all database operations wrapped in service modules
- [x] **User Security First**: All database operations enforce user data isolation; Firestore rules verify `userId` matching
- [x] **Mobile-Responsive Design**: UI tested on mobile viewport (375px min); touch targets ≥44px; appropriate input types used
- [x] **Manual Quality Assurance**: Manual testing plan covers complete user flows on desktop and mobile; edge cases identified

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── routes/              # SvelteKit routes (route-specific components)
│   ├── [feature]/       # Feature-specific routes
│   └── ...
├── components/          # Reusable Svelte components
│   └── ...
├── lib/                 # Service modules (Firebase abstractions)
│   ├── firebase.js      # Firebase initialization
│   ├── stores.js        # Svelte stores for shared state
│   ├── [entity].js      # Entity-specific service (e.g., tyres.js, sessions.js)
│   └── ...
├── theme/               # Theme/styling assets
└── assets/              # Static assets

tests/                   # Test files (if tests requested)
├── integration/         # User journey tests with Firebase emulators
└── unit/                # Service module unit tests

Firebase configuration:
├── firestore.rules      # Firestore security rules
├── firestore.indexes.json
├── firebase.json        # Firebase project config
└── .firebaserc          # Firebase project aliases
```

**Structure Decision**: SvelteKit frontend with Firebase backend services. No separate backend directory—Firebase provides backend via SDK. Service modules in `src/lib/` abstract Firebase operations from components.

## Complexity Tracking

**No violations**: All Constitution principles satisfied. No complexity justification required.

This feature follows established patterns from engines/chassis entities. Circuit management is a straightforward application of existing CRUD patterns to a new entity type with geographic coordinate fields.

---

## Phase 0: Research & Planning ✅

**Status**: Complete  
**Output**: [research.md](./research.md)

### Key Decisions Made

1. **Technology Stack Confirmed**:
   - SvelteKit with Svelte components
   - Firebase SDK v9+ with Cloud Firestore
   - SMUI component library
   - svelte-spa-router for navigation

2. **Patterns Established**:
   - Mirror `src/lib/engines.js` pattern for `circuits.js` service module
   - Follow `Engines.svelte`, `NewEngine.svelte`, `EditEngine.svelte` component patterns
   - Use SMUI Textfield (type="number") for coordinate input
   - Use SMUI Select for circuit dropdown in session forms

3. **Validation Strategy**:
   - Client-side coordinate range validation (-90 to +90 for latitude, -180 to +180 for longitude)
   - Required field checks in form submit handlers
   - Referential integrity enforced in `deleteCircuit()` function

4. **Data Migration Approach**:
   - Add `circuitId` field to sessions (optional during transition)
   - Keep legacy `circuit` string field temporarily
   - Display logic checks `circuitId` first, falls back to `circuit` string
   - Separate migration script out of scope for this feature

---

## Phase 1: Design & Contracts ✅

**Status**: Complete  
**Outputs**: 
- [data-model.md](./data-model.md) - Entity schemas and relationships
- [contracts/circuits-api.md](./contracts/circuits-api.md) - Service module API specification
- [quickstart.md](./quickstart.md) - Developer guide and testing checklist

### Data Model Summary

**Circuit Entity**:
- `name` (string, required): Circuit name
- `latitude` (number, required): -90 to +90 decimal degrees
- `longitude` (number, required): -180 to +180 decimal degrees
- `notes` (string, optional): User's personal observations
- `userId` (string, required): Owner reference for data isolation
- `createdAt` (Timestamp, required): Creation timestamp
- `updatedAt` (Timestamp, optional): Last modification timestamp

**Session Entity Changes**:
- Add `circuitId` (string, foreign key): References circuit document ID
- Deprecate `circuit` (string): Legacy field maintained for backward compatibility
- Display logic resolves `circuitId` to circuit name

### API Contract Summary

**Service Module**: `src/lib/circuits.js`

Functions exported:
- `addCircuit(circuitData)`: Creates circuit document, returns document ID
- `getUserCircuits()`: Retrieves all user's circuits, ordered by createdAt desc
- `updateCircuit(circuitId, updates)`: Updates circuit fields, adds updatedAt
- `deleteCircuit(circuitId)`: Deletes circuit after checking for session references

All functions enforce authentication via `get(user)` check.

### Firestore Configuration

**Security Rules** (add to `firestore.rules`):
```javascript
match /circuits/{circuitId} {
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.userId;
}
```

**Indexes** (add to `firestore.indexes.json`):
```json
{
  "collectionGroup": "circuits",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "userId", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

### Implementation Files Required

**New Files**:
- `src/lib/circuits.js` - Circuit service module
- `src/routes/Circuits.svelte` - Circuit list view
- `src/routes/NewCircuit.svelte` - Add circuit form
- `src/routes/EditCircuit.svelte` - Edit circuit form

**Modified Files**:
- `src/lib/sessions.js` - Add circuitId support
- `src/routes/NewSession.svelte` - Replace circuit text with dropdown
- `src/routes/EditSession.svelte` - Replace circuit text with dropdown
- `src/routes/Sessions.svelte` - Display circuit names from circuitId
- `src/routes/ViewSession.svelte` - Display circuit details
- `src/lib/Navigation.svelte` - Add "Circuits" navigation link
- `src/App.svelte` - Add circuit routes
- `firestore.rules` - Add circuits collection rules
- `firestore.indexes.json` - Add circuits indexes

### Testing Strategy

**Manual Testing Checklist** (see [quickstart.md](./quickstart.md) for full details):
- Circuit CRUD operations (20 test scenarios)
- Session integration (circuit selection, display)
- Mobile responsiveness (375px viewport)
- Security & data isolation (multi-user testing)
- Edge cases (long text, negative coordinates, duplicates)

---

## Phase 2: Task Breakdown

**Status**: Not started (out of scope for `/speckit.plan` command)  
**Output**: `tasks.md` (created by `/speckit.tasks` command)

Task breakdown will be generated separately using the `/speckit.tasks` command. Tasks will cover:
1. Service module implementation
2. Component development (3 route components)
3. Session integration updates
4. Firestore configuration deployment
5. Manual testing execution

---

## Implementation Checklist

### Prerequisites
- [x] Research completed and patterns identified
- [x] Data model defined with complete schemas
- [x] API contracts documented
- [x] Testing strategy established
- [x] Constitution compliance verified

### Phase 0 Deliverables ✅
- [x] research.md created with technology decisions
- [x] Patterns extracted from existing codebase
- [x] Validation strategies defined
- [x] All NEEDS CLARIFICATION items resolved

### Phase 1 Deliverables ✅
- [x] data-model.md created with entity schemas
- [x] contracts/circuits-api.md created with API specification
- [x] quickstart.md created with implementation guide
- [x] Firestore rules defined for circuits collection
- [x] Firestore indexes specified
- [x] Constitution Check re-evaluated (all principles satisfied)

### Phase 2 Next Steps (Not Included in `/speckit.plan`)
- [ ] Generate tasks.md using `/speckit.tasks` command
- [ ] Implement circuit service module
- [ ] Create circuit route components
- [ ] Integrate circuits into session forms
- [ ] Deploy Firestore configuration
- [ ] Execute manual testing checklist
- [ ] Create pull request for review

---

## Related Documents

- **Feature Specification**: [spec.md](./spec.md) - User stories and requirements
- **Research**: [research.md](./research.md) - Technology decisions and patterns
- **Data Model**: [data-model.md](./data-model.md) - Entity schemas and relationships
- **API Contract**: [contracts/circuits-api.md](./contracts/circuits-api.md) - Service module specification
- **Developer Guide**: [quickstart.md](./quickstart.md) - Implementation and testing instructions
- **Constitution**: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Project principles

---

## Summary

**Planning Complete**: All Phase 0 and Phase 1 deliverables created successfully.

**Branch**: `003-circuit-management`  
**Key Files**:
- Plan: `/specs/003-circuit-management/plan.md` (this file)
- Research: `/specs/003-circuit-management/research.md`
- Data Model: `/specs/003-circuit-management/data-model.md`
- API Contract: `/specs/003-circuit-management/contracts/circuits-api.md`
- Quickstart: `/specs/003-circuit-management/quickstart.md`

**Next Command**: Run `/speckit.tasks` to generate task breakdown for implementation.

**Constitution Compliance**: ✅ All principles satisfied. No violations or complexity debt.

**Ready for Implementation**: Yes. All unknowns resolved, patterns established, and design documented.
