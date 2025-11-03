#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Firebase Admin SDK imports
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
console.log('Initializing Firebase Admin...');
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'service-account-key.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Function to find chassis by name
async function findChassisByName(db, chassisName) {
  try {
    const chassisSnapshot = await db.collection('chassis')
      .where('name', '==', chassisName)
      .limit(1)
      .get();

    if (chassisSnapshot.empty) {
      throw new Error(`Chassis "${chassisName}" not found`);
    }

    const chassisDoc = chassisSnapshot.docs[0];
    return { id: chassisDoc.id, ...chassisDoc.data() };
  } catch (error) {
    throw new Error(`Failed to find chassis: ${error.message}`);
  }
}

// Function to update session with chassis ID
async function updateSessionChassis(db, sessionId, chassisId, chassisName) {
  try {
    await db.collection('sessions').doc(sessionId).update({
      chassisId: chassisId,
      updatedAt: new Date()
    });
    console.log(`  ✓ Updated session ${sessionId} with chassis ${chassisName}`);
  } catch (error) {
    console.error(`  ✗ Failed to update session ${sessionId}: ${error.message}`);
  }
}

// Main function
async function updateAllSessions() {
  console.log('\n=== Starting Session Chassis Update ===\n');

  try {
    // Find the two chassis
    console.log('Finding chassis...');
    const chassis1 = await findChassisByName(db, 'CH#01');
    const chassis2 = await findChassisByName(db, 'CH#2');

    console.log(`Found CH#01: ${chassis1.id}`);
    console.log(`Found CH#2: ${chassis2.id}\n`);

    // Get all sessions
    console.log('Fetching all sessions...');
    const sessionsSnapshot = await db.collection('sessions').get();
    console.log(`Found ${sessionsSnapshot.size} sessions\n`);

    let updated2025 = 0;
    let updatedPre2025 = 0;
    let skipped = 0;
    let failed = 0;

    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionId = sessionDoc.id;
      const session = sessionDoc.data();

      console.log(`\nProcessing session ${sessionId}...`);

      // Skip if no date
      if (!session.date) {
        console.log('  ⊗ Skipping: Missing date');
        skipped++;
        continue;
      }

      // Skip if already has chassisId
      if (session.chassisId) {
        console.log(`  ⊗ Skipping: Already has chassis ID ${session.chassisId}`);
        skipped++;
        continue;
      }

      try {
        // Convert Firestore Timestamp to Date if needed
        const sessionDate = session.date.toDate ? session.date.toDate() : new Date(session.date);
        const sessionYear = sessionDate.getFullYear();

        console.log(`  Session date: ${sessionDate.toISOString()}`);
        console.log(`  Year: ${sessionYear}`);

        // Determine which chassis to use based on year
        if (sessionYear >= 2025) {
          await updateSessionChassis(db, sessionId, chassis2.id, 'CH#2');
          updated2025++;
        } else {
          await updateSessionChassis(db, sessionId, chassis1.id, 'CH#01');
          updatedPre2025++;
        }

      } catch (error) {
        console.error(`  ✗ Error processing session: ${error.message}`);
        failed++;
      }
    }

    console.log('\n=== Update Complete ===');
    console.log(`Total sessions: ${sessionsSnapshot.size}`);
    console.log(`Updated with CH#2 (2025+): ${updated2025}`);
    console.log(`Updated with CH#01 (pre-2025): ${updatedPre2025}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
updateAllSessions()
  .then(() => {
    console.log('\nScript completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
