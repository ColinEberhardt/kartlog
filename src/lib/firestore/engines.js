import { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from '../firebase.js';

export const addEngine = async (engineData) => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to add engines');
  }

  const docRef = await addDoc(collection(db, 'engines'), {
    ...engineData,
    userId: auth.currentUser.uid,
    createdAt: Timestamp.now(),
    retired: false
  });

  return docRef.id;
};

export const getUserEngines = async () => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to view engines');
  }

  const q = query(
    collection(db, 'engines'),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateEngine = async (engineId, updates) => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to update engines');
  }

  const engineRef = doc(db, 'engines', engineId);
  await updateDoc(engineRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteEngine = async (engineId) => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to delete engines');
  }

  const engineRef = doc(db, 'engines', engineId);
  await deleteDoc(engineRef);
};

export const retireEngine = async (engineId) => {
  await updateEngine(engineId, { retired: true });
};