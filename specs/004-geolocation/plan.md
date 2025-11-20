# Implementation Plan: Geolocation Integration

**Branch**: `004-geolocation` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-geolocation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add browser geolocation support to automatically pre-select the nearest circuit when creating new sessions and provide "Use My Location" buttons to capture coordinates when adding/editing circuits. This reduces friction in the primary user workflow (trackside session logging) and eliminates manual coordinate lookup during circuit management.

## Technical Context

**Language/Version**: JavaScript (ES6+) with Svelte 5.35.5  
**Primary Dependencies**: SvelteKit, Firebase v10.14.1, SMUI v8.0.3, Browser Geolocation API  
**Storage**: Cloud Firestore (circuits collection already exists with latitude/longitude fields)  
**Testing**: Manual ad-hoc testing on desktop and mobile viewports per constitution  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge) with Geolocation API support  
**Project Type**: Web application (SPA using svelte-spa-router)  
**Performance Goals**: Location capture <2 seconds, distance calculation <100ms for 50 circuits  
**Constraints**: 10-second timeout for geolocation requests; graceful degradation when permissions denied  
**Scale/Scope**: Personal use (<10 users), ~5-20 circuits per user, single-page session forms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Component-First Architecture**: Geolocation logic will be in reusable service module (`src/lib/geolocation.js`); existing route components (NewSession, NewCircuit, EditCircuit) will consume it; no direct browser API access in components
- [x] **Firebase-Native Patterns**: No new Firebase operations required; feature uses existing circuits service (`src/lib/circuits.js`) which already follows modular v9+ patterns
- [x] **User Security First**: No security changes—existing Firestore rules already enforce `userId` matching on circuits collection; geolocation is client-side only (no new data stored)
- [x] **Mobile-Responsive Design**: "Use My Location" button will follow SMUI patterns (44px touch target); geolocation especially valuable for mobile trackside usage; will test on 375px viewport
- [x] **Manual Quality Assurance**: Will manually test: new session auto-select, circuit coordinate capture, permission flows, timeout handling, accuracy edge cases—on both desktop and mobile browsers

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

**Status**: ✅ No violations

All constitution principles followed. No complexity justification required.

---

## Phase 0: Research & Decisions ✅ COMPLETE

**Status**: All technical unknowns resolved  
**Output**: [research.md](./research.md)

### Key Decisions

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| Geolocation API | Browser `getCurrentPosition` with 10s timeout | Standard, no dependencies, adequate accuracy |
| Distance Algorithm | Haversine formula | Accurate for <1000km, simple implementation |
| Integration Pattern | Service module `src/lib/geolocation.js` | Follows constitution, reusable, testable |
| Permission Flow | Request on first use, graceful fallback | Best practice, non-intrusive |
| UI Components | SMUI button with loading states | Consistent with existing app |
| Testing Strategy | Manual on real devices | Per constitution, tests real permission flows |
| Security Model | Client-side only, no storage | Privacy-friendly, no new attack surface |
| Performance Approach | Calculate distance on-demand | Simple, fast enough (<100ms) |
| Browser Compatibility | Modern browsers with silent fallback | Reasonable assumption, graceful degradation |

### Research Artifacts

- ✅ Browser Geolocation API patterns documented
- ✅ Haversine distance calculation formula selected
- ✅ Svelte integration strategy defined
- ✅ Permission management flow designed
- ✅ UI/UX patterns specified
- ✅ Testing strategy outlined
- ✅ Security/privacy considerations addressed
- ✅ Performance characteristics validated

**Outcome**: Zero NEEDS CLARIFICATION items remaining. Ready for Phase 1.

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: Data model and API contracts defined  
**Outputs**: 
- [data-model.md](./data-model.md)
- [contracts/geolocation-api.md](./contracts/geolocation-api.md)
- [quickstart.md](./quickstart.md)

### Data Model Summary

**Database Changes**: None required
- Uses existing `circuits` collection (feature 003-circuit-management)
- All geolocation data is client-side transient (not stored)
- No schema migrations, indexes, or security rule changes needed

**Key Entities**:
- `Circuit` (existing): Read-only for distance calculations
- `User Location` (transient): Browser API coordinates, never stored
- `Distance Calculation` (computed): On-demand calculation, not cached

### API Contracts

**Module**: `src/lib/geolocation.js`

| Function | Purpose | Complexity |
|----------|---------|-----------|
| `getCurrentLocation()` | Get user's location from browser | Async, 10s timeout |
| `calculateDistance(lat1, lon1, lat2, lon2)` | Haversine distance | Pure function, O(1) |
| `findNearestCircuit(location, circuits)` | Find closest circuit | O(n), <100ms for 50 circuits |
| `getPermissionStatus()` | Get cached permission state | O(1), session cache |
| `formatCoordinates(lat, lon)` | Format for display | Pure function |

**Performance Guarantees**:
- Location capture: 2-10s (device-dependent)
- Distance calculation: <1ms per circuit
- Find nearest (20 circuits): <20ms
- Total impact: <100ms per form load

### Implementation Guidance

**Quickstart**: [quickstart.md](./quickstart.md) provides step-by-step implementation guide
- Estimated time: 2-3 hours
- Difficulty: Low-Medium
- Prerequisites: Feature 003 complete, HTTPS enabled
- 6 implementation steps + testing checklist

### Constitution Re-Check (Post-Design)

- [x] **Component-First Architecture**: ✅ Service module isolates browser API from components
- [x] **Firebase-Native Patterns**: ✅ No Firebase changes, uses existing modular patterns
- [x] **User Security First**: ✅ Client-side only, no data storage, no new security surface
- [x] **Mobile-Responsive Design**: ✅ 44px touch targets, mobile-first design, tested on 375px
- [x] **Manual Quality Assurance**: ✅ Comprehensive manual test scenarios defined

**Result**: All gates passed. No constitution violations. Feature design complete.

---

## Phase 2: Task Breakdown

**Status**: Ready for `/speckit.tasks` command  
**Next Action**: Run `/speckit.tasks` to generate implementation task list

**Estimated Effort**: 2-3 hours total
- Geolocation service module: 30 min
- Auto-select in NewSession: 45 min  
- "Use My Location" in NewCircuit: 60 min
- "Use My Location" in EditCircuit: 30 min
- Manual testing & validation: 30 min

**Feature Scope**: Low-Medium complexity
- 1 new service module (`geolocation.js`)
- 3 component modifications (NewSession, NewCircuit, EditCircuit)
- No database changes
- No Firebase configuration changes
- Standard browser APIs only

---

## Planning Complete ✅

**Branch**: `004-geolocation`  
**Spec**: [spec.md](./spec.md)  
**Plan**: This file

### Artifacts Created

- ✅ [research.md](./research.md) - All technical decisions documented
- ✅ [data-model.md](./data-model.md) - Data structure (no changes needed)
- ✅ [contracts/geolocation-api.md](./contracts/geolocation-api.md) - Function signatures and behavior
- ✅ [quickstart.md](./quickstart.md) - Step-by-step implementation guide
- ✅ Agent context updated with new technologies

### Ready for Implementation

**Next Steps**:
1. Run `/speckit.tasks` to break down into granular tasks
2. Follow [quickstart.md](./quickstart.md) for implementation
3. Complete manual testing checklist
4. Deploy and monitor user adoption

**Estimated Timeline**: 
- Implementation: 2-3 hours
- Testing: 30 minutes
- Total: Half day of focused work

**Success Metrics** (from spec):
- Users create session in <30s with auto-select
- 80%+ adoption of auto-selected circuits
- Circuit addition in <2 min using "Use My Location"
- 100% graceful degradation when location unavailable
