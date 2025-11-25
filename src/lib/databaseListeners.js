// @ts-nocheck
/**
 * Firestore listeners for automatically refreshing the chat database
 * Sets up real-time listeners on all user collections to keep the chat database in sync
 */

import { collection, query, where, onSnapshot, auth, db } from './firebase.js';
import { refreshDatabase, isDatabaseInitialized } from './query.js';

// Store unsubscribe functions for cleanup
let unsubscribeFunctions = [];
let isListening = false;

/**
 * Set up real-time listeners for all user collections
 * This will automatically refresh the chat database when any data changes
 */
export function startDatabaseListeners() {
  if (isListening) {
    console.log('Database listeners already running');
    return;
  }

  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn('Cannot start database listeners: no user logged in');
    return;
  }

  console.log('Starting Firestore listeners for chat database auto-refresh...');

  // Debounce refresh to avoid excessive updates
  let refreshTimeout = null;
  const debouncedRefresh = () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(async () => {
      if (isDatabaseInitialized()) {
        try {
          await refreshDatabase();
          console.log('Chat database refreshed due to Firestore changes');
        } catch (error) {
          console.error('Error refreshing chat database:', error);
        }
      }
    }, 500); // Wait 500ms after last change
  };

  // Listen to tyres collection
  const tyresQuery = query(collection(db, 'tyres'), where('userId', '==', userId));
  unsubscribeFunctions.push(
    onSnapshot(tyresQuery, () => {
      console.log('Tyres collection changed');
      debouncedRefresh();
    }, (error) => {
      console.error('Tyres listener error:', error);
    })
  );

  // Listen to engines collection
  const enginesQuery = query(collection(db, 'engines'), where('userId', '==', userId));
  unsubscribeFunctions.push(
    onSnapshot(enginesQuery, () => {
      console.log('Engines collection changed');
      debouncedRefresh();
    }, (error) => {
      console.error('Engines listener error:', error);
    })
  );

  // Listen to chassis collection
  const chassisQuery = query(collection(db, 'chassis'), where('userId', '==', userId));
  unsubscribeFunctions.push(
    onSnapshot(chassisQuery, () => {
      console.log('Chassis collection changed');
      debouncedRefresh();
    }, (error) => {
      console.error('Chassis listener error:', error);
    })
  );

  // Listen to tracks collection
  const tracksQuery = query(collection(db, 'tracks'), where('userId', '==', userId));
  unsubscribeFunctions.push(
    onSnapshot(tracksQuery, () => {
      console.log('Tracks collection changed');
      debouncedRefresh();
    }, (error) => {
      console.error('Tracks listener error:', error);
    })
  );

  // Listen to sessions collection
  const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', userId));
  unsubscribeFunctions.push(
    onSnapshot(sessionsQuery, () => {
      console.log('Sessions collection changed');
      debouncedRefresh();
    }, (error) => {
      console.error('Sessions listener error:', error);
    })
  );

  isListening = true;
  console.log('Firestore listeners active for 5 collections');
}

/**
 * Stop all database listeners and clean up
 */
export function stopDatabaseListeners() {
  if (!isListening) {
    return;
  }

  console.log('Stopping Firestore listeners...');
  unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  unsubscribeFunctions = [];
  isListening = false;
}

/**
 * Check if listeners are currently active
 */
export function areListenersActive() {
  return isListening;
}
