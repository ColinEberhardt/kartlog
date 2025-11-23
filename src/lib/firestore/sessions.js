// @ts-nocheck
import { db, auth, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy } from '../firebase.js';
import { getUserTyres } from './tyres.js';
import { getUserEngines } from './engines.js';
import { getUserChassis } from './chassis.js';
import { getUserTracks } from './tracks.js';

// Add a new session
export const addSession = async (sessionData) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to add sessions');
  }

  try {
    const processedData = {
      userId: auth.currentUser.uid,
      // Session information
      date: new Date(sessionData.date),
      circuitId: sessionData.circuitId,
      temp: parseFloat(sessionData.temp),
      weatherCode: sessionData.weatherCode !== undefined ? parseInt(sessionData.weatherCode) : null,
      session: sessionData.session,
      
      // Equipment setup
      tyreId: sessionData.tyreId,
      engineId: sessionData.engineId,
      chassisId: sessionData.chassisId,
      
      // Kart setup
      rearSprocket: parseInt(sessionData.rearSprocket),
      frontSprocket: parseInt(sessionData.frontSprocket),
      caster: sessionData.caster,
      rideHeight: sessionData.rideHeight,
      jet: parseInt(sessionData.jet),
      rearInner: parseFloat(sessionData.rearInner),
      rearOuter: parseFloat(sessionData.rearOuter),
      frontInner: parseFloat(sessionData.frontInner),
      frontOuter: parseFloat(sessionData.frontOuter),
      
      // Session results
      laps: parseInt(sessionData.laps),
      fastest: sessionData.fastest ? parseFloat(sessionData.fastest) : null,
      
      // Race information (optional)
      isRace: sessionData.isRace || false,
      entries: sessionData.entries ? parseInt(sessionData.entries) : null,
      startPos: sessionData.startPos ? parseInt(sessionData.startPos) : null,
      endPos: sessionData.endPos ? parseInt(sessionData.endPos) : null,
      penalties: sessionData.penalties || null,
      notes: sessionData.notes || null,
      
      createdAt: new Date()
    };

    await addDoc(collection(db, 'sessions'), processedData);
  } catch (error) {
    console.error('Error adding session:', error);
    throw error;
  }
};

// Helper function to perform joins on sessions
async function joinSessionData(sessions) {
  const [tyres, engines, chassis, tracks] = await Promise.all([
    getUserTyres(),
    getUserEngines(),
    getUserChassis(),
    getUserTracks()
  ]);

  // Create lookup maps
  const tyresMap = new Map(tyres.map(t => [t.id, t]));
  const enginesMap = new Map(engines.map(e => [e.id, e]));
  const chassisMap = new Map(chassis.map(c => [c.id, c]));
  const tracksMap = new Map(tracks.map(t => [t.id, t]));

  // Helper to join a single session
  const joinSession = (session) => ({
    ...session,
    tyre: session.tyreId ? tyresMap.get(session.tyreId) : null,
    engine: session.engineId ? enginesMap.get(session.engineId) : null,
    chassis: session.chassisId ? chassisMap.get(session.chassisId) : null,
    circuit: session.circuitId ? tracksMap.get(session.circuitId) : null
  });

  // Handle both single session and array of sessions
  return Array.isArray(sessions) 
    ? sessions.map(joinSession)
    : joinSession(sessions);
}

// Get user's sessions
export const getUserSessions = async (join = false) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to view sessions');
  }

  try {
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // If join is requested, fetch related entities
    return join ? await joinSessionData(sessions) : sessions;
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
};

// Get a single session by ID
export const getSession = async (sessionId, join = false) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to view sessions');
  }

  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }
    
    const sessionData = sessionSnap.data();
    
    // Verify the session belongs to the current user
    if (sessionData.userId !== auth.currentUser.uid) {
      throw new Error('Access denied');
    }
    
    const session = {
      id: sessionSnap.id,
      ...sessionData
    };

    // If join is requested, fetch related entities
    return join ? await joinSessionData(session) : session;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

// Update a session
export const updateSession = async (sessionId, sessionData) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to update sessions');
  }

  try {
    const processedData = {
      // Session information
      date: new Date(sessionData.date),
      circuitId: sessionData.circuitId,
      temp: parseFloat(sessionData.temp),
      weatherCode: sessionData.weatherCode !== undefined ? parseInt(sessionData.weatherCode) : null,
      session: sessionData.session,
      
      // Equipment setup
      tyreId: sessionData.tyreId,
      engineId: sessionData.engineId,
      chassisId: sessionData.chassisId,
      
      // Kart setup
      rearSprocket: parseInt(sessionData.rearSprocket),
      frontSprocket: parseInt(sessionData.frontSprocket),
      caster: sessionData.caster,
      rideHeight: sessionData.rideHeight,
      jet: parseInt(sessionData.jet),
      rearInner: parseFloat(sessionData.rearInner),
      rearOuter: parseFloat(sessionData.rearOuter),
      frontInner: parseFloat(sessionData.frontInner),
      frontOuter: parseFloat(sessionData.frontOuter),
      
      // Session results
      laps: parseInt(sessionData.laps),
      fastest: sessionData.fastest ? parseFloat(sessionData.fastest) : null,
      
      // Race information (optional)
      isRace: sessionData.isRace || false,
      entries: sessionData.entries ? parseInt(sessionData.entries) : null,
      startPos: sessionData.startPos ? parseInt(sessionData.startPos) : null,
      endPos: sessionData.endPos ? parseInt(sessionData.endPos) : null,
      penalties: sessionData.penalties || null,
      notes: sessionData.notes || null,
      
      updatedAt: new Date()
    };

    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, processedData);
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

// Delete a session
export const deleteSession = async (sessionId) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to delete sessions');
  }

  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};
