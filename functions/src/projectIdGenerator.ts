import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const generateUniqueProjectId = functions.https.onCall(async (data, context) => {
  // Ensure caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const counterRef = admin.firestore().doc('project_ids/counter');
  const projectRef = admin.firestore().collection('projects_master');

  const result = await admin.firestore().runTransaction(async transaction => {
    const counterSnap = await transaction.get(counterRef);
    let next = 1;
    if (counterSnap.exists) {
      const data = counterSnap.data();
      next = (data?.next || 0) + 1;
    }
    // Update counter
    transaction.set(counterRef, { next }, { merge: true });
    const year = new Date().getFullYear();
    const id = `ENGLABS-${year}-${String(next).padStart(4, '0')}`;
    // Ensure uniqueness (rare race condition handled by transaction)
    const docSnap = await transaction.get(projectRef.doc(id));
    if (docSnap.exists) {
      throw new functions.https.HttpsError('already-exists', 'Generated Project ID already exists');
    }
    return { id };
  });

  return result;
});
