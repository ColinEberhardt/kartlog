// Mock Firestore Implementation
// This module exports the mock Firebase SDK and test helpers

// Export mock Firebase SDK functions and test helpers
export * from './firebase.js';

// Export test data generators
export * from './testData.js';

// Note: Business logic (tyres, engines, etc.) should be imported from
// ../firestore/ modules. They will automatically use the mock Firebase
// when firebase.js is mocked or aliased.
