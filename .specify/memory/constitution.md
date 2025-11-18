<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0
Constitution Type: MINOR (principle modification - testing approach changed)

Modified Principles:
  - Principle V: "Test User Journeys, Not Implementation" → "Manual Quality Assurance"
    * Changed from automated testing requirement to manual/ad-hoc approach
    * Removed TDD and automated test requirements
    * Made automated tests optional rather than mandatory
    * Retained focus on user journey validation

Added Sections: None

Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check gate updated (removed test automation requirement)
  ✅ spec-template.md - no changes needed
  ✅ tasks-template.md - test task examples marked as optional

Follow-up TODOs:
  - Update plan-template.md Constitution Check to reflect manual testing approach
  - Update tasks-template.md to clarify automated tests are optional

Rationale for Version 1.1.0:
  - MINOR bump: principle guidance expanded to clarify testing approach
  - Manual testing is appropriate for small-scale personal projects
  - Automated tests remain available as future enhancement
  - Does not break existing principles, only clarifies implementation expectations
-->

# KartLog Constitution

## Core Principles

### I. Component-First Architecture

Every UI feature MUST be built as a Svelte component following these rules:
- Components MUST be self-contained with clear, single responsibilities
- Component state MUST be managed via Svelte stores for shared data
- Components MUST NOT directly access Firebase—delegate to service modules in `src/lib/`
- Reusable components MUST be placed in `src/components/`, route-specific components in `src/routes/`

**Rationale**: Svelte's reactive model requires disciplined component boundaries to prevent prop drilling, ensure testability, and maintain clear data flow. Direct Firebase access in components creates tight coupling and hinders testing.

### II. Firebase-Native Patterns (NON-NEGOTIABLE)

All Firebase integrations MUST follow Firebase SDK v9+ modular syntax:
- Use modular imports: `import { collection, addDoc } from 'firebase/firestore'`
- NEVER use compatibility mode or compat packages
- All database operations MUST be wrapped in service modules (`src/lib/*.js`)
- Service modules MUST export pure functions that take Firebase instances as parameters
- Real-time listeners MUST be properly unsubscribed in `onDestroy` lifecycle hooks
- Error handling MUST catch Firebase-specific error codes and provide user-friendly messages

**Rationale**: Firebase v9+ modular syntax enables tree-shaking and reduces bundle size. Service abstraction allows mocking for tests and centralizes Firebase logic, preventing scattered database calls across components.

### III. User Security First (NON-NEGOTIABLE)

Every database operation MUST enforce user data isolation:
- Firestore security rules MUST verify `request.auth.uid == resource.data.userId`
- All queries MUST filter by `userId` matching the authenticated user
- New documents MUST include `userId` field set to `auth.currentUser.uid`
- Authentication state MUST be checked before rendering protected routes
- NEVER expose Firebase config secrets or service account keys in client code or repository
- User authentication MUST be verified server-side via Firestore security rules—client checks are defense-in-depth only

**Rationale**: Multi-tenant applications require defense-in-depth security. Client-side checks can be bypassed; Firestore rules provide the authoritative security boundary. Data breaches in karting data could expose competitive advantages or personal information.

### IV. Mobile-Responsive Design

UI MUST be optimized for trackside mobile usage:
- All layouts MUST be responsive and tested on mobile viewport (375px minimum width)
- Forms MUST use appropriate input types (`type="number"`, `type="date"`, etc.) for mobile keyboards
- Touch targets MUST be minimum 44×44px per accessibility guidelines
- Critical actions (start session, save data) MUST be accessible within one thumb swipe on mobile
- Offline capability is RECOMMENDED but not required for MVP—progressive enhancement strategy

**Rationale**: Karting users need to log data trackside on mobile devices, often with gloves or in suboptimal lighting. Poor mobile UX renders the app unusable in its primary context of use.

### V. Manual Quality Assurance

Testing strategy focuses on manual verification of user journeys:
- Quality assurance is performed through manual ad-hoc testing
- Testing MUST verify complete user flows (login → add tyre → view list → edit → delete)
- Testing MUST be performed on both desktop and mobile viewports
- Testing SHOULD include edge cases (empty states, error conditions, invalid inputs)
- Automated tests are NOT required but MAY be added for critical flows if desired
- Firebase emulators MAY be used for local testing to avoid affecting production data

**Rationale**: For small-scale personal projects, manual testing provides faster iteration than maintaining automated test suites. User journeys are straightforward and can be verified quickly through hands-on testing. As the project scales, automated tests can be introduced for regression protection.

## Technology Stack

**Frontend Framework**: SvelteKit
- Svelte component syntax with reactive declarations
- SvelteKit routing via `src/routes/` directory structure
- Vite for build and dev server

**Backend Services**: Firebase
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Database**: Cloud Firestore (NoSQL document store)
- **Hosting**: Firebase Hosting (optional for deployment)

**Language**: JavaScript (TypeScript optional but RECOMMENDED for type safety)

**Package Manager**: npm

**Node.js Version**: 20.19+ or 22.12+ or 24+

**Development Tools**:
- Firebase CLI for local emulators and deployment
- Firebase emulators for local dev/test (Firestore + Auth)

## Security Requirements

**Authentication**:
- Firebase Auth MUST be configured with email/password and Google providers minimum
- Password reset and email verification flows MUST be available to users

**Firestore Security Rules**:
- Rules MUST be defined in `firestore.rules` and deployed with application
- Default deny: all collections MUST explicitly allow access
- User data collections MUST enforce `userId` matching authenticated user
- Rules MUST be tested with Firebase emulator suite before production deployment

**Secret Management**:
- Firebase config MAY be committed (public API keys are acceptable per Firebase docs)
- Service account keys MUST NEVER be committed to repository
- Use `.gitignore` to exclude `service-account-key.json` and similar files

**Data Privacy**:
- Users MUST only access their own data—no cross-user visibility
- Admin/multi-user features require explicit role-based access rules if added

## Governance

This constitution supersedes all other development practices and guides all implementation decisions for the KartLog project.

**Compliance Verification**:
- All feature specifications MUST include a Constitution Check section verifying alignment with principles
- All implementation plans MUST document how they satisfy security and architecture principles
- Pull requests SHOULD reference which principles guide design decisions when non-obvious

**Amendment Process**:
- Constitution changes require documented justification for why current principles are insufficient
- MAJOR version increment for removing/redefining core principles (breaks existing guidelines)
- MINOR version increment for adding new principles or expanding guidance
- PATCH version increment for clarifications, wording improvements, or examples

**Complexity Justification**:
- Deviations from principles MUST be documented in implementation plan under "Complexity Tracking"
- Justifications MUST explain why deviation is necessary and what mitigation reduces risk
- Technical debt from deviations MUST be tracked for future resolution

**Runtime Development Guidance**:
- See `.github/copilot-instructions.md` for AI assistant configuration
- See `README.md` for local development setup and Firebase configuration
- See `FIREBASE_SETUP.md` for detailed Firebase service configuration

**Version**: 1.1.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-18
