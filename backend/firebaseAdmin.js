// Firebase Admin SDK initialization (optional)
// Only initializes if GOOGLE_APPLICATION_CREDENTIALS or firebase-admin service account is present
let admin = null;

try {
  const firebaseAdmin = require('firebase-admin');
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (projectId && !projectId.includes('PASTE')) {
    // Try to initialize with Application Default Credentials
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.applicationDefault(),
      projectId,
    });
    admin = firebaseAdmin;
    console.log('[Firebase Admin] Initialized with Application Default Credentials');
  }
} catch (e) {
  console.warn('[Firebase Admin] Not initialized — token verification disabled. Using demo auth only.');
  console.warn('[Firebase Admin] To enable: set FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS');
}

module.exports = admin;
