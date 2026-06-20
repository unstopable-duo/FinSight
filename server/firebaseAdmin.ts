import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, setDoc, doc, limit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let app;
let db: any;

if (fs.existsSync(configPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  // Mock fallback or handle errors gracefully
  db = null;
}

export { db, collection, addDoc, getDocs, query, where, orderBy, setDoc, doc, limit };
