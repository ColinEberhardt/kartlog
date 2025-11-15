import { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from '../firebase.js';

export const addChassis = async (chassisData) => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to add chassis');
  }

  const docRef = await addDoc(collection(db, 'chassis'), {
    ...chassisData,
    userId: auth.currentUser.uid,
    createdAt: Timestamp.now(),
    retired: false
  });

  return docRef.id;
};

export const getUserChassis = async () => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to view chassis');
  }

  const q = query(
    collection(db, 'chassis'),
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateChassis = async (chassisId, updates) => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to update chassis');
  }

  const chassisRef = doc(db, 'chassis', chassisId);
  await updateDoc(chassisRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteChassis = async (chassisId) => {
  if (!auth.currentUser) {
    throw new Error('Must be logged in to delete chassis');
  }

  const chassisRef = doc(db, 'chassis', chassisId);
  await deleteDoc(chassisRef);
};

export const retireChassis = async (chassisId) => {
  await updateChassis(chassisId, { retired: true });
};
