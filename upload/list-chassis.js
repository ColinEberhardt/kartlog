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

async function listChassis() {
  console.log('\n=== Listing All Chassis ===\n');

  try {
    const chassisSnapshot = await db.collection('chassis').get();
    console.log(`Found ${chassisSnapshot.size} chassis:\n`);

    chassisSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  Name: ${data.name || 'N/A'}`);
      console.log(`  Make: ${data.make || 'N/A'}`);
      console.log(`  Model: ${data.model || 'N/A'}`);
      console.log(`  Serial Number: ${data.serialNumber || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listChassis()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
