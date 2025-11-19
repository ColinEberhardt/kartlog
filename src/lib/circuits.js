import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';
import { user } from './stores.js';
import { get } from 'svelte/store';

export const addCircuit = async (circuitData) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to add circuits');
  }

  // Process notes: convert empty string to null
  const processedNotes = circuitData.notes?.trim() ? circuitData.notes.trim() : null;

  const docRef = await addDoc(collection(db, 'circuits'), {
    name: circuitData.name.trim(),
    latitude: circuitData.latitude,
    longitude: circuitData.longitude,
    notes: processedNotes,
    userId: currentUser.uid,
    createdAt: Timestamp.now()
  });

  return docRef.id;
};

export const getUserCircuits = async () => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to view circuits');
  }

  const q = query(
    collection(db, 'circuits'),
    where('userId', '==', currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateCircuit = async (circuitId, updates) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to update circuits');
  }

  // Process notes: convert empty string to null
  const processedUpdates = { ...updates };
  if ('notes' in processedUpdates) {
    processedUpdates.notes = processedUpdates.notes?.trim() ? processedUpdates.notes.trim() : null;
  }
  if ('name' in processedUpdates) {
    processedUpdates.name = processedUpdates.name.trim();
  }

  const circuitRef = doc(db, 'circuits', circuitId);
  await updateDoc(circuitRef, {
    ...processedUpdates,
    updatedAt: Timestamp.now()
  });
};

export const deleteCircuit = async (circuitId) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to delete circuits');
  }

  // Check for sessions referencing this circuit
  const sessionsQuery = query(
    collection(db, 'sessions'),
    where('userId', '==', currentUser.uid),
    where('circuitId', '==', circuitId)
  );

  const sessionsSnapshot = await getDocs(sessionsQuery);
  
  if (!sessionsSnapshot.empty) {
    const sessionCount = sessionsSnapshot.size;
    throw new Error(`Cannot delete circuit: ${sessionCount} session${sessionCount > 1 ? 's' : ''} reference${sessionCount === 1 ? 's' : ''} this circuit`);
  }

  const circuitRef = doc(db, 'circuits', circuitId);
  await deleteDoc(circuitRef);
};
