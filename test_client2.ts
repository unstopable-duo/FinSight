import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // default DB

async function test() {
  try {
    await setDoc(doc(db, "test", "init"), { hello: "world" });
    console.log("Success (default DB)");
  } catch(e) {
    console.error(e);
  }
}
test();
